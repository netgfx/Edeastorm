import { useCallback, useEffect, useRef } from "react";
import { useNodeStore } from "../../state/globalState";
import gsap from "gsap";
import { useNodeApi } from "../../API/useNodesAPI";
import { TILE_HEIGHT, TILE_WIDTH } from "../../helpers/constants";
import { useRoom } from "./RoomProvider";

export function TileFocusIndicator({ nodeId }: { nodeId: string }) {
  const selectedNode = useNodeStore(
    (state: { selectedNode: any }) => state.selectedNode
  );

  const isMovingRef = useRef(false);
  const activeCornerRef = useRef<number>(-1); // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
  const initialPos = useRef({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    mouseX: 0,
    mouseY: 0,
  });

  // TODO: Move this to the controller
  const { roomData } = useRoom();
  const { updateNode } = useNodeApi({
    roomId: roomData?.id ?? null,
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMovingRef.current) return;

    const deltaX = e.clientX - initialPos.current.mouseX;
    const deltaY = e.clientY - initialPos.current.mouseY;
    const initialWidth = initialPos.current.w;
    const initialHeight = initialPos.current.h;
    const initialTop = initialPos.current.x;
    const initialLeft = initialPos.current.y;

    let newWidth = initialWidth;
    let newHeight = initialHeight;

    switch (activeCornerRef.current) {
      case 0: // botom-right
        // Width calculation - expand right
        newWidth = initialWidth + deltaX;

        // Height calculation - expand down
        newHeight = initialHeight + deltaY;
        break;
      // // Width calculation - expand left
      // if (deltaX < 0) {
      //   // Moving left
      //   const widthIncrease = Math.abs(deltaX);
      //   newWidth = initialWidth + widthIncrease;
      //   newLeft = initialLeft + deltaX;
      // } else {
      //   // Moving right
      //   newWidth = Math.max(initialWidth - deltaX, initialWidth * 0.5);
      //   newLeft = initialLeft + (initialWidth - newWidth);
      // }

      // // Height calculation - expand up
      // if (deltaY < 0) {
      //   // Moving up
      //   const heightIncrease = Math.abs(deltaY);
      //   newHeight = initialHeight + heightIncrease;
      //   newTop = initialTop + deltaY;
      // } else {
      //   // Moving down
      //   newHeight = Math.max(initialHeight - deltaY, initialHeight * 0.5);
      //   newTop = initialTop + (initialHeight - newHeight);
      // }
      // break;

      // case 1: // top-right
      //   // Width calculation - expand right
      //   newWidth = Math.max(initialWidth + deltaX, initialWidth * 0.5);

      //   // Height calculation - expand up
      //   if (deltaY < 0) {
      //     // Moving up
      //     const heightIncrease = Math.abs(deltaY);
      //     newHeight = initialHeight + heightIncrease;
      //     newTop = initialTop + deltaY;
      //   } else {
      //     // Moving down
      //     newHeight = Math.max(initialHeight - deltaY, initialHeight * 0.5);
      //     newTop = initialTop + (initialHeight - newHeight);
      //   }
      //   break;

      // case 2: // bottom-left
      //   // Width calculation - expand left
      //   if (deltaX < 0) {
      //     // Moving left
      //     const widthIncrease = Math.abs(deltaX);
      //     newWidth = initialWidth + widthIncrease;
      //     newLeft = initialLeft + deltaX;
      //   } else {
      //     // Moving right
      //     newWidth = Math.max(initialWidth - deltaX, initialWidth * 0.5);
      //     newLeft = initialLeft + (initialWidth - newWidth);
      //   }

      //   // Height calculation - expand down
      //   newHeight = Math.max(initialHeight + deltaY, initialHeight * 0.5);
      //   break;

      // case 3: // bottom-right
      //   // Width calculation - expand right
      //   newWidth = Math.max(initialWidth + deltaX, initialWidth * 0.5);

      //   // Height calculation - expand down
      //   newHeight = Math.max(initialHeight + deltaY, initialHeight * 0.5);
      //   break;
    }

    // Enforce minimum size
    newWidth = Math.max(newWidth, TILE_WIDTH);
    newHeight = Math.max(newHeight, TILE_HEIGHT);

    gsap.set(".selected-node", {
      width: newWidth,
      height: newHeight,
    });
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    const target = e.target as HTMLElement;
    const circles = document.getElementsByClassName("circle");
    activeCornerRef.current = Array.from(circles).indexOf(target);

    if (activeCornerRef.current !== -1) {
      isMovingRef.current = true;

      const selectedNode = document.getElementsByClassName("selected-node")[0];
      const rect = selectedNode.getBoundingClientRect();

      initialPos.current = {
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        mouseX: e.clientX,
        mouseY: e.clientY,
      };
      // Prevent text selection during resize
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback((e: any) => {
    //console.log("mouse up className target: ", e, e.currentTarget.className);
    if (e.target.className.indexOf("circle") !== -1) {
      isMovingRef.current = false;
      activeCornerRef.current = -1;
      const selectedNode = document.getElementsByClassName("selected-node")[0];
      const rect = selectedNode.getBoundingClientRect();
      // save size on DB
      updateNode(nodeId, "size", { width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    // Add mousemove to document instead of circles for smoother dragging
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    const circles = document.getElementsByClassName("circle");
    Array.from(circles).forEach((circle) => {
      circle.addEventListener("mousedown", handleMouseDown);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      Array.from(circles).forEach((circle) => {
        circle.removeEventListener("mousedown", handleMouseDown);
      });
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);
  return (
    <>
      <div className={`selected-node`}>
        {/* <div className="circle top-left"></div>
         <div className="circle top-right"></div>
        <div className="circle bottom-left"></div>*/}
        <div className="circle bottom-right"></div>
        <div className="selection-line-top line"></div>
        <div className="selection-line-bottom line"></div>
        <div className="selection-line-left line"></div>
        <div className="selection-line-right line"></div>
      </div>
    </>
  );
}
