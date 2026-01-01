/** @format */

"use client";

import { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { CanvasItem } from "@/types/canvas";
import { useNodeStore } from "@/store/nodeStore";
import Image from "next/image";

interface CanvasImageProps {
  data?: CanvasItem;
  htmlRef?: React.RefObject<HTMLDivElement | null>;
  onUpdate?: (id: string, updates: Partial<CanvasItem>) => void;
  onDelete?: (id: string) => void;
}

export function CanvasImage({ data, htmlRef, onDelete }: CanvasImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    selectedNode,
    setSelectedNode,
    isDraggingNode,
  } = useNodeStore();

  const isSelected = selectedNode?.id === data?.id;
  const isDragging = isDraggingNode === data?.id;

  const imageUrl = data?.metadata?.url;
  const imageAlt = data?.metadata?.alt || "Canvas image";

  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data?.id) {
        setSelectedNode(data);
      }
    },
    [data, setSelectedNode]
  );

  // Handle delete
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data?.id && onDelete) {
        onDelete(data.id);
      }
    },
    [data, onDelete]
  );

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800/50 rounded-lg border border-zinc-700">
        <p className="text-zinc-400 text-sm">No image</p>
      </div>
    );
  }

  return (
    <div
      ref={htmlRef}
      className="relative w-full h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        cursor: "pointer",
      }}
    >
      {/* Selection Border */}
      {isSelected && !isDragging && (
        <div className="absolute inset-0 rounded-lg border-3 border-violet-500 pointer-events-none animate-pulse-subtle" />
      )}

      {/* Image */}
      <div
        className={`
          relative w-full h-full rounded-lg overflow-hidden bg-zinc-800/50 border border-zinc-700/50
          transition-all duration-200
          ${isDragging ? "opacity-70" : "opacity-100"}
        `}
      >
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-contain"
            onError={() => setImageError(true)}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Failed to load image</p>
          </div>
        )}
      </div>

      {/* Hover Controls */}
      {(isHovered || isSelected) && !isDragging && (
        <div className="absolute top-2 right-2 flex gap-1 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-1 shadow-lg animate-fade-in">
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-500/20 rounded transition-colors duration-200 group/delete"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400 group-hover/delete:text-red-300" />
          </button>
        </div>
      )}
    </div>
  );
}
