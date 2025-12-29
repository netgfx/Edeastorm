import { useGSAP } from "@gsap/react";
import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { findCenter, getHypotenuse } from "../helpers/utils";
import { MainNodeItemInterface } from "../interfaces/canvasInterfaces";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
import { DraggableElement } from "../state/globalState";
gsap.registerPlugin(Draggable);

// Create context for draggable events
interface DraggableContextType {
  dragStart?: boolean;
  dragEnd?: boolean;
  clickedNode?: boolean;
  draggableInstance?: Draggable | null;
  htmlRef?: React.RefObject<HTMLDivElement>;
  data?: MainNodeItemInterface;
}

const DraggableContext = createContext<DraggableContextType>({});

// Custom hook to access draggable events
export const useDraggable = () => useContext(DraggableContext);

export const NodeController = ({
  data,
  children,
  snap = true,
}: {
  data: MainNodeItemInterface;
  children: any;
  snap: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainDraggable = useRef<Draggable | null>(null);
  const htmlRef = useRef<HTMLDivElement | null>(null);
  // Create draggable instance and store handlers
  const [dragHandlers, setDragHandlers] = useState<DraggableContextType>({});

  // utility functions
  const getCenter = useCallback(() => {
    const area = document.getElementById("wrapperContainer");

    if (area && data) {
      const viewPortCenter = findCenter();
      const _center = findCenter();
      if (viewPortCenter && _center) {
        gsap.set(`#container-${data.id}`, { x: 0, y: 0 });
        gsap.set(`#container-${data.id}`, {
          x: viewPortCenter.x + window.innerWidth / 2,
          y: viewPortCenter.y + window.innerHeight / 2,
        });
      }
      if (area) {
        area.scrollLeft -= 0;
        area.scrollTop -= 0;
      }
    }
  }, [data]);

  // Function to get points for an element
  const getElementPoints = (
    rect: { width: number; height: number },
    xPos: number,
    yPos: number
  ) => [
    // Corners
    { x: xPos, y: yPos, type: "TL" }, // Top-left
    { x: xPos + rect.width, y: yPos, type: "TR" }, // Top-right
    { x: xPos, y: yPos + rect.height, type: "BL" }, // Bottom-left
    { x: xPos + rect.width, y: yPos + rect.height, type: "BR" }, // Bottom-right

    // Centers of each side
    { x: xPos + rect.width / 2, y: yPos, type: "TC" }, // Top center
    { x: xPos + rect.width / 2, y: yPos + rect.height, type: "BC" }, // Bottom center
    { x: xPos, y: yPos + rect.height / 2, type: "LC" }, // Left center
    { x: xPos + rect.width, y: yPos + rect.height / 2, type: "RC" }, // Right center

    // Center of element
    { x: xPos + rect.width / 2, y: yPos + rect.height / 2, type: "C" },
  ];

  // Function to get all snap area points
  const getSnapAreaPoints = useCallback(() => {
    const points: { x: number; y: number; type: string }[] = [];
    const snapAreas = Array.from(
      document.getElementsByClassName("snap-area")
    ).filter((area) => area.getAttribute("data-id") !== data.id);
    Array.from(snapAreas).forEach((area: any) => {
      const rect = area.getBoundingClientRect();

      const xPos = Number(gsap.getProperty(area, "x"));
      const yPos = Number(gsap.getProperty(area, "y"));
      points.push(...getElementPoints(rect, xPos, yPos));
    });
    return points;
  }, [data]);

  const snapCheck = (value: gsap.Point2D) => {
    const snapPoints = getSnapAreaPoints();
    let bestSnapValue = value;
    const dragRect = mainDraggable.current?.target.getBoundingClientRect();
    const xPos = Number(
      gsap.getProperty(mainDraggable.current?.target as gsap.TweenTarget, "x")
    );
    const yPos = Number(
      gsap.getProperty(mainDraggable.current?.target as gsap.TweenTarget, "y")
    );

    if (dragRect) {
      const dragPoints = getElementPoints(
        { width: dragRect.width, height: dragRect.height },
        xPos,
        yPos
      );

      // Find the closest snap for any point of the draggable
      const radius = 25;
      let closestDistance = Infinity;

      // For each point on the draggable
      dragPoints.forEach((dragPoint) => {
        // Check against all snap points
        snapPoints.forEach((snapPoint) => {
          const distance = getHypotenuse(
            snapPoint.x,
            snapPoint.y,
            dragPoint.x,
            dragPoint.y
          );

          if (distance < radius && distance < closestDistance) {
            closestDistance = distance;

            // Calculate offsets based on which points are snapping
            let xOffset = 0;
            let yOffset = 0;

            // Adjust for horizontal alignment
            if (dragPoint.type.includes("R") && snapPoint.type.includes("L")) {
              xOffset = -dragRect.width;
            } else if (
              dragPoint.type.includes("L") &&
              snapPoint.type.includes("R")
            ) {
              xOffset = 0;
            } else if (
              dragPoint.type.includes("C") &&
              !snapPoint.type.includes("C")
            ) {
              xOffset = -dragRect.width / 2;
            } else if (
              !dragPoint.type.includes("C") &&
              snapPoint.type.includes("C")
            ) {
              xOffset = dragRect.width / 2;
            }

            // Adjust for vertical alignment
            if (dragPoint.type.includes("B") && snapPoint.type.includes("T")) {
              yOffset = -dragRect.height;
            } else if (
              dragPoint.type.includes("T") &&
              snapPoint.type.includes("B")
            ) {
              yOffset = 0;
            } else if (
              dragPoint.type.includes("C") &&
              !snapPoint.type.includes("C")
            ) {
              yOffset = -dragRect.height / 2;
            } else if (
              !dragPoint.type.includes("C") &&
              snapPoint.type.includes("C")
            ) {
              yOffset = dragRect.height / 2;
            }

            bestSnapValue = {
              x: snapPoint.x + xOffset,
              y: snapPoint.y + yOffset,
            };
          }
        });
      });
    }
    return bestSnapValue;
  };

  // TODO: Expose these as API
  useGSAP(() => {
    if (data) {
      const handlers: DraggableContextType = { data: data };
      mainDraggable.current = Draggable.create(containerRef.current, {
        type: "x,y",
        edgeResistance: 0.65,
        bounds: "#draggable-area",
        autoScroll: 1,
        trigger: htmlRef.current,
        inertia: true,
        clickable: true,
        minimumMovement: 5,
        activeCursor: "grabbing",
        allowContextMenu: true,
        //dragClickables: true,
        onDragStart: function () {
          handlers.dragStart = true;

          setDragHandlers((prev) => {
            return {
              ...prev,
              dragStart: true,
            };
          });
        },
        onDragEnd: function () {
          handlers.dragEnd = true;
          setDragHandlers((prev) => {
            return {
              ...prev,
              dragEnd: true,
            };
          });
        },
        onPress: function (e) {
          e.stopPropagation();
        },
        onClick: function (e) {
          e.stopPropagation();
          handlers.clickedNode = true;
          setDragHandlers((prev) => {
            return {
              ...prev,
              clickedNode: true,
            };
          });
        },
        liveSnap: snap
          ? {
              points: snapCheck,
              radius: 20,
            }
          : false,
      })[0];

      setDragHandlers({
        draggableInstance: mainDraggable.current,
        dragStart: handlers.dragStart,
        dragEnd: handlers.dragEnd,
        clickedNode: handlers.clickedNode,
        htmlRef: htmlRef,
        data: data,
      });

      // force item to top z-index after creation
      gsap.set(`#container-${data.id}`, { zIndex: Draggable.zIndex++ });
    }

    return () => {
      if (mainDraggable.current) {
        mainDraggable.current.kill();
      }
    };
  }, [data]);

  useGSAP(() => {
    if (!data.x && !data.y) {
      getCenter();
    } else {
      gsap.set(`#container-${data.id}`, {
        x: data.x,
        y: data.y,
      });
    }
  }, [data]);

  return (
    <DraggableContext.Provider value={dragHandlers}>
      <div
        id={`container-${data.id}`}
        className="tile-component snap-area"
        data-id={data.id}
        style={{
          pointerEvents: "auto",
          width: `${data?.metadata?.size?.width}px`,
          height: `${data?.metadata?.size?.height}px`,
          position: "absolute",
          top: 0,
          left: 0,
        }}
        ref={containerRef}
      >
        {children &&
          cloneElement(children, {
            data: data,
          })}
      </div>
    </DraggableContext.Provider>
  );
};
