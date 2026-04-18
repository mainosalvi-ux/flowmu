import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Song } from '../types';
import { Play, CheckCircle, TrendingUp } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string, id?: string) => void;
  onPlay: (song: Song) => void;
}

export default function Home({ onNavigate, onPlay }: HomeProps) {
  const [topArtists, setTopArtists] = useState<UserProfile[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trending Artists (by monthly listeners or followers)
    const artistsQuery = query(
      collection(db, 'users'),
      orderBy('followersCount', 'desc'),
      limit(5)
    );

    // Popular Songs
    const songsQuery = query(
      collection(db, 'songs'),
      orderBy('playsCount', 'desc'),
      limit(10)
    );

    const unsubArtists = onSnapshot(artistsQuery, (snapshot) => {
      setTopArtists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    const unsubSongs = onSnapshot(songsQuery, (snapshot) => {
      setTopSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    });

    return () => {
      unsubArtists();
      unsubSongs();
    };
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-zinc-500">Cargando música...</div>;

  return (
    <div className="p-8 space-y-12 pb-32">
      {/* Hero Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          Ranking de Músicos <TrendingUp className="text-green-500" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {topArtists.map((artist, index) => (
            <div 
              key={artist.uid}
              onClick={() => onNavigate('profile', artist.uid)}
              className="bg-zinc-900/50 p-4 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-2 left-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center font-bold text-green-500 z-10">
                #{index + 1}
              </div>
              <div className="aspect-square rounded-full overflow-hidden mb-4 shadow-2xl relative">
                {artist.photoURL ? (
                  <img src={artist.photoURL} alt={artist.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-4xl font-bold text-zinc-600">
                    {artist.displayName[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={48} fill="white" className="text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold truncate">{artist.displayName}</h3>
                {artist.isVerified && <CheckCircle size={14} className="text-blue-400 fill-blue-400/20" />}
              </div>
              <p className="text-sm text-zinc-400 capitalize">{artist.role}</p>
              <p className="text-xs text-zinc-500 mt-2">{artist.followersCount} seguidores</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Songs */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Canciones más escuchadas</h2>
        <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
          {topSongs.map((song, index) => (
            <div 
              key={song.id}
              onClick={() => onPlay(song)}
              className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 transition-all cursor-pointer group"
            >
              <span className="w-8 text-center text-zinc-500 group-hover:text-white">{index + 1}</span>
              <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                {song.coverUrl && <img src={song.coverUrl} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{song.title}</h4>
                <p 
                  className="text-sm text-zinc-400 hover:underline inline-block"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('profile', song.artistId);
                  }}
                >
                  {song.artistName}
                </p>
              </div>
              <div className="text-sm text-zinc-500 mr-4">
                {song.playsCount} reproduc.
              </div>
            </div>
          ))}
          {topSongs.length === 0 && (
            <div className="p-8 text-center text-zinc-500 italic">
              Aún no hay canciones publicadas.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
