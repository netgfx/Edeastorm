// @ts-nocheck
'use client';

import { useCallback, useRef } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { useGSAP } from '@gsap/react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';
import { useEditorStore } from '@/store/editorStore';
import { useNodeStore } from '@/store/nodeStore';
import { findCenter } from '@/lib/utils';
import { ZoomControls } from './ZoomControls';

gsap.registerPlugin(Draggable);

interface InfiniteCanvasProps {
  children?: React.ReactNode;
  outerChildren?: React.ReactNode;
}

export function InfiniteCanvas({ children, outerChildren }: InfiniteCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);


  const { canvasScale, setCanvasScale, setCursorPosition, activeTool, theme } = useEditorStore();
  const { setSelectedNode, setEditableNode } = useNodeStore();
  const { contextSafe } = useGSAP({ scope: wrapperRef });

  // Initialize draggable
  const initializeDrag = useCallback(() => {
    
    if (Draggable.get(mainAreaRef.current)) {
      console.log("draggable kill")
      Draggable.get(mainAreaRef.current).kill();
    }
    
    Draggable.create(mainAreaRef.current, {
      type: 'x,y',
      bounds: '#wrapperContainer',
      dragClickables: false,
      trigger: '#fake-area',
      autoScroll: 1,
      allowContextMenu: true,
      allowEventDefault: true,
      dragResistance: 0.15,
      onClick: () => {
        setSelectedNode(null);
        setEditableNode(null);
      },
      onDragStart: () => {
        
        const wrapper = document.getElementById('wrapperContainer');
        wrapper?.classList.add('cursor-grabbing');
        wrapper?.classList.remove('cursor-grab');
      },
      onDragEnd: () => {
        
        const wrapper = document.getElementById('wrapperContainer');
        wrapper?.classList.add('cursor-grab');
        wrapper?.classList.remove('cursor-grabbing');
      }
    });
  }, []);

  // Recenter canvas
  const recenter = useCallback(() => {
    gsap.to('#draggable-area', {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
      transformOrigin: 'center center',
    });

    const { x, y } = findCenter();

    gsap.to('#draggable-area', {
      x: -x,
      y: -y,
      duration: 0.2,
      ease: 'power2.out',
    });

    setCanvasScale(1.0);
  }, [setCanvasScale]);

  // Zoom handler
  const onZoom = contextSafe((scale: number) => {
    gsap.to('#draggable-area', {
      scale: Number(scale.toFixed(2)),
      duration: 0.1,
      ease: 'power1.out',
      transformOrigin: 'center center',
    });
  });

  const handleZoom = useCallback(
    (delta: number, centered = false) => {
      let scale = canvasScale;
      const sign = delta > 0 ? -1 : 1;
      const adjustAmount = Math.min(0.5, Math.abs(delta) * 0.001);
      scale = scale + adjustAmount * sign;

      scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
      setCanvasScale(Number(scale.toFixed(2)));
      onZoom(scale);
    },
    [canvasScale, setCanvasScale, onZoom]
  );

  // Wheel zoom
  useGSAP(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoom(e.deltaY);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleZoom]);

  // Initialize canvas
  useGSAP(() => {
    initializeDrag();

    const timeout = gsap.delayedCall(0.3, () => {
      recenter();
    });

    return () => {
      timeout.kill();
      if (Draggable.get('.draggable-area')) {
        Draggable.get('.draggable-area').kill();
      }
    };
  }, [initializeDrag, recenter]);

  // Track cursor position for adding new items
  const handleMouseMove = (e: React.MouseEvent) => {
    if (mainAreaRef.current) {
      const rect = mainAreaRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvasScale;
      const y = (e.clientY - rect.top) / canvasScale;
      setCursorPosition({ x, y });
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden z-0 transition-colors duration-700 ${
      theme === 'dark' ? 'bg-[#010101]' : 'bg-[#f5f5f7]'
    }`}>
      {/* Canvas wrapper - The interaction layer */}
      <div
        ref={wrapperRef}
        id="wrapperContainer"
        className="draggable-wrapper absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing z-10"
        onMouseMove={handleMouseMove}
      >
        {/* Fake area for receiving drag events (the clickable background) */}
        <div
          id="fake-area"
          className="absolute inset-0 z-0"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'transparent',
            pointerEvents: 'auto',
          }}
        />

        {/* Draggable canvas area - The content layer */}
        <div
          ref={mainAreaRef}
          id="draggable-area"
          className="draggable-area absolute z-10 pointer-events-none"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transformOrigin: 'center center',
          }}
        >
          {/* Background grid - Internal to draggable area so it pans */}
          <div
            id="canvas-surface"
            className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundImage: theme === 'dark' 
                ? `linear-gradient(rgba(255, 215, 0, 0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255, 215, 0, 0.05) 1px, transparent 1px)`
                : `linear-gradient(rgba(109, 40, 217, 0.12) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(109, 40, 217, 0.12) 1px, transparent 1px)`,
              backgroundSize: '50px 50px, 50px 50px',
              backgroundPosition: 'center center',
            }}
          />
          {children}
        </div>
      </div>

      {/* UI overlays - Higher z-index, handles its own pointer events */}
      <div className="absolute inset-0 pointer-events-none z-40">
        <div className="relative w-full h-full">
          {outerChildren}
          
          {/* Zoom controls inside the UI layer */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
            <ZoomControls
              scale={canvasScale}
              onZoomIn={() => handleZoom(-100)}
              onZoomOut={() => handleZoom(100)}
              onRecenter={recenter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
