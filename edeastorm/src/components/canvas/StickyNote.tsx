/** @format */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import sanitizeHtml from "sanitize-html";
import { Trash2, Palette } from "lucide-react";
import type { CanvasItem } from "@/types/canvas";
import { useNodeStore } from "@/store/nodeStore";
import { darkenColor, htmlDecode } from "@/lib/utils";
import {
  NOTE_COLORS,
  DEFAULT_NOTE_COLOR,
  MAX_NOTE_CONTENT_LENGTH,
} from "@/lib/constants";
import { ResizeHandle } from "./ResizeHandle";

interface StickyNoteProps {
  data?: CanvasItem;
  htmlRef?: React.RefObject<HTMLDivElement | null>;
  onUpdate?: (id: string, updates: Partial<CanvasItem>) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export function StickyNote({
  data,
  htmlRef,
  onUpdate,
  onDelete,
  readOnly,
}: StickyNoteProps) {
  const inputRef = useRef<HTMLElement>(null);
  const contentRef = useRef("");
  const [isHovered, setIsHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    selectedNode,
    setSelectedNode,
    editableNode,
    setEditableNode,
    isDraggingNode,
  } = useNodeStore();

  const isSelected = selectedNode?.id === data?.id;
  const isEditing = editableNode === data?.id;
  const isDragging = isDraggingNode === data?.id;

  const color = data?.metadata?.color || DEFAULT_NOTE_COLOR;

  // Handle color change
  const handleColorChange = useCallback(
    (newColor: string) => {
      if (data?.id && onUpdate) {
        onUpdate(data.id, {
          metadata: {
            ...data.metadata,
            color: newColor,
          },
        });
      }
      setShowColorPicker(false);
    },
    [data, onUpdate]
  );

  // Handle Resize
  const handleResizeEnd = useCallback(
    (width: number, height: number) => {
      if (data?.id && onUpdate) {
        onUpdate(data.id, {
          metadata: {
            ...data.metadata,
            size: { width, height },
          },
        });
      }
    },
    [data, onUpdate]
  );

  // Sanitize config
  const sanitizeConf = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "recursiveEscape" as const,
  };
  // ... rest of the logic ...

  // Handle double click to edit
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (data?.id) {
        setEditableNode(data.id);
      }
    },
    [data?.id, setEditableNode]
  );

  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data) {
        setSelectedNode(data);
      }
    },
    [data, setSelectedNode]
  );

  // Handle content change
  const handleChange = (evt: ContentEditableEvent) => {
    const newValue = evt.target.value;
    if (newValue.length <= MAX_NOTE_CONTENT_LENGTH) {
      contentRef.current = newValue;
    }
  };

  // Handle blur - save content
  const handleBlur = useCallback(() => {
    const sanitized = sanitizeHtml(contentRef.current, sanitizeConf);
    if (data?.id && onUpdate) {
      onUpdate(data.id, {
        metadata: {
          ...data.metadata,
          title: sanitized,
        },
      });
    }
    setEditableNode(null);
  }, [data, onUpdate, setEditableNode]);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
    // Prevent excessive content
    if (
      inputRef.current &&
      inputRef.current.innerHTML.length >= MAX_NOTE_CONTENT_LENGTH &&
      ![
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // Handle delete
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (readOnly) return;
      if (data?.id && onDelete) {
        onDelete(data.id);
      }
    },
    [data?.id, onDelete, readOnly]
  );

  // Focus when editing
  useEffect(() => {
    if (isEditing && inputRef.current && !readOnly) {
      inputRef.current.focus();
      // Select all text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing, readOnly]);

  // Sync content from data
  const displayContent = useMemo(() => {
    const title = data?.metadata?.title || "Add text...";
    const decoded = htmlDecode(title);
    contentRef.current = decoded || title;
    return contentRef.current;
  }, [data?.metadata?.title]);

  if (!data) return null;

  return (
    <div
      className="relative w-full h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={!readOnly ? handleClick : undefined}
    >
      {/* Selection indicator */}
      {isSelected && !readOnly && (
        <div
          className="absolute -inset-1 rounded-lg border-2 border-violet-500 pointer-events-none"
          style={{ boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }}
        />
      )}

      {/* Note body */}
      <div
        ref={htmlRef}
        className="w-full h-full transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col relative overflow-hidden"
        style={{
          backgroundColor: NOTE_COLORS[color] || color,
          boxShadow: isDragging
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : isHovered
            ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          transform: isDragging ? "scale(1.05) rotate(2deg)" : "scale(1)",
          borderRadius: "2px", // Slightly squared corners like real post-its
          borderBottomRightRadius: "25px 5px", // Eared look
        }}
      >
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>

        {/* Content wrapper */}
        <div
          className="relative w-full h-full flex items-center justify-center p-4"
          onDoubleClick={!readOnly ? handleDoubleClick : undefined}
        >
          <ContentEditable
            innerRef={inputRef as React.RefObject<HTMLElement>}
            html={displayContent}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={!isEditing || readOnly}
            className="w-full text-center text-zinc-900 leading-snug outline-none"
            style={{
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              fontSize: data.metadata?.textSize
                ? `${data.metadata.textSize}px`
                : "16px",
              cursor: isEditing ? "text" : readOnly ? "default" : "grab",
              pointerEvents: isEditing ? "auto" : "none",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          />
        </div>
      </div>

      {/* Color picker button */}
      {isSelected && (
        <div className="absolute -top-3 -left-3 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="w-8 h-8 bg-zinc-950 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 border border-zinc-800 hover:bg-zinc-800 hover:scale-110 group/color"
            title="Change color"
          >
            <Palette className="w-4 h-4 text-zinc-400 group-hover/color:text-violet-400" />
          </button>

          {/* Color picker dropdown */}
          {showColorPicker && (
            <div className="absolute top-10 left-0 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-2 flex gap-1.5">
              {Object.entries(NOTE_COLORS).map(([colorKey, colorValue]) => (
                <button
                  key={colorKey}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange(colorKey);
                  }}
                  className="w-8 h-8 rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: colorValue,
                    borderColor: color === colorKey ? "#8b5cf6" : "transparent",
                  }}
                  title={colorKey}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete button (Outside overflow-hidden) */}
      {isSelected && !readOnly && (
        <button
          onClick={handleDelete}
          className="absolute -top-3 -right-3 w-8 h-8 bg-zinc-950 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-200 border border-zinc-800 hover:bg-zinc-800 z-50 group/delete"
        >
          <Trash2 className="w-4 h-4 text-red-400 group-hover/delete:text-red-300" />
        </button>
      )}

      {/* Resize Handle */}
      {isSelected && !readOnly && (
        <ResizeHandle nodeId={data.id} onResizeEnd={handleResizeEnd} />
      )}
    </div>
  );
}
