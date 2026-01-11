// @ts-nocheck
'use client';

import { useRef, useCallback, useEffect, createContext, useContext, cloneElement } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/all';
import { useGSAP } from '@gsap/react';
import type { CanvasItem, DraggableContextType } from '@/types/canvas';
import { getHypotenuse } from '@/lib/utils';

gsap.registerPlugin(Draggable);

const DraggableContext = createContext<DraggableContextType>({});

export const useDraggable = () => useContext(DraggableContext);

interface NodeControllerProps {
  data: CanvasItem;
  children: React.ReactElement;
  snap?: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
}

export function NodeController({ data, children, snap = true, onDragEnd }: NodeControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainDraggable = useRef<Draggable | null>(null);
  const htmlRef = useRef<HTMLDivElement | null>(null);

  // Get snap points from other nodes
  const getSnapPoints = useCallback(() => {
    const points: { x: number; y: number }[] = [];
    const snapAreas = Array.from(document.getElementsByClassName('snap-area')).filter(
      (area) => area.getAttribute('data-id') !== data.id
    );

    snapAreas.forEach((area) => {
      const rect = area.getBoundingClientRect();
      const xPos = Number(gsap.getProperty(area, 'x'));
      const yPos = Number(gsap.getProperty(area, 'y'));

      // Add corner and center points
      points.push(
        { x: xPos, y: yPos },
        { x: xPos + rect.width, y: yPos },
        { x: xPos, y: yPos + rect.height },
        { x: xPos + rect.width, y: yPos + rect.height },
        { x: xPos + rect.width / 2, y: yPos + rect.height / 2 }
      );
    });

    return points;
  }, [data.id]);

  // Snap check function
  const snapCheck = useCallback(
    (value: gsap.Point2D) => {
      const snapPoints = getSnapPoints();
      let bestSnapValue = value;
      const snapRadius = 20; // Reduced from 25
      let closestDistance = Infinity;

      const target = mainDraggable.current?.target;
      if (!target) return value;

      const rect = target.getBoundingClientRect();
      const xPos = value.x;
      const yPos = value.y;

      // Check current element's corner and center points based on proposed position
      const currentPoints = [
        { x: xPos, y: yPos, offsetX: 0, offsetY: 0 },
        { x: xPos + rect.width, y: yPos, offsetX: rect.width, offsetY: 0 },
        { x: xPos, y: yPos + rect.height, offsetX: 0, offsetY: rect.height },
        { x: xPos + rect.width, y: yPos + rect.height, offsetX: rect.width, offsetY: rect.height },
        { x: xPos + rect.width / 2, y: yPos + rect.height / 2, offsetX: rect.width / 2, offsetY: rect.height / 2 },
      ];

      currentPoints.forEach((dragPoint) => {
        snapPoints.forEach((snapPoint) => {
          const distance = getHypotenuse(snapPoint.x, snapPoint.y, dragPoint.x, dragPoint.y);

          if (distance < snapRadius && distance < closestDistance) {
            closestDistance = distance;
            bestSnapValue = {
              x: snapPoint.x - dragPoint.offsetX,
              y: snapPoint.y - dragPoint.offsetY,
            };
          }
        });
      });

      return bestSnapValue;
    },
    [getSnapPoints]
  );

  // Initialize draggable
  useGSAP(() => {
    if (!data) return;

    mainDraggable.current = Draggable.create(containerRef.current, {
      type: 'x,y',
      edgeResistance: 0.65,
      bounds: '#draggable-area',
      autoScroll: 1,
      trigger: htmlRef.current ?? containerRef.current,
      inertia: true,
      clickable: true,
      minimumMovement: 5,
      activeCursor: 'grabbing',
      allowContextMenu: true,
      onDragStart: function () {
        // Mark as dragging in store to prevent realtime updates
        const { setIsDraggingNode } = require('@/store/nodeStore').useNodeStore.getState();
        setIsDraggingNode(data.id);
      },
      onDragEnd: function () {
        const x = Number(gsap.getProperty(this.target, 'x'));
        const y = Number(gsap.getProperty(this.target, 'y'));
        
        // Clear dragging state
        const { setIsDraggingNode } = require('@/store/nodeStore').useNodeStore.getState();
        setIsDraggingNode(null);
        
        // Send final position to server
        onDragEnd?.(data.id, x, y);
      },
      onPress: function (e) {
        e.stopPropagation();
        gsap.set(this.target, { zIndex: Draggable.zIndex++ });
      },
      liveSnap: snap
        ? {
            points: snapCheck,
            radius: 20,
          }
        : false,
    })[0];

    // Set initial position
    if (data.x !== undefined && data.y !== undefined) {
      gsap.set(`#node-${data.id}`, { x: data.x, y: data.y });
    }

    // Set initial z-index
    gsap.set(`#node-${data.id}`, { zIndex: Draggable.zIndex++ });

    return () => {
      if (mainDraggable.current) {
        mainDraggable.current.kill();
      }
    };
  }, [data, snap, snapCheck, onDragEnd]);

  // Update position when data changes
  useEffect(() => {
    if (data.x !== undefined && data.y !== undefined && containerRef.current) {
      const currentX = Number(gsap.getProperty(containerRef.current, 'x'));
      const currentY = Number(gsap.getProperty(containerRef.current, 'y'));

      // Only update if significantly different (to avoid fighting with drag)
      if (Math.abs(currentX - data.x) > 5 || Math.abs(currentY - data.y) > 5) {
        gsap.set(containerRef.current, { x: data.x, y: data.y });
      }
    }
  }, [data.x, data.y]);

  return (
    <DraggableContext.Provider
      value={{
        draggableInstance: mainDraggable.current,
        htmlRef: htmlRef,
        data: data,
      }}
    >
      <div
        id={`node-${data.id}`}
        className="snap-area absolute"
        data-id={data.id}
        style={{
          pointerEvents: 'auto',
          width: data.metadata?.size?.width ?? 140,
          height: data.metadata?.size?.height ?? 140,
          top: 0,
          left: 0,
        }}
        ref={containerRef}
      >
        {children && cloneElement(children as any, { data, htmlRef })}
      </div>
    </DraggableContext.Provider>
  );
}
