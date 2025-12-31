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
      <div className="fixed top-20 right-4 z-10">
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 max-w-[200px]">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            <span>Reference Images</span>
            <span className="text-xs">({images.length})</span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => handleImageClick(index)}
                className="relative aspect-square rounded-md overflow-hidden border border-border hover:border-violet-500 transition-all group"
                title={image.caption || image.file_name}
              >
                <Image
                  src={getImageUrl(image.storage_path)}
                  alt={image.caption || image.file_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="100px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
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
