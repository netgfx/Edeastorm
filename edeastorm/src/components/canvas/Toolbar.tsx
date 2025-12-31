/** @format */

"use client";

import {
  StickyNote,
  ImageIcon,
  Type,
  MousePointer2,
  Hand,
  Trash2,
  Save,
  Sun,
  Moon,
  Upload,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useNodeStore } from "@/store/nodeStore";
import { cn } from "@/lib/utils";
import type { ToolType } from "@/types/canvas";
import { ImageUploadModal } from "./ImageUploadModal";

interface ToolbarProps {
  onAddNote?: () => void;
  onAddImage?: () => void;
  onAddHeader?: () => void;
  onSave?: () => void;
  boardId?: string;
  boardShortId?: string;
  isCreator?: boolean;
  onImageUploadComplete?: () => void;
}

const tools: { id: ToolType; icon: React.ElementType; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "note", icon: StickyNote, label: "Add Note" },
  { id: "image", icon: ImageIcon, label: "Add Image" },
  { id: "header", icon: Type, label: "Add Header" },
];

export function Toolbar({
  onAddNote,
  onAddImage,
  onAddHeader,
  onSave,
  boardId,
  boardShortId,
  isCreator,
  onImageUploadComplete,
}: ToolbarProps) {
  const { activeTool, setActiveTool, isSaving, theme, setTheme } =
    useEditorStore();
  const { selectedNode } = useNodeStore();

  const handleToolClick = (toolId: ToolType) => {
    setActiveTool(toolId);

    // Trigger actions for creation tools
    switch (toolId) {
      case "note":
        onAddNote?.();
        setActiveTool("select");
        break;
      case "image":
        onAddImage?.();
        setActiveTool("select");
        break;
      case "header":
        onAddHeader?.();
        setActiveTool("select");
        break;
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[60] pointer-events-auto">
      <div
        className={cn(
          "flex flex-col gap-2 backdrop-blur-xl border rounded-2xl p-2 shadow-2xl transition-colors duration-500",
          theme === "dark"
            ? "bg-zinc-900/90 border-zinc-700/50"
            : "bg-white/90 border-zinc-200"
        )}
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={cn(
                "relative p-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : theme === "dark"
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              )}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {tool.label}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
              </div>
            </button>
          );
        })}

        <div
          className={cn(
            "w-full h-px my-1 transition-colors duration-500",
            theme === "dark" ? "bg-zinc-700" : "bg-zinc-200"
          )}
        />

        {/* Upload Images - Only for board creator */}
        {isCreator && boardId && boardShortId && (
          <ImageUploadModal
            boardId={boardId}
            boardShortId={boardShortId}
            isCreator={isCreator}
            onUploadComplete={onImageUploadComplete}
          />
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "p-3 rounded-xl transition-all duration-200 group relative",
            theme === "dark"
              ? "text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800"
              : "text-zinc-500 hover:text-yellow-600 hover:bg-zinc-100"
          )}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
          </div>
        </button>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            "p-3 rounded-xl transition-all duration-200 group relative",
            isSaving
              ? "text-zinc-600 cursor-not-allowed"
              : theme === "dark"
              ? "text-zinc-400 hover:text-green-400 hover:bg-zinc-800"
              : "text-zinc-500 hover:text-green-600 hover:bg-zinc-100"
          )}
          title="Save Snapshot"
        >
          <Save className={cn("w-5 h-5", isSaving && "animate-pulse")} />

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Save Snapshot
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
          </div>
        </button>

        {/* Delete button (shown when node selected) */}
        {selectedNode && (
          <button
            onClick={() => {
              // Trigger delete via keyboard event or direct call
              const event = new KeyboardEvent("keydown", { key: "Delete" });
              window.dispatchEvent(event);
            }}
            className={cn(
              "p-3 rounded-xl transition-all duration-200 group relative",
              theme === "dark"
                ? "text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                : "text-zinc-500 hover:text-red-600 hover:bg-zinc-100"
            )}
            title="Delete Selected"
          >
            <Trash2 className="w-5 h-5" />

            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Delete
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
