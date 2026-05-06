'use client';

import Image from 'next/image';
import { GripVertical, UploadCloud, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ADMIN_IMAGE_BUCKET } from '@/lib/admin/constants';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function ImageUpload({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const items = useMemo(() => value.filter(Boolean), [value]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error('Supabase no está disponible en el navegador.');
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const extension = file.name.split('.').pop() || 'jpg';
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
        const { error } = await supabase.storage.from(ADMIN_IMAGE_BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from(ADMIN_IMAGE_BUCKET).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      onChange([...items, ...uploaded]);
      toast.success('Imágenes subidas correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron subir las imágenes');
    } finally {
      setUploading(false);
    }
  };

  const reorder = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-2)]/60 px-6 py-10 text-center text-sm text-[var(--admin-text-muted)] transition hover:border-[var(--admin-primary)]"
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-[var(--admin-primary)]" />
        <span className="font-medium text-[var(--admin-text)]">Arrastra imágenes o pulsa para subir</span>
        <span className="mt-1">{uploading ? 'Subiendo...' : 'PNG, JPG o WEBP · múltiples archivos'}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void uploadFiles(event.target.files)} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="group rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex == null || dragIndex === index) return;
              reorder(dragIndex, index);
              setDragIndex(null);
            }}
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/20">
              <Image src={item} alt={`Imagen ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                onClick={() => onChange(items.filter((_, current) => current !== index))}
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-[var(--admin-primary)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  Principal
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--admin-text-muted)]">
              <GripVertical className="h-4 w-4" /> Arrastra para reordenar
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
