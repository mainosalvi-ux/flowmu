import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Mail, 
  Save, 
  Music, 
  Users, 
  User as UserIcon,
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ user, isOpen, onClose }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [contactInfo, setContactInfo] = useState(user.contactInfo || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setRole(user.role);
      setContactInfo(user.contactInfo || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        role,
        contactInfo,
        photoURL
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#181818] w-full max-w-2xl rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Editar Perfil</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer w-32 h-32">
              <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden ring-4 ring-zinc-700 group-hover:ring-green-500 transition-all">
                {photoURL ? (
                  <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-600">
                    {displayName[0]}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <div className="w-full max-w-sm">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">URL de Imagen de Perfil</label>
                <input 
                  type="text" 
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://..."
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nombre Público</label>
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Tipo de Artista</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'listener', label: 'Oyente', icon: UserIcon },
                    { id: 'artist', label: 'Músico Solista', icon: Music },
                    { id: 'band', label: 'Banda', icon: Users }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setRole(btn.id as UserRole)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-all
                        ${role === btn.id ? 'bg-green-500 border-green-500 text-black font-bold' : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <btn.icon size={18} />
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Biografía</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-lg p-3 text-sm h-[130px] resize-none focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Cuéntanos tu historia..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Email de Contacto (Público)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <input 
                    type="email" 
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-zinc-800 border-none rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="contacto@musica.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <Award size={14} /> Estadísticas del perfil
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2">
                <p className="text-2xl font-bold">{user.followersCount}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Seguidores</p>
                {user.followersCount < 100 && (
                  <p className="text-[8px] text-zinc-600 mt-1">Faltan {100 - user.followersCount} para Verificado</p>
                )}
              </div>
              <div className="text-center p-2">
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  {user.isVerified ? <CheckCircle size={18} className="text-blue-400" /> : 'No'}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase">Verificado</p>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2 rounded-full font-bold hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-white text-black px-8 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
