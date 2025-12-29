"use client";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../helpers/constants";
import { calcClickCoords, findCenter } from "../helpers/utils";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import _ from "lodash";
import { useCallback, useRef } from "react";
//components

import { Coords } from "../interfaces/canvasInterfaces";
import { useEditorStore, useNodeStore } from "../state/globalState";
import { useGSAP } from "@gsap/react";
import { MdAdd, MdRemove } from "react-icons/md";

gsap.registerPlugin(Draggable);

export default function StickyCanvas(props: any) {
  const mainAreaRef = useRef<HTMLDivElement | null>(null);
  const { setLoaded, loaded } = props;

  const containerDims = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };

  const setCanvasScale = useEditorStore((state) => state.setCanvasScale);
  const canvasScale = useEditorStore((state) => state.canvasScale);
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode);
  const setEditableNode = useNodeStore((state) => state.setEditableNode);

  //
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const coordsObj = useRef<Coords | null>(null);

  const { contextSafe } = useGSAP({ scope: wrapperRef });

  const canvasClick = (ev: any) => {
    if (mainAreaRef.current) {
      const { x, y } = calcClickCoords(
        ev.clientX,
        ev.clientY,
        mainAreaRef.current,
        canvasScale
      );
      const elementId = ev.target.id;

      if (elementId !== "fake-area") {
        return;
      }

      if (setLoaded) {
        setLoaded(false);
      }

      // clear selections
      setSelectedNode(null);
      setEditableNode(null);
      //
      mainAreaRef.current.focus();
    }
  };

  const initializeDrag = useCallback(() => {
    //const areaNode = draggableRef.current;
    console.log(Draggable.get(".draggable-area"));
    if (Draggable.get(".draggable-area")) {
      Draggable.get(".draggable-area").kill();
      return;
    }

    Draggable.create(".draggable-area", {
      type: "x,y",
      bounds: "#wrapperContainer",
      dragClickables: false,
      trigger: "#fake-area",
      autoScroll: 1,
      allowContextMenu: true,
      allowEventDefault: true,
      dragResistance: 0.15,
      onDrag: (event) => {
        if (coordsObj.current) {
          const { scrollLeft, scrollTop } = coordsObj.current;
          coordsObj.current = {
            scrollLeft,
            scrollTop,
            clientX: event.clientX,
            clientY: event.clientY,
          };
        }
      },
      onPress: function (event) {
        const area = document.getElementById("wrapperContainer");

        console.log("on press: ", area);

        if (area) {
          const { scrollLeft, scrollTop } = area;

          coordsObj.current = {
            scrollLeft,
            scrollTop,
            clientX: event.clientX,
            clientY: event.clientY,
          };
        }
      },
    });
  }, []);

  const recenter = useCallback(() => {
    if (!mainAreaRef) return;

    gsap.to(mainAreaRef.current, {
      scale: 1,
      duration: 0.1,
      transformOrigin: "center center",
    });
    const { x, y } = findCenter();

    if (draggableRef.current) {
      gsap.set(draggableRef.current, { x: 0, y: 0 });
    }
    gsap.to("#draggable-area", {
      x: -x,
      y: -y,
      duration: 0.1,
    });
    setCanvasScale(1.0);
  }, []);

  const zoomIn = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    let scale = Number(gsap.getProperty(mainAreaRef.current, "scale"));

    const adjustAmount = Math.min(1.5, Math.abs(100) * 0.001);

    scale = scale - adjustAmount * -1;

    if (scale < 0.5) {
      scale = 0.5;
    }
    if (scale > 1.5) {
      scale = 1.5;
    }

    setCanvasScale(Number(scale.toFixed(1)));
    onZoom(scale);
  };

  const zoomOut = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    let scale = Number(gsap.getProperty(mainAreaRef.current, "scale"));
    const adjustAmount = Math.min(1.5, Math.abs(-100) * 0.001);

    scale = scale - adjustAmount;

    if (scale < 0.5) {
      scale = 0.5;
    }
    if (scale > 1.5) {
      scale = 1.5;
    }

    setCanvasScale(Number(scale.toFixed(1)));
    onZoom(scale);
  };

  const onZoom = contextSafe((scale: number) => {
    gsap.to(mainAreaRef.current, {
      scale: Number(scale.toFixed(1)),
      duration: 0.1,
      transformOrigin: "center center",
    });
  });

  //

  useGSAP(() => {
    const handleWheel = (e: any) => {
      const delta = e.deltaY;
      let scale = Number(gsap.getProperty(mainAreaRef.current, "scale"));
      const sign = delta > 0 ? 1 : -1;
      const adjustAmount = Math.min(1.5, Math.abs(delta) * 0.001);
      scale = scale - adjustAmount * sign;

      if (scale < 0.5) {
        scale = 0.5;
      }
      if (scale > 1.5) {
        scale = 1.5;
      }

      setCanvasScale(Number(scale.toFixed(1)));
      onZoom(scale);
    };

    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useGSAP(() => {
    initializeDrag();

    const timeout = gsap.delayedCall(0.5, () => {
      recenter();
    });

    return () => {
      if (timeout) {
        timeout.kill();
      }
      if (Draggable.get(".draggable-area")) {
        Draggable.get(".draggable-area").kill();
      }
    };
  }, [initializeDrag]);

  return (
    <>
      <div
        ref={wrapperRef}
        id="wrapperContainer"
        className={`draggable-wrapper ${loaded ? "loaded" : ""}`}
        onClick={canvasClick}
      >
        <div
          id="fake-area"
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            width: containerDims.width ? containerDims.width : "200vw",
            height: containerDims.height ? containerDims.height : "200vh",
            background: "transparent",
            pointerEvents: "auto",
          }}
        />

        <div
          ref={mainAreaRef}
          data-clickable="true"
          id="draggable-area"
          className={"draggable-area min-w-[100vw] min-h-[100vh]"}
          style={{
            width: containerDims.width ? containerDims.width : "200vw",
            height: containerDims.height ? containerDims.height : "200vh",
          }}
        >
          {/* area to receive the drag but do nothing */}
          <div
            className={"draggable-area"}
            style={{
              width: containerDims.width ? containerDims.width : "100vw",
              height: containerDims.height ? containerDims.height : "100vh",
              pointerEvents: "none",
              display: "none",
            }}
            ref={draggableRef}
          ></div>
          <div className="inner-wrapper" data-clickable="true">
            {props.children}
          </div>
        </div>
      </div>

      <button
        onClick={recenter}
        className="BaseButton-root center-zoom"
        style={{
          position: "fixed",
          left: "53%",
          bottom: "40px",
          //pointerEvents: "none",
          zIndex: 1,
          transform: "translateX(-50%)",
        }}
      >
        <MdRemove
          color="white"
          size={"24px"}
          style={{ minWidth: "24px", cursor: "pointer", pointerEvents: "all" }}
          onClick={zoomOut}
        />
        <div>{`${(canvasScale * 100).toFixed(1)}%`}</div>
        <MdAdd
          color="white"
          size={"24px"}
          style={{ minWidth: "24px", cursor: "pointer", pointerEvents: "all" }}
          onClick={zoomIn}
        />
      </button>
    </>
  );
}
