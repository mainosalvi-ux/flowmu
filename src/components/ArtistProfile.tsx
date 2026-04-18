import React, { useEffect, useState } from 'react';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  deleteDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import { UserProfile, Song, Follow } from '../types';
import { Play, CheckCircle, Plus, Trash2, Mail, ExternalLink, MessageCircle, Settings, Upload, Music as MusicIcon, Loader2, Camera, AlertCircle, Info } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

interface ArtistProfileProps {
  artistId: string;
  currentUser: UserProfile | null;
  onPlay: (song: Song) => void;
}

export default function ArtistProfile({ artistId, currentUser, onPlay }: ArtistProfileProps) {
  const [artist, setArtist] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Upload Form State
  const [newSongTitle, setNewSongTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const unsubArtist = onSnapshot(doc(db, 'users', artistId), (snapshot) => {
      if (snapshot.exists()) {
        setArtist({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
      }
      setLoading(false);
    });

    const songsQuery = query(collection(db, 'songs'), where('artistId', '==', artistId));
    const unsubSongs = onSnapshot(songsQuery, (snapshot) => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    if (currentUser) {
      const followId = `${currentUser.uid}_${artistId}`;
      const unsubFollow = onSnapshot(doc(db, 'follows', followId), (snapshot) => {
        setIsFollowing(snapshot.exists());
      });
      return () => {
        unsubArtist();
        unsubSongs();
        unsubFollow();
      };
    }

    return () => {
      unsubArtist();
      unsubSongs();
    };
  }, [artistId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !artist) return;
    const followId = `${currentUser.uid}_${artistId}`;
    const followRef = doc(db, 'follows', followId);
    
    if (isFollowing) {
      await deleteDoc(followRef);
      await updateDoc(doc(db, 'users', artistId), {
        followersCount: increment(-1)
      });
    } else {
      await setDoc(followRef, {
        listenerId: currentUser.uid,
        artistId: artistId,
        createdAt: serverTimestamp()
      });
      const newFollowerCount = (artist.followersCount || 0) + 1;
      await updateDoc(doc(db, 'users', artistId), {
        followersCount: increment(1),
        isVerified: newFollowerCount >= 100 // Auto-verify at 100 followers
      });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSongTitle || !audioFile) return;
    
    setUploadError('');
    setUploadProgress(0);

    try {
      // 1. Upload Cover if exists
      let coverUrl = `https://picsum.photos/seed/${Math.random()}/400/400`;
      if (coverFile) {
        const coverRef = ref(storage, `covers/${currentUser.uid}/${Date.now()}_${coverFile.name}`);
        await uploadBytes(coverRef, coverFile);
        coverUrl = await getDownloadURL(coverRef);
      }

      // 2. Upload Audio
      const audioRef = ref(storage, `songs/${currentUser.uid}/${Date.now()}_${audioFile.name}`);
      const uploadTask = uploadBytesResumable(audioRef, audioFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error: any) => {
          console.error("Upload error:", error);
          if (error.code === 'storage/unauthorized') {
            setUploadError("Error: No tienes permiso para subir. Revisa las reglas de Storage en Firebase.");
          } else if (error.code === 'storage/project-not-found') {
             setUploadError("Error: No se encontró el proyecto de Firebase Storage.");
          } else {
            setUploadError(`Error de subida: ${error.message}. Si dice 'Billing' o 'Plan', lee la guía de abajo.`);
          }
          setUploadProgress(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 3. Save metadata to Firestore
          await addDoc(collection(db, 'songs'), {
            title: newSongTitle,
            artistId: currentUser.uid,
            artistName: currentUser.displayName,
            audioUrl: downloadURL,
            playsCount: 0,
            coverUrl,
            createdAt: serverTimestamp()
          });
          
          setNewSongTitle('');
          setAudioFile(null);
          setCoverFile(null);
          setUploadProgress(null);
          setShowUpload(false);
        }
      );
    } catch (err: any) {
      setUploadError(err.message);
      setUploadProgress(null);
    }
  };

  if (loading) return <div className="p-8">Cargando perfil...</div>;
  if (!artist) return <div className="p-8 text-zinc-500">Músico no encontrado.</div>;

  const isOwner = currentUser?.uid === artistId;

  return (
    <div className="pb-32 overflow-x-hidden">
      {/* Header */}
      <div className="h-[300px] relative flex flex-col justify-end p-8 bg-gradient-to-b from-zinc-700 to-zinc-900 border-b border-zinc-800">
        <div className="flex items-end gap-6 relative z-10">
          <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl bg-zinc-800 flex-shrink-0">
            {artist.photoURL ? (
              <img src={artist.photoURL} alt={artist.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold bg-zinc-800 text-zinc-600">
                {artist.displayName[0]}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wider">Perfil de {artist.role}</span>
              {artist.isVerified && (
                <div className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-400/20">
                  <CheckCircle size={14} fill="currentColor" className="text-white" />
                  Verificado
                </div>
              )}
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-4 flex items-center gap-4">
              {artist.displayName}
            </h1>
            <div className="flex items-center gap-4 text-zinc-300">
              <span className="font-semibold">{artist.followersCount || 0} seguidores</span>
              <span>•</span>
              <span className="font-semibold">{artist.monthlyListeners || 0} oyentes mensuales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-8 bg-black/20 backdrop-blur-sm sticky top-0 z-20 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => songs[0] && onPlay(songs[0])}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black shadow-lg shadow-green-500/20"
          >
            <Play size={24} fill="currentColor" />
          </button>
          
          {!isOwner && currentUser && (
            <button 
              onClick={handleFollow}
              className={`px-6 py-2 rounded-full font-bold border transition-all 
                ${isFollowing ? 'border-zinc-500 text-zinc-300 hover:border-white hover:text-white' : 'border-current text-white hover:scale-105'}`}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
          )}

          {artist.contactInfo && (
            <div className="flex gap-4">
              <a href={`mailto:${artist.contactInfo}`} className="text-zinc-400 hover:text-white transition-colors">
                <Mail size={24} />
              </a>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <MessageCircle size={24} />
              </button>
            </div>
          )}

          {isOwner && (
            <button 
              onClick={() => setShowEditProfile(true)}
              className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all flex items-center justify-center"
              title="Configuración de Perfil"
            >
              <Settings size={22} />
            </button>
          )}
        </div>

        {isOwner && (artist.role === 'artist' || artist.role === 'band') && (
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
          >
            <Plus size={20} /> Publicar Canción
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-6">Canciones Populares</h2>
            <div className="space-y-1">
              {songs.map((song, index) => (
                <div 
                  key={song.id}
                  onClick={() => onPlay(songs[index])}
                  className="flex items-center gap-4 p-3 hover:bg-zinc-800/40 transition-all rounded-lg group cursor-pointer"
                >
                  <span className="w-6 text-center text-zinc-500">{index + 1}</span>
                  <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden">
                    <img src={song.coverUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{song.title}</h4>
                    <p className="text-xs text-zinc-400">Hace poco</p>
                  </div>
                  <div className="text-zinc-500 group-hover:text-white transition-colors">
                    {song.playsCount} reproducciones
                  </div>
                  {isOwner && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        await deleteDoc(doc(db, 'songs', song.id));
                      }}
                      className="p-2 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              {songs.length === 0 && (
                <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  Este artista aún no tiene canciones.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
            <h3 className="font-bold mb-4 text-zinc-300 uppercase tracking-widest text-xs">Sobre el artista</h3>
            <p className="text-zinc-300 leading-relaxed italic">
              {artist.bio || "Este artista prefiere mantener el misterio..."}
            </p>
          </section>

          {artist.contactInfo && (
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
              <h3 className="font-bold mb-4 text-zinc-300 uppercase tracking-widest text-xs">Información de contacto</h3>
              <div className="flex items-center gap-2 text-green-500 font-medium">
                <ExternalLink size={16} />
                <a href={`mailto:${artist.contactInfo}`} className="hover:underline">{artist.contactInfo}</a>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowUpload(false)} />
          <div className="relative bg-zinc-900 w-full max-w-lg rounded-2xl p-8 border border-zinc-700 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6">Publicar nueva canción</h2>
            <form onSubmit={handleUpload} className="space-y-6">
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Título de la canción</label>
                <input 
                  type="text" 
                  required
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Mi Gran Éxito"
                  disabled={uploadProgress !== null}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Archivo de Audio</label>
                <div className="relative">
                  <input 
                    type="file" 
                    required
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="audio-upload"
                    disabled={uploadProgress !== null}
                  />
                  <label 
                    htmlFor="audio-upload"
                    className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-8 cursor-pointer hover:border-green-500 transition-all group
                      ${audioFile ? 'bg-zinc-800 border-green-500' : 'bg-transparent'}`}
                  >
                    {audioFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <MusicIcon className="text-green-500" size={32} />
                        <span className="text-sm font-medium text-white text-center break-all">{audioFile.name}</span>
                        <span className="text-[10px] text-zinc-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="text-zinc-500 group-hover:text-green-500 transition-colors" size={32} />
                        <span className="text-sm text-zinc-400">Seleccionar música</span>
                        <span className="text-[10px] text-zinc-600 font-medium">MP3, WAV, FLAC</span>
                        <p className="text-[9px] text-zinc-500 mt-1 max-w-[200px] text-center">
                          Nota: En entornos como Vercel, el límite es de 4.5MB. En local hasta 20MB.
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Portada de la canción (Opcional)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cover-upload"
                    disabled={uploadProgress !== null}
                  />
                  <label 
                    htmlFor="cover-upload"
                    className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-all group
                      ${coverFile ? 'bg-zinc-800 border-blue-500' : 'bg-transparent'}`}
                  >
                    {coverFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="text-blue-500" size={24} />
                        <span className="text-xs font-medium text-white">{coverFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="text-zinc-500 group-hover:text-blue-500 transition-colors" size={24} />
                        <span className="text-xs text-zinc-400">Seleccionar portada</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase">
                    <span>Subiendo canción...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    disabled={uploadProgress !== null || !audioFile}
                    className="flex-1 bg-green-500 text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadProgress !== null ? <Loader2 className="animate-spin" size={20} /> : null}
                    {uploadProgress !== null ? 'Subiendo...' : 'Publicar Ahora'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUpload(false);
                      setUploadProgress(null);
                      setAudioFile(null);
                    }}
                    className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-full hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Billing/Plan Guide */}
                <div className="mt-8 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-3">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase">
                    <AlertCircle size={14} className="text-yellow-500" />
                    ¿Tienes error al subir? (Plan Error)
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Firebase Storage es **Gratis (5GB)**, pero requiere activación manual. Si ves un error de "Plan" o "Billing":
                  </p>
                  <ol className="text-[10px] text-zinc-400 space-y-1 list-decimal ml-4">
                    <li>Ve a la pestaña **Storage** en tu consola de Firebase.</li>
                    <li>Haz clic en **"Empezar"** (Default Bucket).</li>
                    <li>Elige el plan **Spark (Gratis)** si te lo pide.</li>
                    <li>En **Rules**, pega: <code className="text-[9px] bg-black p-1 rounded">allow read, write: if request.auth != null;</code></li>
                  </ol>
                  <div className="flex items-center gap-1 text-[9px] text-green-500 font-medium">
                    <Info size={10} />
                    Esto habilitará las subidas directas en Vercel y Netlify.
                  </div>
                </div>
              </form>
            </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isOwner && currentUser && (
        <EditProfileModal 
          user={currentUser} 
          isOpen={showEditProfile} 
          onClose={() => setShowEditProfile(false)} 
        />
      )}
    </div>
  );
}
