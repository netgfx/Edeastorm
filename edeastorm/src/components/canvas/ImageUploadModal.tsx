/** @format */

"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface ImageUploadModalProps {
  boardId: string;
  boardShortId: string;
  isCreator: boolean;
  onUploadComplete?: () => void;
}

interface ImagePreview {
  file: File;
  preview: string;
  caption: string;
}

export function ImageUploadModal({
  boardId,
  boardShortId,
  isCreator,
  onUploadComplete,
}: ImageUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreator) {
    return null; // Only show for board creators
  }

  const handleClose = () => {
    if (!uploading) {
      setOpen(false);
      // Clean up preview URLs
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (!isUnder10MB) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    // Create previews
    const newPreviews = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));

    setImages((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img))
    );
  };

  const handleUpload = async () => {
    console.log("handleUpload called, images:", images.length);
    if (images.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      for (const [index, imagePreview] of images.entries()) {
        console.log(`Processing image ${index + 1}/${images.length}`);
        const { file, caption } = imagePreview;

        // Get image dimensions
        const img = new window.Image();
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve) => {
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.src = imagePreview.preview;
          }
        );

        // Create form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("boardId", boardId);
        formData.append("caption", caption || "");
        formData.append("displayOrder", index.toString());
        formData.append("width", dimensions.width.toString());
        formData.append("height", dimensions.height.toString());

        // Upload via API route
        const response = await fetch("/api/board-images/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("Upload response:", response.ok, result);

        if (!response.ok) {
          console.error("Upload error:", result);
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
          continue;
        }

        successCount++;
      }

      console.log("Upload complete, successCount:", successCount);
      if (successCount > 0) {
        toast.success(
          `Successfully uploaded ${successCount} image${
            successCount > 1 ? "s" : ""
          }`
        );

        // Cleanup previews
        images.forEach((img) => URL.revokeObjectURL(img.preview));
        setImages([]);
        setOpen(false);
        console.log("Calling onUploadComplete callback");
        onUploadComplete?.();
      } else {
        toast.error("No images were uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-3 rounded-xl transition-all duration-200 group text-zinc-400 hover:text-white hover:bg-zinc-800"
        title="Upload Reference Images"
      >
        <Upload className="w-5 h-5" />

        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Upload Images
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 border-b flex-shrink-0">
            <DialogTitle>Upload Reference Images</DialogTitle>
            <DialogDescription>
              Share images for participants to view and ideate upon
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload images</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WebP up to 10MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  Selected Images ({images.length})
                </h3>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={image.preview}
                          alt={image.file.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {image.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(image.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            disabled={uploading}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <Textarea
                          placeholder="Add a caption (optional)"
                          value={image.caption}
                          onChange={(e) => updateCaption(index, e.target.value)}
                          disabled={uploading}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || images.length === 0}
              className="gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading
                ? "Uploading..."
                : `Upload ${images.length} Image${
                    images.length > 1 ? "s" : ""
                  }`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
