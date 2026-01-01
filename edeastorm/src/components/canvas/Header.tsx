/** @format */

"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import sanitizeHtml from "sanitize-html";
import { Type, Trash2 } from "lucide-react";
import type { CanvasItem } from "@/types/canvas";
import { useNodeStore } from "@/store/nodeStore";
import { htmlDecode } from "@/lib/utils";
import { MAX_NOTE_CONTENT_LENGTH } from "@/lib/constants";

interface HeaderProps {
  data?: CanvasItem;
  htmlRef?: React.RefObject<HTMLDivElement | null>;
  onUpdate?: (id: string, updates: Partial<CanvasItem>) => void;
  onDelete?: (id: string) => void;
}

type HeaderSize = "h1" | "h2" | "h3";

const HEADER_SIZES = {
  h1: { fontSize: "text-5xl", fontWeight: "font-black", lineHeight: "leading-tight" },
  h2: { fontSize: "text-4xl", fontWeight: "font-bold", lineHeight: "leading-snug" },
  h3: { fontSize: "text-3xl", fontWeight: "font-semibold", lineHeight: "leading-normal" },
};

export function Header({ data, htmlRef, onUpdate, onDelete }: HeaderProps) {
  const inputRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

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

  // Get header size - handle both string and number types
  const getHeaderSize = (): HeaderSize => {
    const size = data?.metadata?.textSize;
    if (typeof size === "string" && (size === "h1" || size === "h2" || size === "h3")) {
      return size as HeaderSize;
    }
    return "h2"; // default
  };

  const headerSize = getHeaderSize();
  const sizeStyles = HEADER_SIZES[headerSize];

  // Sanitize config - memoized
  const sanitizeConfig = useMemo(() => ({
    allowedTags: ["br", "b", "i", "u", "strong", "em"],
    allowedAttributes: {},
  }), []);

  // Content state - initialize with data
  const getInitialContent = () => {
    const title = data?.metadata?.title || "Header";
    return sanitizeHtml(title, sanitizeConfig);
  };

  const [content, setContent] = useState(getInitialContent);

  // Handle content change
  const handleChange = useCallback(
    (evt: ContentEditableEvent) => {
      const rawHtml = evt.target.value;
      const sanitized = sanitizeHtml(rawHtml, sanitizeConfig);

      // Enforce max length
      const text = htmlDecode(sanitized);
      if (text && text.length > MAX_NOTE_CONTENT_LENGTH) {
        return;
      }

      setContent(sanitized);
    },
    [sanitizeConfig]
  );

  // Handle blur (save)
  const handleBlur = useCallback(() => {
    if (data?.id && onUpdate) {
      const cleanedContent = content.trim();
      onUpdate(data.id, {
        metadata: {
          ...data.metadata,
          title: cleanedContent || "Header",
        },
      });
    }
    setEditableNode(null);
  }, [data, onUpdate, setEditableNode, content]);

  // Handle double-click to edit
  const handleDoubleClick = useCallback(() => {
    if (data?.id) {
      setEditableNode(data.id);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [data, setEditableNode]);

  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing && data?.id) {
        setSelectedNode(data);
      }
    },
    [data, isEditing, setSelectedNode]
  );

  // Handle size change
  const handleSizeChange = useCallback(
    (newSize: HeaderSize) => {
      if (data?.id && onUpdate) {
        onUpdate(data.id, {
          metadata: {
            ...data.metadata,
            textSize: newSize as any, // Cast to match expected type
          },
        });
      }
      setShowSizePicker(false);
    },
    [data, onUpdate]
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

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <div
      ref={htmlRef}
      className="relative w-full h-full flex items-center justify-center group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizePicker(false);
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: isEditing ? "text" : "pointer",
      }}
    >
      {/* Selection Border */}
      {isSelected && !isDragging && (
        <div className="absolute inset-0 rounded-lg border-3 border-violet-500 pointer-events-none animate-pulse-subtle" />
      )}

      {/* Content */}
      <ContentEditable
        innerRef={inputRef as any}
        html={content}
        disabled={!isEditing}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`
          ${sizeStyles.fontSize} ${sizeStyles.fontWeight} ${sizeStyles.lineHeight}
          text-center outline-none transition-all duration-200 px-4 py-2
          ${
            isEditing
              ? "bg-white/10 backdrop-blur-sm rounded-lg"
              : "bg-transparent"
          }
          ${isDragging ? "opacity-70" : "opacity-100"}
        `}
        style={{
          color: "#fff",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          WebkitUserSelect: isEditing ? "text" : "none",
          userSelect: isEditing ? "text" : "none",
        }}
      />

      {/* Hover Controls */}
      {(isHovered || isSelected) && !isEditing && !isDragging && (
        <div className="absolute top-2 right-2 flex gap-1 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-1 shadow-lg animate-fade-in">
          {/* Size Picker */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSizePicker(!showSizePicker);
              }}
              className="p-2 hover:bg-white/10 rounded transition-colors duration-200"
              title="Change size"
            >
              <Type className="w-4 h-4 text-white" />
            </button>

            {showSizePicker && (
              <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 animate-slide-down">
                {(Object.keys(HEADER_SIZES) as HeaderSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSizeChange(size);
                    }}
                    className={`
                      w-full px-4 py-2 text-left hover:bg-white/10 transition-colors duration-200
                      ${headerSize === size ? "bg-violet-600/30 text-violet-300" : "text-white"}
                    `}
                  >
                    <span className={HEADER_SIZES[size].fontSize.replace("text-", "text-")}>
                      {size.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
