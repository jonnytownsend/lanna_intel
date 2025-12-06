
/**
 * GEOSPATIAL INTELLIGENCE UTILITIES
 * Core math for Region Sentinel module.
 */

// 1 Mile in Kilometers
const MILE_TO_KM = 1.60934;

// WGS84 Constants
const EARTH_RADIUS_KM = 6378.137;

export interface BoundingBox {
    north: number;
    south: number;
    east: number;
    west: number;
}

/**
 * Calculates a Bounding Box given a center point and radius in miles.
 */
export const calculateBoundingBox = (lat: number, lng: number, radiusMiles: number): BoundingBox => {
    const radiusKm = radiusMiles * MILE_TO_KM;
    
    // Latitude Delta (1 deg ≈ 111km)
    const deltaLat = radiusKm / 111.32;
    
    // Longitude Delta (1 deg ≈ 111km * cos(lat))
    const deltaLng = radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180)));

    return {
        north: lat + deltaLat,
        south: lat - deltaLat,
        east: lng + deltaLng,
        west: lng - deltaLng
    };
};

/**
 * Validates if a point is within a Bounding Box
 */
export const isInsideBBox = (lat: number, lng: number, bbox: BoundingBox): boolean => {
    return lat <= bbox.north && lat >= bbox.south && lng <= bbox.east && lng >= bbox.west;
};

/**
 * Formats BBox for Overpass API (South, West, North, East)
 */
export const toOverpassBBox = (bbox: BoundingBox): string => {
    return `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
};
