'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { SupabaseProvider } from '@/lib/SupabaseProvider';

interface CollaborativeEditorProps {
  documentId: string;
  placeholder?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  className?: string;
  initialContent?: string;
}

export function CollaborativeEditor({
  documentId,
  placeholder = 'Start typing...',
  onUpdate,
  editable = true,
  className = '',
  initialContent = '',
}: CollaborativeEditorProps) {
  const providerRef = useRef<SupabaseProvider | null>(null);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);
  const initializedRef = useRef(false);

  // Create Y.Doc once using useMemo
  const ydoc = useMemo(() => new Y.Doc(), []);

  const editor = useEditor({
    immediatelyRender: false, // Required for SSR/Next.js
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    editable,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || initializedRef.current) return;

    initializedRef.current = true;

    // Setup IndexedDB for offline persistence
    persistenceRef.current = new IndexeddbPersistence(`yjs-doc-${documentId}`, ydoc);

    persistenceRef.current.whenSynced.then(() => {
      console.log('✓ Loaded from IndexedDB');

      // If document is empty and we have initial content, set it
      if (editor.isEmpty && initialContent && !ydoc.getText('prosemirror').toString()) {
        editor.commands.setContent(initialContent);
      }

      // Setup Supabase provider for real-time sync
      providerRef.current = new SupabaseProvider(ydoc, {
        supabase,
        documentId,
        onSynced: () => {
          console.log('✓ Synced with Supabase');
        },
      });
    });

    return () => {
      // Cleanup
      providerRef.current?.destroy();
      persistenceRef.current?.destroy();
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, documentId]);

  if (!editor) {
    return <div className={className}>Loading editor...</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none dark:prose-invert focus:outline-none"
      />
    </div>
  );
}
