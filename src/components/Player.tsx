import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Volume2, 
  ListMusic 
} from 'lucide-react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
}

export default function Player({ currentSong }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentSong) {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedPercent = x / rect.width;
      audioRef.current.currentTime = clickedPercent * duration;
    }
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, x / rect.width));
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
    }
  };

  if (!currentSong) return (
    <div className="h-24 bg-black border-t border-zinc-900 px-4 flex items-center justify-center text-zinc-500 italic">
      Selecciona una canción para empezar a escuchar
    </div>
  );

  return (
    <div className="h-24 bg-black border-t border-zinc-900 px-4 flex items-center justify-between gap-4">
      <audio 
        ref={audioRef}
        src={currentSong.audioUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      {/* Song Info */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-14 h-14 bg-zinc-800 rounded flex-shrink-0 overflow-hidden shadow-lg">
          {currentSong.coverUrl ? (
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListMusic className="text-zinc-600" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate hover:underline cursor-pointer">
            {currentSong.title}
          </h4>
          <p className="text-xs text-zinc-400 truncate hover:text-white cursor-pointer transition-colors">
            {currentSong.artistName}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-full">
        <div className="flex items-center gap-6 text-zinc-400">
          <button className="hover:text-white transition-colors">
            <Shuffle size={18} />
          </button>
          <button className="hover:text-white transition-colors">
            <SkipBack size={20} />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button className="hover:text-white transition-colors">
            <SkipForward size={20} />
          </button>
          <button className="hover:text-white transition-colors">
            <Repeat size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-[10px] text-zinc-400 min-w-[32px]">{formatTime(currentTime)}</span>
          <div 
            className="h-1 flex-1 bg-zinc-600 rounded-full group cursor-pointer relative overflow-hidden"
            onClick={handleProgressChange}
          >
            <div 
              className="absolute left-0 top-0 h-full bg-white group-hover:bg-green-500 rounded-full" 
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 min-w-[32px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Extra */}
      <div className="flex items-center justify-end gap-3 w-1/3 text-zinc-400">
        <Volume2 size={20} className="hover:text-white transition-colors cursor-pointer" />
        <div 
          className="w-24 h-1 bg-zinc-600 rounded-full overflow-hidden cursor-pointer"
          onClick={handleVolumeChange}
        >
          <div className="h-full bg-white hover:bg-green-500" style={{ width: `${volume * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
