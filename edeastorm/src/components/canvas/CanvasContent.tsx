'use client';

import { useMemo } from 'react';
import { useNodeStore } from '@/store/nodeStore';
import { NodeController } from './NodeController';
import { StickyNote } from './StickyNote';
import { Header } from './Header';
import { CanvasImage } from './CanvasImage';
import type { CanvasItem } from '@/types/canvas';

interface CanvasContentProps {
  onUpdateItem?: (id: string, updates: Record<string, unknown>) => void;
  onDeleteItem?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  readOnly?: boolean;
}

export function CanvasContent({ onUpdateItem, onDeleteItem, onDragEnd, readOnly }: CanvasContentProps) {
  const nodes = useNodeStore((state) => state.nodes);

  const renderItem = (item: CanvasItem) => {
    switch (item.item_type) {
      case 'sticky_note':
        return (
          <StickyNote
            key={item.id}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            readOnly={readOnly}
          />
        );
      case 'header':
        return (
          <Header
            key={item.id}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            readOnly={readOnly}
          />
        );
      case 'image':
        return (
          <CanvasImage
            key={item.id}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            readOnly={readOnly}
          />
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
