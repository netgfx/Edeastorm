'use client';

import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNodeStore } from '@/store/nodeStore';
import { useEditorStore } from '@/store/editorStore';
import { TILE_WIDTH, TILE_HEIGHT } from '@/lib/constants';

interface ResizeHandleProps {
  nodeId: string;
  onResizeEnd: (width: number, height: number) => void;
}

export function ResizeHandle({ nodeId, onResizeEnd }: ResizeHandleProps) {
  const isResizingRef = useRef(false);
  const { canvasScale } = useEditorStore();
  
  const initialData = useRef({
    mouseX: 0,
    mouseY: 0,
    width: 0,
    height: 0
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;

    const deltaX = (e.clientX - initialData.current.mouseX) / canvasScale;
    const deltaY = (e.clientY - initialData.current.mouseY) / canvasScale;

    const newWidth = Math.max(TILE_WIDTH, initialData.current.width + deltaX);
    const newHeight = Math.max(TILE_HEIGHT, initialData.current.height + deltaY);

    gsap.set(`#node-${nodeId}`, {
      width: newWidth,
      height: newHeight
    });
  }, [nodeId, canvasScale]);

  const handleMouseUp = useCallback(() => {
    if (!isResizingRef.current) return;
    
    isResizingRef.current = false;
    document.body.style.cursor = '';
    
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      const width = parseFloat(gsap.getProperty(nodeElement, 'width') as string);
      const height = parseFloat(gsap.getProperty(nodeElement, 'height') as string);
      onResizeEnd(width, height);
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [nodeId, handleMouseMove, onResizeEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isResizingRef.current = true;
    document.body.style.cursor = 'nwse-resize';

    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      initialData.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        width: parseFloat(gsap.getProperty(nodeElement, 'width') as string),
        height: parseFloat(gsap.getProperty(nodeElement, 'height') as string)
      };
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [nodeId, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center group/resize"
      onMouseDown={handleMouseDown}
    >
      <div className="w-2.5 h-2.5 bg-violet-500/40 rounded-sm border border-violet-500/60 group-hover/resize:bg-violet-500 group-hover/resize:scale-110 transition-all duration-200" />
    </div>
  );
}
