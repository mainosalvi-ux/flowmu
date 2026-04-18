import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Song } from './types';

// Components
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Auth from './components/Auth';
import Home from './components/Home';
import ArtistProfile from './components/ArtistProfile';
import Feed from './components/Feed';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState({ view: 'home', id: '' });
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        // Using onSnapshot to keep user profile in sync (verified status, followers, etc.)
        const unsubUser = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleNavigate = (view: string, id: string = '') => {
    setCurrentView({ view, id });
  };

  const handleLogout = () => {
    signOut(auth);
    setCurrentView({ view: 'home', id: '' });
  };

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          user={user} 
          onNavigate={handleNavigate} 
          currentView={currentView.view}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800/20 to-black relative">
          <div className="sticky top-0 z-50 h-16 pointer-events-none bg-gradient-to-b from-black/50 to-transparent" />
          
          {currentView.view === 'home' && <Home onNavigate={handleNavigate} onPlay={handlePlay} />}
          {currentView.view === 'profile' && (
            <ArtistProfile 
              artistId={currentView.id || user.uid} 
              currentUser={user}
              onPlay={handlePlay} 
            />
          )}
          {currentView.view === 'feed' && <Feed user={user} onNavigate={handleNavigate} />}
          
          {/* Placeholders for other views */}
          {['search', 'liked'].includes(currentView.view) && (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
              <h2 className="text-2xl font-bold mb-2">Próximamente</h2>
              <p>Esta sección está en desarrollo para la versión 2.0</p>
            </div>
          )}
        </main>
      </div>

      <Player currentSong={currentSong} />
    </div>
  );
}
