
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { RadioStation } from '../types';
import { logger } from './logger';
import { useToast } from './toastContext';

interface PlayerContextType {
  isPlaying: boolean;
  currentStation: RadioStation | null;
  playStation: (station: RadioStation) => void;
  stopStation: () => void;
  volume: number;
  setVolume: (vol: number) => void;
  isLoading: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";
    
    // Event Listeners
    const audio = audioRef.current;
    
    const onPlay = () => { setIsPlaying(true); setIsLoading(false); logger.info('Audio Started'); };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = (e: any) => {
        setIsLoading(false);
        setIsPlaying(false);
        const msg = audio.error ? `Error Code: ${audio.error.code}` : 'Network Error';
        logger.error(`Stream Failed: ${msg}`);
        addToast('error', 'Stream Failed', `Could not connect to ${currentStation?.name || 'station'}. ${msg}`);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('playing', onCanPlay);
        audio.removeEventListener('error', onError);
    };
  }, [currentStation]); // Re-bind if station ref changes (though ref logic implies we don't need to)

  // Handle Volume
  useEffect(() => {
      if(audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playStation = (station: RadioStation) => {
    if(!audioRef.current) return;
    
    // Stop current if playing
    audioRef.current.pause();
    
    setCurrentStation(station);
    setIsLoading(true);
    
    audioRef.current.src = station.url;
    audioRef.current.load();
    
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            setIsLoading(false);
            logger.error('Playback prevented', error);
            addToast('error', 'Playback Error', 'Browser blocked autoplay or stream is offline.');
        });
    }
  };

  const stopStation = () => {
      if(audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = ""; // Unload
      }
      setIsPlaying(false);
      setCurrentStation(null);
  };

  return (
    <PlayerContext.Provider value={{ isPlaying, currentStation, playStation, stopStation, volume, setVolume, isLoading }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
};
