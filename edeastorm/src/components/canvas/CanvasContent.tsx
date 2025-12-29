'use client';

import { useMemo } from 'react';
import { useNodeStore } from '@/store/nodeStore';
import { NodeController } from './NodeController';
import { StickyNote } from './StickyNote';
import type { CanvasItem } from '@/types/canvas';

interface CanvasContentProps {
  onUpdateItem?: (id: string, updates: Record<string, unknown>) => void;
  onDeleteItem?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
}

export function CanvasContent({ onUpdateItem, onDeleteItem, onDragEnd }: CanvasContentProps) {
  const nodes = useNodeStore((state) => state.nodes);

  const renderItem = (item: CanvasItem) => {
    switch (item.item_type) {
      case 'sticky_note':
        return (
          <StickyNote
            key={item.id}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
          />
        );
      case 'header':
        return (
          <div
            key={item.id}
            className="w-full h-full flex items-center justify-center bg-transparent"
          >
            <h2 className="text-2xl font-bold text-white/80">
              {item.metadata?.title || 'Header'}
            </h2>
          </div>
        );
      case 'image':
        return (
          <div
            key={item.id}
            className="w-full h-full rounded-lg overflow-hidden bg-zinc-800"
          >
            {item.metadata?.url && (
              <img
                src={item.metadata.url}
                alt={item.metadata?.alt || 'Image'}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const content = useMemo(() => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div id="stickies-container" className="stickies">
        {nodes.map((item) => (
          <NodeController
            key={item.id}
            data={item}
            snap={true}
            onDragEnd={onDragEnd}
          >
            {renderItem(item) as React.ReactElement}
          </NodeController>
        ))}
      </div>
    );
  }, [nodes, onUpdateItem, onDeleteItem, onDragEnd]);

  return <>{content}</>;
}
