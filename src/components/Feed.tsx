import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Post } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Trash2, Image as ImageIcon } from 'lucide-react';

interface FeedProps {
  user: UserProfile | null;
  onNavigate: (view: string, id?: string) => void;
}

export default function Feed({ user, onNavigate }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim()) return;

    await addDoc(collection(db, 'posts'), {
      artistId: user.uid,
      artistName: user.displayName,
      content: newPost,
      createdAt: serverTimestamp()
    });
    setNewPost('');
  };

  if (loading) return <div className="p-8">Cargando feed...</div>;

  const canPost = user?.role === 'artist' || user?.role === 'band';

  return (
    <div className="p-8 max-w-2xl mx-auto pb-32">
      <h1 className="text-3xl font-bold mb-8">Novedades y Adelantos</h1>

      {canPost && (
        <form onSubmit={handleCreatePost} className="bg-zinc-900/50 p-6 rounded-2xl mb-12 border border-zinc-800">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <textarea
                placeholder="¡Cuéntales algo nuevo a tus seguidores!"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-lg placeholder:text-zinc-600"
                rows={3}
              />
              <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
                <button type="button" className="text-zinc-500 hover:text-green-500 transition-colors">
                  <ImageIcon size={20} />
                </button>
                <button 
                  disabled={!newPost.trim()}
                  className="bg-green-500 text-black px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-zinc-900/30 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onNavigate('profile', post.artistId)}
              >
                <div className="w-10 h-10 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center font-bold text-zinc-600">
                    {post.artistName[0]}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold group-hover:underline">{post.artistName}</h4>
                  <p className="text-xs text-zinc-500">
                    {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: es }) : 'Recién publicado'}
                  </p>
                </div>
              </div>
              {user?.uid === post.artistId && (
                <button 
                  onClick={() => deleteDoc(doc(db, 'posts', post.id))}
                  className="text-zinc-500 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <p className="text-zinc-300 leading-relaxed text-lg">
              {post.content}
            </p>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No hay actualizaciones todavía. ¡Sigue a tus artistas favoritos!
          </div>
        )}
      </div>
    </div>
  );
}
