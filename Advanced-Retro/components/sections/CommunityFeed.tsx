'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function CommunityFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [sending, setSending] = useState(false);

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/community/posts', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar publicaciones');
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const publish = async () => {
    const images = imageUrls
      .split(/\n|,|;/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

    setSending(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, images }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo publicar');

      setTitle('');
      setContent('');
      setImageUrls('');
      setPosts((prev) => [data.post, ...prev]);
      toast.success('Publicación creada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo publicar');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section">
      <div className="container grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="glass p-6">
          <h2 className="title-display text-3xl">Comunidad Retro</h2>
          <p className="text-textMuted mt-2">
            Blog social de usuarios: compras, restauraciones, curiosidades y consejos.
          </p>

          <div className="mt-4 space-y-3">
            <input
              className="w-full bg-transparent border border-line px-3 py-2"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-transparent border border-line px-3 py-2 min-h-[120px]"
              placeholder="Comparte tu experiencia retro..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <textarea
              className="w-full bg-transparent border border-line px-3 py-2 min-h-[70px]"
              placeholder="URLs de fotos (opcional, separadas por línea)"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
            />
            <button className="button-primary" onClick={publish} disabled={sending}>
              {sending ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="font-semibold mb-3">Últimas publicaciones</h3>
          <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {posts.length === 0 ? (
              <p className="text-textMuted text-sm">Aún no hay publicaciones.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="border border-line p-3">
                  <p className="font-semibold">{post.title}</p>
                  <p className="text-xs text-textMuted mt-1">
                    {post.user?.name || post.user?.email || 'Usuario'} · {new Date(post.created_at).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-textMuted mt-2 whitespace-pre-wrap">{post.content}</p>
                  {Array.isArray(post.images) && post.images.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {post.images.slice(0, 4).map((image: string) => (
                        <a key={image} href={image} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate">
                          {image}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
