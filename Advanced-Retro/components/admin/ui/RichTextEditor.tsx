'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[240px] rounded-b-2xl border border-t-0 border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4 text-sm text-[var(--admin-text)] focus:outline-none',
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)]/70">
      <div className="flex flex-wrap gap-2 border-b border-[var(--admin-border)] p-3 text-xs text-[var(--admin-text-muted)]">
        <button type="button" className="rounded-full border border-[var(--admin-border)] px-3 py-1" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </button>
        <button type="button" className="rounded-full border border-[var(--admin-border)] px-3 py-1" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </button>
        <button type="button" className="rounded-full border border-[var(--admin-border)] px-3 py-1" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Lista
        </button>
        <button type="button" className="rounded-full border border-[var(--admin-border)] px-3 py-1" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
