/** @format */

import type { CanvasItem } from "@/types/canvas";

interface PreviewOptions {
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * Generates an abstract SVG preview of a board's contents
 * Uses position, colors, and item types from canvas_items metadata
 */
export function generateBoardPreviewSVG(
  items: CanvasItem[],
  options: PreviewOptions = {}
): string {
  const { width = 1200, height = 800, padding = 20 } = options;

  if (!items || items.length === 0) {
    return generateEmptyPreviewSVG(width, height);
  }

  // Calculate bounds from items to fit preview
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  items.forEach((item) => {
    const x = item.x || 0;
    const y = item.y || 0;
    const itemWidth = item.metadata?.size?.width || 200;
    const itemHeight = item.metadata?.size?.height || 200;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + itemWidth);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + itemHeight);
  });

  // Add extra padding to show context around items
  const extraPadding = 100;
  minX -= extraPadding;
  minY -= extraPadding;
  maxX += extraPadding;
  maxY += extraPadding;

  const contentWidth = Math.max(maxX - minX, 100);
  const contentHeight = Math.max(maxY - minY, 100);

  // Calculate scale to fit preview
  const scaleX = (width - padding * 2) / contentWidth;
  const scaleY = (height - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 0.15); // Cap at 15% to keep minimap feel

  // Helper to transform coordinates
  const transformX = (x: number) => (x - minX) * scale + padding;
  const transformY = (y: number) => (y - minY) * scale + padding;
  const transformSize = (size: number) => size * scale;

  // Group items by type for organization
  const stickyNotes = items.filter((item) => item.item_type === "sticky_note");
  const headers = items.filter((item) => item.item_type === "header");
  const images = items.filter((item) => item.item_type === "image");

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;

  // Background with more prominent grid
  svg += `<defs>
    <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#27272a" stroke-width="0.3" opacity="0.5"/>
    </pattern>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#smallGrid)"/>
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#3f3f46" stroke-width="0.5" opacity="0.8"/>
    </pattern>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#18181b;stop-opacity:1" />
    </linearGradient>
  </defs>`;

  svg += `<rect width="${width}" height="${height}" fill="url(#bgGradient)"/>`;
  svg += `<rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.5"/>`;

  // Minimap viewport indicator (dotted border showing canvas area)
  const viewportWidth = contentWidth * scale;
  const viewportHeight = contentHeight * scale;
  svg += `<rect x="${padding}" y="${padding}" width="${viewportWidth}" height="${viewportHeight}" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.4" rx="2"/>`;

  // Draw images first (bottom layer)
  images.forEach((item) => {
    const x = transformX(item.x || 0);
    const y = transformY(item.y || 0);
    const itemWidth = Math.max(
      transformSize(item.metadata?.size?.width || 200),
      12
    );
    const itemHeight = Math.max(
      transformSize(item.metadata?.size?.height || 200),
      12
    );

    svg += `<g>
      <rect x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" fill="#3b82f6" fill-opacity="0.4" stroke="#60a5fa" stroke-width="1" rx="1.5"/>
      ${
        itemWidth > 15 && itemHeight > 15
          ? `<rect x="${x + itemWidth * 0.3}" y="${
              y + itemHeight * 0.3
            }" width="${itemWidth * 0.4}" height="${
              itemHeight * 0.4
            }" fill="#93c5fd" fill-opacity="0.3" rx="1"/>`
          : ""
      }
    </g>`;
  });

  // Draw headers (middle layer)
  headers.forEach((item) => {
    const x = transformX(item.x || 0);
    const y = transformY(item.y || 0);
    const itemWidth = Math.max(
      transformSize(item.metadata?.size?.width || 300),
      15
    );
    const itemHeight = Math.max(
      transformSize(item.metadata?.size?.height || 80),
      8
    );

    svg += `<g>
      <rect x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" fill="#a78bfa" fill-opacity="0.5" stroke="#c4b5fd" stroke-width="1.2" rx="2"/>
      ${
        itemHeight > 10
          ? `<line x1="${x + 3}" y1="${y + itemHeight / 3}" x2="${
              x + itemWidth - 3
            }" y2="${
              y + itemHeight / 3
            }" stroke="#ddd6fe" stroke-width="1" opacity="0.7"/>`
          : ""
      }
      ${
        itemHeight > 16
          ? `<line x1="${x + 3}" y1="${y + itemHeight * 0.6}" x2="${
              x + itemWidth * 0.7
            }" y2="${
              y + itemHeight * 0.6
            }" stroke="#ddd6fe" stroke-width="0.8" opacity="0.5"/>`
          : ""
      }
    </g>`;
  });

  // Draw sticky notes (top layer)
  stickyNotes.forEach((item) => {
    const x = transformX(item.x || 0);
    const y = transformY(item.y || 0);
    const itemWidth = Math.max(
      transformSize(item.metadata?.size?.width || 200),
      10
    );
    const itemHeight = Math.max(
      transformSize(item.metadata?.size?.height || 200),
      10
    );
    const color = item.metadata?.color || "yellow";
    const colorHex = getColorHex(color);

    svg += `<g>
      <rect x="${x + 1}" y="${
      y + 1
    }" width="${itemWidth}" height="${itemHeight}" fill="#000000" fill-opacity="0.15" rx="1.5"/>
      <rect x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" fill="${colorHex}" fill-opacity="0.6" stroke="${colorHex}" stroke-width="1.2" rx="1.5"/>
      ${
        itemWidth > 12
          ? `<polygon points="${x + itemWidth - 6},${y} ${x + itemWidth},${y} ${
              x + itemWidth
            },${y + 6}" fill="#000000" fill-opacity="0.15"/>`
          : ""
      }
      ${
        itemHeight > 12
          ? `<line x1="${x + 2}" y1="${y + itemHeight * 0.3}" x2="${
              x + itemWidth - 2
            }" y2="${
              y + itemHeight * 0.3
            }" stroke="${colorHex}" stroke-width="0.8" opacity="0.5"/>`
          : ""
      }
      ${
        itemHeight > 18
          ? `<line x1="${x + 2}" y1="${y + itemHeight * 0.5}" x2="${
              x + itemWidth - 2
            }" y2="${
              y + itemHeight * 0.5
            }" stroke="${colorHex}" stroke-width="0.6" opacity="0.4"/>`
          : ""
      }
    </g>`;
  });

  // Add item count indicator with badge styling
  const totalItems = items.length;
  const badgeX = width - 45;
  const badgeY = height - 20;
  svg += `<g>
    <rect x="${badgeX}" y="${badgeY}" width="40" height="16" fill="#18181b" fill-opacity="0.9" stroke="#3f3f46" stroke-width="0.5" rx="8"/>
    <text x="${badgeX + 20}" y="${
    badgeY + 11
  }" font-size="9" font-weight="600" fill="#a1a1aa" font-family="system-ui" text-anchor="middle">${totalItems}</text>
  </g>`;

  svg += `</svg>`;

  return svg;
}

/**
 * Generate an empty placeholder preview
 */
function generateEmptyPreviewSVG(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <defs>
      <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#27272a" stroke-width="0.3" opacity="0.5"/>
      </pattern>
      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect width="50" height="50" fill="url(#smallGrid)"/>
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#3f3f46" stroke-width="0.5" opacity="0.8"/>
      </pattern>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#18181b;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
    <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.5"/>
    <circle cx="${width / 2}" cy="${
    height / 2
  }" r="30" fill="#27272a" opacity="0.4"/>
    <text x="${width / 2}" y="${
    height / 2 + 50
  }" text-anchor="middle" font-size="11" fill="#71717a" font-family="system-ui" opacity="0.7">
      Empty
    </text>
  </svg>`;
}

/**
 * Convert color name to hex value
 */
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    yellow: "#fcd34d",
    pink: "#f472b6",
    blue: "#60a5fa",
    green: "#34d399",
    purple: "#c084fc",
    orange: "#fb923c",
    red: "#f87171",
    cyan: "#22d3ee",
    lime: "#84cc16",
    amber: "#fbbf24",
  };

  return colorMap[colorName.toLowerCase()] || colorMap.yellow;
}

/**
 * Convert SVG string to data URL for use as image src
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Convert SVG string to blob
 */
export async function svgToBlob(svgString: string): Promise<Blob> {
  return new Blob([svgString], { type: "image/svg+xml" });
}
