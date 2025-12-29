import { useEffect, useCallback } from "react";
import { syncPresence } from "../../API/supabaseFns";
import { useEditorStore, useGlobalStore } from "../../state/globalState";
import { BsCursorFill } from "react-icons/bs";
import gsap from "gsap";
import { MdOutlinePersonPin } from "react-icons/md";

import _ from "lodash";
import { calcClickCoords, uuidToColor } from "../../helpers/utils";
import { SupaUser } from "../../interfaces/canvasInterfaces";

export const UserTracking = () => {
  const users = useGlobalStore((state) => state.users);

  // Create a stable throttled function with useCallback
  const throttledTrackUserMouse = useCallback(
    _.throttle((e: MouseEvent) => {
      const userId = useGlobalStore.getState().currentUser?.id;
      if (userId) {
        // Convert to percentages of viewport
        const relativeX = ((e.pageX - 10) / window.innerWidth) * 100;
        const relativeY = ((e.pageY - 10) / window.innerHeight) * 100;

        const dragArea = document.getElementById("draggable-area");
        if (dragArea) {
          const { x, y } = calcClickCoords(
            e.clientX,
            e.clientY,
            dragArea,
            useEditorStore.getState().canvasScale
          );

          syncPresence({
            id: userId,
            position: { x: x, y: y },
            last_seen: new Date().toISOString(),
          });
        }
      }
    }, 300),
    [] // Empty deps since we want this to be stable
  );

  useEffect(() => {
    document.addEventListener("mousemove", throttledTrackUserMouse);

    return () => {
      document.removeEventListener("mousemove", throttledTrackUserMouse);
      // Cancel any pending throttled calls on cleanup
      throttledTrackUserMouse.cancel();
    };
  }, [throttledTrackUserMouse]);

  const getPos = (pos: { x: number; y: number }) => {
    if (pos) {
      const dragArea = document.getElementById("draggable-area");
      const xPos = Number(gsap.getProperty(dragArea, "x"));
      const yPos = Number(gsap.getProperty(dragArea, "y"));
      const scale = useEditorStore.getState().canvasScale;
      const cursorOffset = 10;
      // Convert canvas coordinates to viewport coordinates by:
      // 1. Applying scale
      // 2. Adding the canvas offset (which accounts for dragging)
      const viewportX = pos.x * scale - xPos * -1;
      const viewportY = pos.y * scale - yPos * -1;

      const isVisible =
        viewportX >= 0 &&
        viewportX <= window.innerWidth &&
        viewportY >= 0 &&
        viewportY <= window.innerHeight;

      return {
        x: viewportX,
        y: viewportY,
        isVisible,
      };
    } else {
      return { left: `0px`, top: `0px` };
    }
  };

  function calculateEdgePosition(canvasPosition: { x: number; y: number }) {
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // First get the viewport coordinates of the cursor using our previous function
    const { x: cursorX, y: cursorY } = getPos(canvasPosition);

    if (cursorX && cursorY) {
      // Calculate vector from viewport center to cursor position
      const vectorX = cursorX - viewportWidth / 2;
      const vectorY = cursorY - viewportHeight / 2;

      // Calculate angle between cursor and viewport center
      const angle = Math.atan2(vectorY, vectorX);

      // Define viewport boundaries with padding
      const bounds = {
        top: padding,
        right: viewportWidth - padding,
        bottom: viewportHeight - padding,
        left: padding,
      };

      // Calculate position and rotation of edge indicator
      let x, y, rotation;

      // Place indicator based on which quadrant the cursor is in
      if (Math.abs(vectorX) > Math.abs(vectorY)) {
        // Cursor is more horizontal than vertical - place on left or right edge
        x = vectorX > 0 ? bounds.right : bounds.left;
        y = clamp(cursorY, bounds.top, bounds.bottom);
        rotation = vectorX > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        // Cursor is more vertical than horizontal - place on top or bottom edge
        x = clamp(cursorX, bounds.left, bounds.right);
        y = vectorY > 0 ? bounds.bottom : bounds.top;
        rotation = vectorY > 0 ? 0 : Math.PI;
      }

      // Optionally calculate distance for opacity/size scaling
      const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
      const maxDistance = Math.sqrt(
        viewportWidth * viewportWidth + viewportHeight * viewportHeight
      );
      const distanceRatio = Math.min(distance / maxDistance, 1);

      return {
        x,
        y,
        rotation,
        opacity: 1 - distanceRatio * 0.5, // Fade out slightly with distance
      };
    } else {
      return { x: 0, y: 0, rotation: 0, opacity: 0 };
    }
  }

  // Helper function to clamp values
  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  const renderCursor = useCallback(
    ({
      position,
      userId,
    }: {
      position: { x: number; y: number };
      userId: string;
    }) => {
      const viewportPosition = getPos(position);

      if (viewportPosition.isVisible) {
        return (
          <BsCursorFill
            key={userId}
            color={uuidToColor(userId)}
            style={{
              zIndex: 999,
              position: "absolute",
              left: `${viewportPosition.x}px`,
              top: `${viewportPosition.y}px`,
              transform: `translate(-50%, -50%)`,
            }}
            size={20}
          />
        );
      } else {
        const edgePosition = calculateEdgePosition(position);
        return (
          <MdOutlinePersonPin
            key={userId}
            color={uuidToColor(userId)}
            size={40}
            style={{
              zIndex: 999,
              position: "fixed",
              left: `${edgePosition.x}px`,
              top: `${edgePosition.y}px`,
              transform: `translate(-50%, -50%) rotate(${edgePosition.rotation}rad)`,
              opacity: edgePosition.opacity,
            }}
          />
        );
      }
    },
    [users]
  );

  return (
    <>
      {users.map((u: SupaUser) =>
        useGlobalStore.getState().currentUser?.id === u.id
          ? null
          : renderCursor({ position: u.metadata?.position, userId: u.id })
      )}
    </>
  );
};
