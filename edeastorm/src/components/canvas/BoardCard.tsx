/** @format */

"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { generateBoardPreviewSVG } from "@/lib/board-preview";
import { getCanvasItems } from "@/lib/api";
import type { Tables } from "@/types/database";

interface BoardCardProps {
  board: Tables<"boards">;
}

export function BoardCard({ board }: BoardCardProps) {
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <Link
      href={`/board/${board.short_id}`}
      className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 p-5 flex flex-col transition-all hover:shadow-lg hover:shadow-violet-500/5 group overflow-hidden"
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
          <h3 className="font-medium truncate group-hover:text-violet-400 transition-colors">
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
  );
}
