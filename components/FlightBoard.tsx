
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchFlightSchedule } from '../services/api';
import { FlightSchedule } from '../types';
import { Table, Header, Icon, Label, Button } from 'semantic-ui-react';
import { logger } from '../services/logger';
import { useToast } from '../services/toastContext';

const FlightBoard: React.FC = () => {
  const [mode, setMode] = useState<'arrivals' | 'departures'>('arrivals');
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [filterType, setFilterType] = useState<'all' | 'domestic' | 'international'>('all');
  const [flights, setFlights] = useState<FlightSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Track previous state to detect changes for alerts
  const prevFlightsRef = useRef<Map<string, string>>(new Map());
  const { addToast } = useToast();

  const loadFlights = async () => {
    setLoading(true);
    const data = await fetchFlightSchedule('VTCC', mode);
    
    // Check for status changes
    data.forEach(f => {
        const key = `${f.flight}-${f.time}`;
        const lastStatus = prevFlightsRef.current.get(key);
        
        // If we have a previous status and it's different
        if (lastStatus && lastStatus !== f.status) {
            // Check for negative statuses
            if (f.status.toLowerCase().includes('delayed') || f.status.toLowerCase().includes('cancelled') || f.status.toLowerCase().includes('diverted')) {
                const msg = `Flight ${f.flight} (${f.airline}) changed from ${lastStatus} to ${f.status}`;
                logger.warn(msg, 'FlightRadar24');
                addToast('warning', `Flight Alert: ${f.flight}`, msg);
            } else if (f.status.toLowerCase().includes('landed')) {
                const msg = `Flight ${f.flight} has landed.`;
                logger.success(msg, 'FlightRadar24');
                addToast('success', 'Arrival', msg);
            }
        }
        prevFlightsRef.current.set(key, f.status);
    });

    setFlights(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFlights();
    const interval = setInterval(loadFlights, 60000); // Poll every min
    return () => clearInterval(interval);
  }, [mode]);

  // Optimized Filter Logic using useMemo
  const filteredFlights = useMemo(() => {
      return flights.filter(f => {
          const targetCode = mode === 'arrivals' ? f.originCode : f.destCode;
          const isDomestic = targetCode && targetCode.startsWith('VT');
          
          if (filterType === 'all') return true;
          if (filterType === 'domestic') return isDomestic;
          if (filterType === 'international') return !isDomestic;
          return true;
      });
  }, [flights, filterType, mode]);

  // Intel Simulation Generators
  const getPaxLoad = (flightCode: string) => {
      const seed = flightCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return Math.floor(120 + (seed % 200)); // Mock pax
  };

  return (
    <div className="h-full w-full bg-slate-950 p-4 md:p-6 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 shrink-0">
          <div>
            <Header as='h2' inverted>
                <Icon name='plane' rotated={mode === 'departures' ? undefined : 'clockwise'} color={mode === 'departures' ? 'blue' : 'green'} />
                <Header.Content>
                    CNX {mode.toUpperCase()}
                    <Header.Subheader>
                        {day === 'today' ? new Date().toLocaleDateString() : new Date(Date.now() + 86400000).toLocaleDateString()}
                    </Header.Subheader>
                </Header.Content>
            </Header>
          </div>
          
          <Button.Group size='tiny'>
             <Button icon='refresh' onClick={loadFlights} loading={loading} inverted />
             <Button.Or />
             <Button inverted color={mode === 'arrivals' ? 'green' : 'grey'} onClick={() => setMode('arrivals')}>ARR</Button>
             <Button inverted color={mode === 'departures' ? 'blue' : 'grey'} onClick={() => setMode('departures')}>DEP</Button>
          </Button.Group>
        </div>

        {/* Filter Bar */}
        <div className="mb-4">
            <Button.Group size='mini' compact>
                <Button inverted basic={filterType !== 'all'} color='teal' onClick={() => setFilterType('all')}>ALL</Button>
                <Button inverted basic={filterType !== 'domestic'} color='purple' onClick={() => setFilterType('domestic')}>DOMESTIC</Button>
                <Button inverted basic={filterType !== 'international'} color='orange' onClick={() => setFilterType('international')}>INTL</Button>
            </Button.Group>
        </div>

        {/* Board Container */}
        <div className="flex-1 overflow-auto custom-scrollbar border rounded-lg border-slate-800 bg-slate-900">
            <Table inverted celled selectable compact='very' fixed>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell width={2}>Time</Table.HeaderCell>
                        <Table.HeaderCell width={2}>Flight</Table.HeaderCell>
                        <Table.HeaderCell width={4}>{mode === 'arrivals' ? 'Origin' : 'Destination'}</Table.HeaderCell>
                        <Table.HeaderCell width={4}>Airline</Table.HeaderCell>
                        <Table.HeaderCell width={2} textAlign='center'>PAX (Est)</Table.HeaderCell>
                        <Table.HeaderCell width={2} textAlign='center'>Status</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {filteredFlights.length === 0 && !loading && (
                        <Table.Row>
                            <Table.Cell colSpan={6} textAlign='center' disabled>No flights found matching filters.</Table.Cell>
                        </Table.Row>
                    )}
                    {filteredFlights.map((flight, idx) => (
                        <Table.Row key={idx}>
                            <Table.Cell className="font-mono text-cyan-400 font-bold">{flight.time}</Table.Cell>
                            <Table.Cell>
                                <Label size='tiny' color='grey' horizontal>{flight.flight}</Label>
                            </Table.Cell>
                            <Table.Cell>
                                <div className="truncate">{flight.airport}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{mode === 'arrivals' ? flight.originCode : flight.destCode}</div>
                            </Table.Cell>
                            <Table.Cell className="text-slate-400">{flight.airline}</Table.Cell>
                            <Table.Cell textAlign='center' className="font-mono">{getPaxLoad(flight.flight)}</Table.Cell>
                            <Table.Cell textAlign='center'>
                                <Label 
                                    size='tiny' 
                                    color={flight.status.toLowerCase().includes('landed') ? 'green' : flight.status.toLowerCase().includes('cancelled') ? 'red' : 'yellow'}
                                >
                                    {flight.status}
                                </Label>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </div>
        
        {/* Footer */}
        <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Total Flights: {filteredFlights.length}</span>
            <span>Real-time Status Monitoring Active</span>
        </div>
      </div>
    </div>
  );
};

export default FlightBoard;
