/* eslint-disable react/display-name */
import { useState, useEffect, useRef, memo } from "react";
import { darkenColor, doObjectsCollide } from "../../helpers/utils";
import gsap from "gsap";
import { useNodeStore } from "../../state/globalState";
import _ from "lodash";
import { NODE_COLOR, NODE_COLORS } from "../../helpers/constants";
import { TileFocusIndicator } from "./TileFocusIndicator";
import { EditableNode } from "./EditableNode";
import { useNodeApi } from "../../API/useNodesAPI";
import { useDraggable } from "../NodeController";
import { useRoom } from "./RoomProvider";

export const NodeItem = function ({ data }: { data?: any }) {
  const { roomData } = useRoom();
  const { updateNode } = useNodeApi({
    roomId: roomData?.id ?? null,
  });

  const {
    dragStart,
    dragEnd,
    draggableInstance,
    clickedNode,
    htmlRef,
    data: _data,
  } = useDraggable();

  const idRef = useRef<string | null>(data?.id ?? null);
  const snapRef = useRef<HTMLDivElement | null>(null);
  const [focus, setFocus] = useState(false);

  // global state
  const isDraggingNode = useNodeStore(
    (state: { isDraggingNode: any }) => state.isDraggingNode
  );
  const setIsDraggingNode = useNodeStore(
    (state: { setIsDraggingNode: any }) => state.setIsDraggingNode
  );
  //outer data
  const setSelectedNode = useNodeStore(
    (state: { setSelectedNode: any }) => state.setSelectedNode
  );
  const selectedNode = useNodeStore(
    (state: { selectedNode: any }) => state.selectedNode
  );

  // #save-tile
  const saveTile = () => {
    const posX = gsap.getProperty(`#container-${data.id}`, "x");
    const posY = gsap.getProperty(`#container-${data.id}`, "y");

    updateNode(data.id, ["x", "y"], { x: posX, y: posY });
  };

  const onSelectSlot = (e: any, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();

    gsap.delayedCall(0.18, () => setSelectedNode({ id: data.id }));
  };

  const focusOutDelayed = () => {
    setIsDraggingNode(null);
    gsap.delayedCall(0.02, () => setFocus(false));
    saveTile();
  };

  // Use effect callbacks //////////////////////////////////////////

  useEffect(() => {
    idRef.current = data.id;
  }, [data]);

  useEffect(() => {
    if (draggableInstance) {
      draggableInstance.vars.onDragEnd = () => {
        focusOutDelayed();
      };
      draggableInstance.vars.onDragStart = () => {
        setIsDraggingNode(data.id);
      };
      draggableInstance.vars.onClick = () => {
        gsap.delayedCall(0.15, () => setSelectedNode({ id: data.id }));
      };
    }

    return () => {
      if (draggableInstance) {
        draggableInstance.vars.onDragEnd = undefined;
        draggableInstance.vars.onDragStart = undefined;
        draggableInstance.vars.onClick = undefined;
      }
    };
  }, [draggableInstance, dragStart, clickedNode, dragEnd, htmlRef, data]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {selectedNode?.id === data?.id && (
        <TileFocusIndicator nodeId={data?.id} />
      )}

      <div
        ref={htmlRef}
        style={{
          left: 0,
          top: 0,
          border: `2px solid ${darkenColor(data.metadata?.color ?? "#000000")}`,
          borderRadius: "6px",
          position: "absolute",
          backgroundColor: `${
            NODE_COLORS[data?.metadata?.color ?? "green"] ?? NODE_COLOR
          }`,
          width: `${data?.metadata?.size?.width}px`,
          height: `${data?.metadata?.size?.height}px`,
          zIndex: 9,
          boxShadow:
            isDraggingNode === data.id
              ? "0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2)"
              : "none",
        }}
      >
        <EditableNode
          id={data.id}
          metadata={data.metadata}
          saveTile={saveTile}
          focus={focus}
        />
      </div>
    </div>
  );
};
