import _ from "lodash";
import { mutate } from "swr";
import { MainNodeItemInterface, RGB } from "../interfaces/canvasInterfaces";
import { MainNodeChild } from "../models/MainNodeChild";
import { NODE_COLORS } from "./constants";

export const findCenter = (live: boolean = false) => {
  const container: HTMLElement | null =
    document.querySelector(".draggable-wrapper");
  const area: any = document.querySelector(".draggable-area");
  const cBounds: any = container?.getBoundingClientRect();
  const aBounds: any = area?.getBoundingClientRect();
  let _x: number = 0;
  let _y: number = 0;

  if (live === true) {
    // check for current viewport position
    _x = Math.round(-1 * aBounds.left + cBounds.width / 2);
    _y = Math.round(-1 * aBounds.top + cBounds.height / 2);
  } else if (area instanceof HTMLElement && container instanceof HTMLElement) {
    // check for canvas centre
    _x = Math.round(area.offsetWidth / 2 - container.offsetWidth / 2);
    _y = Math.round(area.offsetHeight / 2 - container.offsetHeight / 2);
  }

  return {
    x: _x,
    y: _y,
  };
};

/**
 *
 */
export const calcClickCoords = (
  x: number,
  y: number,
  mainAreaRef: any,
  scale: number
) => {
  const mainRef = mainAreaRef.getBoundingClientRect();
  const _x = Math.round((-1 * mainRef.x) / scale + x / scale);
  const _y = Math.round((-1 * mainRef.y) / scale + y / scale);
  return { x: _x, y: _y };
};

export function getCurrentParams() {
  if (typeof window === "undefined") return {};

  const searchParams = new URLSearchParams(window.location.search);
  return Object.fromEntries(searchParams.entries());
}

// heuristic diff for modifications
export function findModifiedObjects(
  obj1: Record<string, any>,
  obj2: Record<string, any>
): Record<string, any> {
  const addition: Record<string, any> = {};
  const deletion: Record<string, any> = {};
  const modification: Record<string, any> = {};

  // Find additions and modifications
  for (const key in obj2) {
    if (!(key in obj1)) {
      // If the key doesn't exist in the first object, it's an 'addition'
      addition[key] = obj2[key];
    } else if (!_.isEqual(obj1[key], obj2[key])) {
      // If the values are not equal, it's a 'modification'
      modification[key] = obj2[key];
    }
  }

  // Find deletions
  for (const key in obj1) {
    if (!(key in obj2)) {
      // If the key doesn't exist in the second object, it's a 'deletion'
      deletion[key] = obj1[key];
    }
  }

  return { addition, deletion, modification };
}

// mutate an swr cache from anywhere, based on key
export const globallyMutateData = async (str: string) =>
  mutate((key) => typeof key === "string" && key.startsWith(str), undefined, {
    revalidate: true,
  });

export function htmlDecode(input: string) {
  const result = new DOMParser().parseFromString(input, "text/html");
  return result.documentElement.textContent;
}

export function calculateDistances(coordinates: any, circleDiameter: number) {
  const xs = coordinates.map((coordinate: any) => coordinate.x);
  const ys = coordinates.map((coordinate: any) => coordinate.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const xDistance = maxX - minX + circleDiameter;
  const yDistance = maxY - minY + circleDiameter;

  return { x: xDistance, y: yDistance };
}

// make a darker color of a color
export function darkenColor(hexColor: string) {
  const defaultColor = "#92CFFF"; // Equivalent to rgb(146, 207, 255)
  const _hexColor = hexColor ?? defaultColor;

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    // Remove # if present
    const cleanHex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    return { r, g, b };
  };

  // "Magic numbers" for the RGB differences
  const redDiff = 8;
  const greenDiff = 20;
  const blueDiff = 29;

  // Ensure the value stays within the 0-255 range
  const clamp = (value: number) => Math.max(0, Math.min(255, value));

  // Convert hex to RGB, darken, and convert back
  const rgb = hexToRgb(_hexColor);
  const darkenedRgb = {
    r: clamp(rgb.r - redDiff),
    g: clamp(rgb.g - greenDiff),
    b: clamp(rgb.b - blueDiff),
  };

  // Convert RGB back to hex
  const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  return rgbToHex(darkenedRgb);
}

// convert array to Record, so we don't break functionality
export function arrayToRecord(
  array: { id: number; [key: string]: any }[],
  storyId: string
): Record<string, MainNodeItemInterface> {
  const record: Record<string, MainNodeItemInterface> = {};

  for (const obj of array) {
    // Use the 'id' property as the key
    record[obj.id] = MainNodeChild.fromPlainObject(obj);
    record[obj.id].story = Number(obj.story ?? storyId);
  }

  return record;
}

export function updateNestedProperty(
  obj: any,
  propertyToFind: string,
  newValue: any
) {
  const searchAndUpdate = (current: any) => {
    // Handle arrays
    if (Array.isArray(current)) {
      current.forEach((item) => searchAndUpdate(item));
      return;
    }

    // Handle objects
    if (current && typeof current === "object") {
      for (const key in current) {
        if (key === propertyToFind) {
          current[key] = newValue;
        } else {
          searchAndUpdate(current[key]);
        }
      }
    }
  };

  searchAndUpdate(obj);

  return obj;
}

// Get room ID from URL
export const getRoomIdFromUrl = () => {
  // If running on the server, return null
  if (typeof window === "undefined") {
    return null;
  }

  // Create URLSearchParams object from the current URL
  const params = new URLSearchParams(window.location.search);

  // Get the roomid parameter
  const roomId = params.get("roomid");

  // Return null if no roomid is found
  if (!roomId) {
    return null;
  }

  return roomId;
};

// Helper function to add room ID to URL without page reload
export const setRoomIdInUrl = (roomId: string) => {
  // If running on the server, do nothing
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  // Set the roomid parameter
  params.set("roomid", roomId);

  // Update the URL without reloading the page
  window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
};

// Convert hex to RGB for easier manipulation
const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error("Invalid hex color");

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

// Convert RGB back to hex
const rgbToHex = ({ r, g, b }: RGB): string => {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
};

// Generate a consistent hash from UUID
const hashUuid = (uuid: string): number => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Get average color from the palette to use as a base
const getAveragePaletteColor = (): RGB => {
  const rgbColors = Object.values(NODE_COLORS).map(hexToRgb);
  const sum = rgbColors.reduce(
    (acc, { r, g, b }) => ({
      r: acc.r + r,
      g: acc.g + g,
      b: acc.b + b,
    }),
    { r: 0, g: 0, b: 0 }
  );

  const count = rgbColors.length;
  return {
    r: sum.r / count,
    g: sum.g / count,
    b: sum.b / count,
  };
};

// Generate a color that's complementary to the palette
export const uuidToColor = (uuid: string): string => {
  const hash = hashUuid(uuid);
  const baseColor = getAveragePaletteColor();

  // Use the hash to create variations around the base color
  const variation = 50; // Range of variation
  const r = (baseColor.r + (hash % variation)) % 256;
  const g = (baseColor.g + ((hash >> 8) % variation)) % 256;
  const b = (baseColor.b + ((hash >> 16) % variation)) % 256;

  return rgbToHex({ r, g, b });
};

export function doObjectsCollide(a: DOMRect, b: DOMRect) {
  // Collision thresholds (you can adjust these)
  const threshold = 5; // pixels

  // Calculate edges
  const aRight = a.left + a.width;
  const aBottom = a.top + a.height;
  const bRight = b.left + b.width;
  const bBottom = b.top + b.height;

  // Check if objects are colliding at all
  const isColliding = !(
    (
      a.top > bBottom || // a is below b
      aBottom < b.top || // a is above b
      a.left > bRight || // a is right of b
      aRight < b.left
    ) // a is left of b
  );

  // If colliding, determine which sides
  const collidingSides = {
    top: false,
    bottom: false,
    left: false,
    right: false,
  };

  console.log(a, b, a.left, b.right, b.width, Math.abs(a.left - bRight));
  if (isColliding) {
    // Check vertical collisions
    if (Math.abs(aBottom - b.top) > threshold) {
      collidingSides.bottom = true; // a's bottom collides with b's top
    }
    if (Math.abs(a.top - bBottom) > threshold) {
      collidingSides.top = true; // a's top collides with b's bottom
    }

    // Check horizontal collisions
    if (Math.abs(aRight - b.left) > threshold) {
      collidingSides.right = true; // a's right collides with b's left
    }
    if (Math.abs(a.left - bRight) > threshold) {
      collidingSides.left = true; // a's left collides with b's right
    }
  }

  return {
    isColliding,
    ...collidingSides,
  };
}

export const getHypotenuse = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
