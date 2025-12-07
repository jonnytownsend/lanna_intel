
import React, { useEffect, useState } from 'react';
import { dbService, STORES } from '../services/db';
import { AppSettings, MapVersion, FlightIntegrityReport } from '../types';
import { API_KEYS, ADMIN_EMAIL } from '../services/config';
import { sendSystemEmail, backfillFlightData, verifyFlightIntegrity } from '../services/api';
import { getRegionStatus, syncRegionMap } from '../services/offlineMap';
import { runAutomatedTests } from '../services/tests';
import { useToast } from '../services/toastContext';
import { Button, Form, Grid, Header, Icon, Input, Segment, Progress, Checkbox, Message } from 'semantic-ui-react';
import { logger } from '../services/logger';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    geminiKey: API_KEYS.GEMINI,
    elevenLabsKey: API_KEYS.ELEVENLABS,
    shodanKey: API_KEYS.SHODAN,
    flightRadarKey: API_KEYS.FLIGHTRADAR24,
    nasaKey: API_KEYS.NASA,
    openWeatherKey: API_KEYS.OPENWEATHER,
    virusTotalKey: '',
    builtWithKey: '',
    hunterKey: '',
    hibpKey: '',
    theme: 'dark',
    notifications: true,
    notifyPush: true,
    notifyApp: true,
    notifyEmail: false
  });
  const [saved, setSaved] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  
  // Test Suite State
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);
  
  // Offline Map State
  const [mapSyncProgress, setMapSyncProgress] = useState(0);
  const [mapSyncStatus, setMapSyncStatus] = useState('');
  const [isSyncingMap, setIsSyncingMap] = useState(false);
  const [regionVersion, setRegionVersion] = useState<MapVersion | null>(null);
  
  // Flight Ops State
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillCount, setBackfillCount] = useState(0);
  const [integrityReport, setIntegrityReport] = useState<FlightIntegrityReport | null>(null);
  
  const { addToast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const stored = await dbService.getSetting('global_config');
      if (stored) {
        setSettings(prev => ({...prev, ...stored}));
      }
      
      const v = await getRegionStatus();
      setRegionVersion(v);
    };
    loadSettings();
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({...prev, [field]: value}));
    setSaved(false);
  };

  const saveSettings = async () => {
    await dbService.saveSetting('global_config', settings);
    logger.info('User updated system configuration', 'Settings');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestEmail = async () => {
      setEmailSending(true);
      const success = await sendSystemEmail(ADMIN_EMAIL, 'Lanna Intel: Diagnostics Test', 'This is a test alert from the Lanna Intel Platform.\n\nSystem is online.');
      setEmailSending(false);
      
      if(success) {
          addToast('success', 'Email Sent', `Test alert dispatched to ${ADMIN_EMAIL}.`);
          logger.success(`Test email sent to ${ADMIN_EMAIL}`, 'System');
      } else {
          addToast('error', 'Email Failed', 'Check API Keys or Network.');
          logger.error('Failed to send test email', 'System');
      }
  };

  const runTests = () => {
      setTestsRunning(true);
      setTestResults([]);
      runAutomatedTests((results) => {
          setTestResults(results);
          if(results.every(r => r.status !== 'running')) setTestsRunning(false);
      });
  };

  // --- MAP SYNC ---
  const handleSyncMap = async () => {
      setIsSyncingMap(true);
      setMapSyncProgress(0);
      setMapSyncStatus('Initializing handshake...');
      
      const success = await syncRegionMap((pct, status) => {
          setMapSyncProgress(pct);
          setMapSyncStatus(status);
      });
      
      if(success) {
          addToast('success', 'Region Synced', 'Chiang Mai + 50mi vectors updated successfully.');
          const v = await getRegionStatus();
          setRegionVersion(v);
      } else {
          addToast('error', 'Sync Failed', 'Could not update region vectors.');
      }
      
      setIsSyncingMap(false);
  };

  // --- FLIGHT OPS ---
  const handleBackfill = async () => {
      setIsBackfilling(true);
      const count = await backfillFlightData(7); // Backfill 7 days
      setBackfillCount(count);
      setIsBackfilling(false);
      addToast('success', 'Backfill Complete', `Simulated ${count} historical records.`);
  };

  const handleIntegrityCheck = async () => {
      const report = await verifyFlightIntegrity();
      setIntegrityReport(report);
      
      if(report.status === 'repaired') {
          addToast('warning', 'Database Repaired', `Removed ${report.invalidTimestamps + report.futureTimestamps + report.duplicates} corrupted records.`);
      } else {
          addToast('success', 'Integrity Verified', 'Flight database is clean and consistent.');
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden relative">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <Header as='h1' inverted>
            <Icon name='settings' />
            <Header.Content>
              System Configuration
              <Header.Subheader>Backend Config • API Credentials • System Diagnostics</Header.Subheader>
            </Header.Content>
          </Header>
        </div>
        <Button 
          primary={!saved}
          color={saved ? 'green' : 'teal'}
          onClick={saveSettings}
          icon={saved ? 'check' : 'save'}
          content={saved ? 'Configuration Saved' : 'Save Changes'}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <Grid columns={2} stackable>
            
            {/* LEFT COL: API Keys & Notifications */}
            <Grid.Column>
                {/* Notification Settings */}
                <Segment inverted color='blue'>
                    <Header as='h4' icon='bell' content='Notification Channels' inverted />
                    <Form inverted>
                        <Form.Group grouped>
                            <label>Alert Preferences</label>
                            <Form.Field>
                                <Checkbox 
                                    toggle 
                                    label='In-App Logging (System Alerts)'
                                    checked={settings.notifyApp}
                                    onChange={(e, data) => handleChange('notifyApp', data.checked)}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Checkbox 
                                    toggle 
                                    label='Browser Push Notifications'
                                    checked={settings.notifyPush}
                                    onChange={(e, data) => handleChange('notifyPush', data.checked)}
                                />
                            </Form.Field>
                            <Form.Field>
                                <Checkbox 
                                    toggle 
                                    label='Email Alerts (Critical Only)'
                                    checked={settings.notifyEmail}
                                    onChange={(e, data) => handleChange('notifyEmail', data.checked)}
                                />
                            </Form.Field>
                        </Form.Group>
                    </Form>
                </Segment>

                <Segment inverted>
                    <Header as='h4' icon='key' content='API Credential Vault' inverted />
                    <Form inverted>
                        <Form.Field>
                            <label>Google Gemini API (v3)</label>
                            <Input type="password" value={settings.geminiKey} onChange={(e) => handleChange('geminiKey', e.target.value)} icon='google' />
                        </Form.Field>
                        <Form.Group widths='equal'>
                            <Form.Field>
                                <label>11Labs API Key</label>
                                <Input type="password" value={settings.elevenLabsKey} onChange={(e) => handleChange('elevenLabsKey', e.target.value)} />
                            </Form.Field>
                            <Form.Field>
                                <label>Shodan API Key</label>
                                <Input type="password" value={settings.shodanKey} onChange={(e) => handleChange('shodanKey', e.target.value)} />
                            </Form.Field>
                        </Form.Group>
                        <Form.Field>
                            <label>VirusTotal API Key</label>
                            <Input type="password" value={settings.virusTotalKey} onChange={(e) => handleChange('virusTotalKey', e.target.value)} />
                        </Form.Field>
                    </Form>
                </Segment>

                <Segment inverted color='red'>
                    <Header as='h4' icon='database' content='Local Storage' inverted />
                    <p className="text-sm text-slate-400">Purge cached map tiles, search history, and recordings.</p>
                    <Button color='red' basic fluid content='Purge Cache DB' icon='trash' />
                </Segment>
            </Grid.Column>

            {/* RIGHT COL: Diagnostics & Alerts */}
            <Grid.Column>
                
                {/* REGION SENTINEL (MAP MANAGER) */}
                <Segment inverted className="border-l-4 border-l-purple-500">
                    <Header as='h4' icon='map' content='Region Sentinel' inverted subheader='Offline Vector Intelligence' />
                    
                    <div className="bg-slate-900 p-4 rounded border border-slate-700 mb-4 flex items-center gap-4">
                        <Icon name='crosshairs' size='large' color='purple' />
                        <div className="flex-1">
                            <div className="font-bold text-white">Chiang Mai + 50mi (Active)</div>
                            <div className="text-xs text-slate-500">
                                Vectors: {regionVersion?.featureCount || 0} • Last Sync: {regionVersion ? new Date(regionVersion.lastCheck).toLocaleString() : 'Never'}
                            </div>
                        </div>
                    </div>
                        
                    {isSyncingMap && (
                        <div className="mb-4">
                            <Progress percent={mapSyncProgress} indicating size='tiny' inverted active>
                                {mapSyncStatus}
                            </Progress>
                        </div>
                    )}

                    <Button 
                        color='purple' 
                        onClick={handleSyncMap} 
                        disabled={isSyncingMap}
                        loading={isSyncingMap}
                        icon='refresh'
                        fluid
                        content={isSyncingMap ? 'Syncing...' : 'Force Sync Delta Update'}
                    />
                </Segment>

                {/* FLIGHT OPS BACKFILL */}
                <Segment inverted className="border-l-4 border-l-cyan-500">
                    <Header as='h4' icon='plane' content='Flight Data Ops' inverted subheader='Historical Backfill & Integrity' />
                    
                    <Grid columns={2}>
                        <Grid.Column>
                            <Button 
                                color='teal' 
                                basic 
                                fluid 
                                onClick={handleBackfill}
                                loading={isBackfilling}
                                icon='history'
                                content='Backfill (7 Days)'
                            />
                            {backfillCount > 0 && <div className="text-center text-xs text-green-400 mt-2">+{backfillCount} Records</div>}
                        </Grid.Column>
                        <Grid.Column>
                            <Button 
                                color='orange' 
                                basic 
                                fluid 
                                onClick={handleIntegrityCheck}
                                icon='shield check'
                                content='Verify DB'
                            />
                        </Grid.Column>
                    </Grid>

                    {integrityReport && (
                        <Message size='mini' color={integrityReport.status === 'clean' ? 'green' : 'yellow'} className="mt-4">
                            <Message.Header>
                                {integrityReport.status === 'clean' ? 'Database Healthy' : 'Repairs Applied'}
                            </Message.Header>
                            <div className="flex flex-col gap-1 mt-1 text-xs">
                                <div>Total Valid Records: <strong>{integrityReport.totalRecords}</strong></div>
                                {integrityReport.status === 'repaired' && (
                                    <>
                                        <div>Fixed Invalid Timestamps: {integrityReport.invalidTimestamps}</div>
                                        <div>Fixed Future Dates: {integrityReport.futureTimestamps}</div>
                                        <div>Removed Duplicates: {integrityReport.duplicates}</div>
                                    </>
                                )}
                            </div>
                        </Message>
                    )}
                </Segment>

                {/* Automated Test Suite */}
                <Segment inverted>
                    <div className="flex justify-between items-center mb-4">
                        <Header as='h4' icon='heartbeat' content='Automated Test Suite' inverted className="m-0" />
                        <Button 
                            size='mini' 
                            color='green' 
                            basic 
                            onClick={runTests} 
                            loading={testsRunning}
                            icon='play'
                            content='Run All'
                        />
                    </div>
                    
                    <div className="bg-black/50 rounded p-4 min-h-[100px] max-h-[200px] overflow-y-auto font-mono text-xs">
                        {testResults.length === 0 && <div className="text-slate-600 text-center py-8">Ready...</div>}
                        {testResults.map((res, i) => (
                            <div key={i} className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                                <div className="flex items-center gap-2">
                                    {res.status === 'running' && <Icon loading name='spinner' />}
                                    {res.status === 'pass' && <Icon name='check circle' color='green' />}
                                    {res.status === 'fail' && <Icon name='times circle' color='red' />}
                                    <span className={res.status === 'fail' ? 'text-red-300' : 'text-slate-300'}>{res.name}</span>
                                </div>
                                <div className="text-right text-slate-500">
                                    {res.duration && `${res.duration.toFixed(0)}ms`}
                                </div>
                            </div>
                        ))}
                    </div>
                </Segment>

            </Grid.Column>
         </Grid>
      </div>
      
      <div className="mt-6 text-center text-[10px] text-slate-600 font-mono">
         Lanna Intel Platform • Version 2.9.0 • Region Sentinel Active
      </div>
    </div>
  );
};

export default SettingsPage;
