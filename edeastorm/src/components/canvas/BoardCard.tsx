/** @format */

"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { generateBoardPreviewSVG } from "@/lib/board-preview";
import { getCanvasItems } from "@/lib/api";
import type { Tables } from "@/types/database";
import { DeleteBoardModal } from "@/components/dashboard/DeleteBoardModal";

interface BoardCardProps {
  board: Tables<"boards">;
  canDelete?: boolean;
  onDelete?: (boardId: string, boardTitle: string) => Promise<boolean>;
}

export function BoardCard({ board, canDelete, onDelete }: BoardCardProps) {
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function generatePreview() {
      try {
        const items = await getCanvasItems(board.id);
        const svgString = generateBoardPreviewSVG(items, {
          width: 600,
          height: 400,
          padding: 20,
        });
        setPreviewSvg(svgString);
      } catch (error) {
        console.error("Error generating preview:", error);
      } finally {
        setIsLoading(false);
      }
    }

    generatePreview();
  }, [board.id]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      const success = await onDelete(board.id, board.title);
      if (success) {
        setShowDeleteModal(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className="relative h-48 group">
      <Link
        href={`/board/${board.short_id}`}
        className={`h-full rounded-2xl bg-zinc-900/50 border border-zinc-800 group-hover:border-violet-500/50 p-5 flex flex-col transition-all group-hover:shadow-lg group-hover:shadow-violet-500/5 overflow-hidden ${
          isDeleting ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {/* Thumbnail preview */}
        <div className="flex-1 rounded-lg bg-zinc-800/50 mb-4 overflow-hidden relative flex items-center justify-center">
          {previewSvg && (
            <div
              dangerouslySetInnerHTML={{ __html: previewSvg }}
              className="w-full h-full"
            />
          )}
          {isLoading || !previewSvg ? (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-zinc-800/30 to-zinc-900/30">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-violet-500 animate-spin" />
            </div>
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
            <span className="text-xs font-medium bg-black/50 px-2 py-1 rounded text-white">
              Open Board
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium truncate transition-colors group-hover:text-violet-400">
              {board.title}
            </h3>
            <p className="text-xs text-zinc-500 truncate">
              Edited {formatRelativeTime(board.updated_at || board.created_at)}
            </p>
          </div>
          {board.is_public && (
            <div className="shrink-0" title="Public Board">
              <Users className="w-3 h-3 text-zinc-500" />
            </div>
          )}
        </div>
      </Link>

      {/* Menu button - only shown when canDelete is true */}
      {canDelete && (
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Board options"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-10">
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Board
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteBoardModal
        isOpen={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        boardTitle={board.title}
        isDeleting={isDeleting}
      />

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin" />
            Deleting...
          </div>
        </div>
      )}
    </div>
  );
}
