
// Automated Test Suite for Lanna Intel Platform
// Simulates Unit and E2E checks in the browser environment

import { fetchRealtimeFlights, fetchShodanWebcams, fetchCurrencyRates, sendSystemEmail } from './api';
import { dbService, STORES } from './db';

interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'running';
    message?: string;
    duration?: number;
}

export const runAutomatedTests = async (updateCallback: (results: TestResult[]) => void) => {
    const results: TestResult[] = [];
    const addResult = (res: TestResult) => {
        results.push(res);
        updateCallback([...results]);
    };

    // --- UNIT TESTS: API Connectivity ---
    
    // Test 1: Flight Data
    addResult({ name: 'API: FlightRadar24 Connectivity', status: 'running' });
    const t1Start = performance.now();
    try {
        const flights = await fetchRealtimeFlights({ north: 20, south: 17, east: 100, west: 97 });
        addResult({ 
            name: 'API: FlightRadar24 Connectivity', 
            status: Array.isArray(flights) ? 'pass' : 'fail', 
            message: `Retrieved ${flights.length} flights`,
            duration: performance.now() - t1Start 
        });
    } catch(e) {
        addResult({ name: 'API: FlightRadar24 Connectivity', status: 'fail', message: 'Exception caught' });
    }

    // Test 2: Database Integrity
    addResult({ name: 'System: DB Read/Write', status: 'running' });
    const t2Start = performance.now();
    try {
        await dbService.add(STORES.SETTINGS, { key: 'test_key', value: 'test_value' });
        const val = await dbService.getSetting('test_key');
        await dbService.delete(STORES.SETTINGS, 'test_key');
        
        addResult({
            name: 'System: DB Read/Write',
            status: val === 'test_value' ? 'pass' : 'fail',
            duration: performance.now() - t2Start
        });
    } catch(e) {
        addResult({ name: 'System: DB Read/Write', status: 'fail', message: 'IndexedDB error' });
    }

    // Test 3: Shodan API (Mock check or real)
    addResult({ name: 'OSINT: Shodan Recon', status: 'running' });
    const t3Start = performance.now();
    try {
        const webcams = await fetchShodanWebcams();
        addResult({
            name: 'OSINT: Shodan Recon',
            status: Array.isArray(webcams) ? 'pass' : 'fail',
            message: `Found ${webcams.length} assets`,
            duration: performance.now() - t3Start
        });
    } catch(e) {
        addResult({ name: 'OSINT: Shodan Recon', status: 'fail' });
    }

    // --- E2E CHECKS: DOM & Component Validation (Simulated) ---
    
    // Test 4: Map Rendering
    addResult({ name: 'E2E: Map Container Mount', status: 'running' });
    const mapContainer = document.querySelector('.leaflet-container');
    addResult({
        name: 'E2E: Map Container Mount',
        status: mapContainer ? 'pass' : 'fail',
        message: mapContainer ? 'Leaflet instance found' : 'DOM Element missing'
    });

    // Test 5: Config Validation
    addResult({ name: 'Config: API Keys Presence', status: 'running' });
    // @ts-ignore
    const { API_KEYS } = await import('./config');
    const missingKeys = Object.entries(API_KEYS).filter(([k, v]) => !v || v === '').map(([k]) => k);
    addResult({
        name: 'Config: API Keys Presence',
        status: missingKeys.length === 0 || (missingKeys.length === 1 && missingKeys[0] === 'VIRUSTOTAL') ? 'pass' : 'fail', // VT is optional initially
        message: missingKeys.length > 0 ? `Missing: ${missingKeys.join(', ')}` : 'All Critical Keys Loaded'
    });

    // Test 6: Mailtrap Connectivity (Dry Run)
    addResult({ name: 'Integration: Email Service', status: 'running' });
    const t6Start = performance.now();
    const emailRes = await sendSystemEmail('test@lanna-lens.com', 'Unit Test', 'Diagnostics Check');
    addResult({
        name: 'Integration: Email Service',
        status: emailRes ? 'pass' : 'fail',
        message: emailRes ? 'Mailtrap API Accepted' : 'API Rejected (Check Keys)',
        duration: performance.now() - t6Start
    });
};
