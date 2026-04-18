import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserRole } from '../types';
import { Music, User as UserIcon, Users } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('listener');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Musician ' + Math.floor(Math.random() * 1000),
          photoURL: user.photoURL,
          role: 'listener', // Default for Google login, they can change later
          followersCount: 0,
          monthlyListeners: 0,
          isVerified: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email,
          displayName,
          role,
          followersCount: 0,
          monthlyListeners: 0,
          isVerified: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-2xl border border-zinc-800">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2">
            <Music size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold">FlowMu</h1>
          <p className="text-zinc-400 text-center">
            {isLogin ? 'Bienvenido de nuevo' : 'Únete a la comunidad musical'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="Tu nombre o nombre de banda"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Tipo de Perfil</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'listener', label: 'Oyente', icon: UserIcon },
                    { id: 'artist', label: 'Artista', icon: Music },
                    { id: 'band', label: 'Banda', icon: Users }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setRole(btn.id as UserRole)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all
                        ${role === btn.id ? 'bg-green-500 border-green-500 text-black' : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <btn.icon size={16} />
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black font-bold py-3 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Procesando...' : isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">O continúa con</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-bold py-3 rounded-full flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Google
        </button>

        <p className="mt-8 text-center text-sm text-zinc-400">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white font-bold ml-1 hover:underline"
          >
            {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
