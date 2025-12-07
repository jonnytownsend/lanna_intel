
import { dbService } from './db';
import { calculateBoundingBox } from './geo';
import { REGION_CENTER, API_URLS } from './config';
import { MapFeature, MapVersion } from '../types';
import { logger } from './logger';

const REGION_ID = 'chiang_mai_50mi';
const RADIUS_MILES = 50;

/**
 * OFFLINE MAP MANAGER
 * Handles the "Handshake" logic for delta updates.
 */

export const getRegionStatus = async (): Promise<MapVersion | null> => {
    return await dbService.getSetting(`map_version_${REGION_ID}`) as MapVersion | null;
};

const classifyFeature = (tags: any): 'infra' | 'hotel' | 'traffic' | 'gov' => {
    if (!tags) return 'infra';
    if (tags.amenity === 'police' || tags.amenity === 'hospital' || tags.amenity === 'fire_station') return 'infra';
    if (tags.tourism === 'hotel' || tags.tourism === 'hostel') return 'hotel';
    if (tags.government) return 'gov';
    if (tags.highway === 'traffic_signals') return 'traffic';
    return 'infra';
};

/**
 * Fetches only new/changed features from Overpass
 */
const fetchOverpassDelta = async (bbox: string): Promise<MapFeature[]> => {
    // Note: Overpass API doesn't strictly support "since" queries easily without diffs.
    // We construct a query for CRITICAL INTEL: Police, Hospitals, Gov, Hotels, Traffic Signals.
    const query = `
        [out:json][timeout:60];
        (
          node["amenity"~"police|hospital|fire_station"](${bbox});
          node["tourism"~"hotel|hostel"](${bbox});
          node["government"](${bbox});
          node["highway"="traffic_signals"](${bbox});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await fetch(API_URLS.OVERPASS_API, {
            method: 'POST',
            body: query
        });
        
        if (!response.ok) throw new Error('Overpass connection failed');
        const data = await response.json();
        
        // Transform to our MapFeature schema
        const features: MapFeature[] = data.elements
            .filter((el: any) => el.lat && el.lon) // Only nodes for now to keep it simple/light
            .map((el: any) => ({
                id: el.id.toString(),
                type: el.type,
                category: classifyFeature(el.tags),
                tags: el.tags || {},
                lat: el.lat,
                lng: el.lon,
                updatedAt: new Date().toISOString(),
                region: REGION_ID
            }));
            
        return features;
    } catch (e) {
        logger.error('Failed to fetch vector delta', 'OfflineMap', e);
        return [];
    }
};

export const syncRegionMap = async (onProgress: (pct: number, status: string) => void): Promise<boolean> => {
    try {
        onProgress(5, 'Calculating geospatial bounds...');
        const bbox = calculateBoundingBox(REGION_CENTER.lat, REGION_CENTER.lng, RADIUS_MILES);
        const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;

        onProgress(20, 'Requesting vector delta from Overpass...');
        const features = await fetchOverpassDelta(bboxStr);

        if (features.length === 0) {
            logger.warn('No features returned from sync', 'OfflineMap');
            onProgress(100, 'Sync Complete (No changes)');
            return true;
        }

        onProgress(60, `Indexing ${features.length} features...`);
        // Batch insert into Vector Store
        await dbService.batchAddFeatures(features);

        onProgress(90, 'Updating region metadata...');
        const currentVersion = await getRegionStatus();
        const newVersion: MapVersion = {
            region: REGION_ID,
            version: (currentVersion?.version || 0) + 1,
            lastCheck: new Date().toISOString(),
            featureCount: features.length,
            bbox: bbox
        };

        await dbService.saveSetting(`map_version_${REGION_ID}`, newVersion);
        
        onProgress(100, 'Sync Complete');
        logger.success(`Region ${REGION_ID} synced successfully (${features.length} vectors)`, 'OfflineMap');
        return true;

    } catch (e) {
        logger.error('Map Sync Critical Failure', 'OfflineMap', e);
        onProgress(0, 'Sync Failed');
        return false;
    }
};
