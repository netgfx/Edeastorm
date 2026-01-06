/** @format */

"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";
import { ImageIcon } from "lucide-react";
import type { BoardImage } from "@/types/canvas";

interface BoardImageGalleryProps {
  images: BoardImage[];
  boardShortId: string;
}

export function BoardImageGallery({
  images,
  boardShortId,
}: BoardImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Get public URL for image
  const getImageUrl = (storagePath: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/board-images/${storagePath}`;
  };

  // Prepare slides for lightbox
  const slides = images.map((image) => ({
    src: getImageUrl(image.storage_path),
    width: image.width || 1200,
    height: image.height || 800,
    title: image.file_name,
    description: image.caption || undefined,
  }));

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="fixed top-20 right-4 z-30">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-gradient-to-br from-violet-600/30 via-fuchsia-500/20 to-blue-500/20 rounded-3xl" />
          <div className="relative w-[230px] overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/85 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 bg-gradient-to-r from-zinc-900/70 via-zinc-900/40 to-zinc-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">
                    Assets
                  </p>
                  <p>Reference Images</p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-medium shadow-inner">
                {images.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 max-h-[440px] overflow-y-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => handleImageClick(index)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-900/70 shadow-lg shadow-black/30 ring-0 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                  title={image.caption || image.file_name}
                >
                  <Image
                    src={getImageUrl(image.storage_path)}
                    alt={image.caption || image.file_name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="120px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={currentIndex}
        slides={slides}
        plugins={[Thumbnails, Zoom, Captions, Fullscreen]}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          border: 1,
          borderRadius: 4,
          padding: 4,
          gap: 16,
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        captions={{
          showToggle: true,
          descriptionTextAlign: "center",
        }}
        animation={{
          fade: 250,
          swipe: 250,
        }}
        controller={{
          closeOnBackdropClick: true,
        }}
        carousel={{
          finite: images.length <= 1,
          preload: 2,
        }}
      />
    </>
  );
}
