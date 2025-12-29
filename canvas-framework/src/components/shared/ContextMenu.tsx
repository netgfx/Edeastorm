import React, { useState, useEffect, useCallback } from "react";
import { FilePlus, Trash2, Edit, Paintbrush, ChevronRight } from "lucide-react";
import { useNodeApi } from "../../API/useNodesAPI";
import { useNodeStore } from "../../state/globalState";
import { ColorPallette } from "../external/ColorPallette";
import { useRoom } from "../external/RoomProvider";

const styles = {
  container: {
    height: "400px",
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    padding: "16px",
  },
  contextMenu: {
    position: "fixed" as "fixed",
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    boxShadow:
      "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)",
    minWidth: "200px",
    padding: "8px 0",
    zIndex: 1000,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 16px",
    width: "100%",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    textAlign: "left" as "left",
    fontSize: "14px",
    color: "rgba(0, 0, 0, 0.87)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#1976d2",
      color: "#ffffff",
    },
  },
};

const MenuItem = ({
  icon: Icon,
  text,
  isDisabled,
  extraIcon,
  onClick,
  onHover,
}: {
  icon: any;
  text: string;
  isDisabled?: boolean;
  onClick: (value?: any) => void;
  extraIcon?: any;
  onHover?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const onColorSelect = (color: string) => {
    console.log("changed color to: ", color);
    onClick(color);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        justifyItems: "center",
        gap: "12px",
        backgroundColor: isHovered ? "#1976d2" : "transparent",
      }}
    >
      <button
        disabled={isDisabled}
        onClick={onClick}
        style={{
          ...styles.menuItem,

          color: isHovered ? "#ffffff" : "rgba(0, 0, 0, 0.87)",
        }}
      >
        <Icon
          size={20}
          style={{
            color: isHovered ? "#ffffff" : isDisabled ? "#ccc" : "#757575",
          }}
        />
        <span
          style={{
            color: isHovered ? "#ffffff" : isDisabled ? "#ccc" : "#757575",
          }}
        >
          {text}
        </span>
      </button>
      {extraIcon &&
        React.cloneElement(extraIcon, {
          color: isHovered ? "#ffffff" : isDisabled ? "#ccc" : "#757575",
        })}

      {isHovered && extraIcon && <ColorPallette onSelect={onColorSelect} />}
    </div>
  );
};

const ContextMenu = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { selectedNode } = useNodeStore();

  const setEditableNode = useNodeStore((state: any) => state.setEditableNode);
  const { roomData } = useRoom();
  const { addNode, updateNode, removeNode } = useNodeApi({
    roomId: roomData?.id ?? null,
  });

  useEffect(() => {
    const handleClick = () => setShowMenu(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e: any) => {
    e.preventDefault();
    setShowMenu(true);
    setPosition({ x: e.pageX, y: e.pageY });
    setOpenMenu(true);
  };

  const handleEditColor = useCallback(
    (value: any) => {
      if (selectedNode) {
        updateNode(selectedNode.id, "color", value);
      }
      setShowMenu(false);
    },
    [selectedNode]
  );

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const handleMenuClick = useCallback(
    (action: any, value?: any) => {
      switch (action) {
        case "new":
          console.log("Creating new note");
          addNode();
          break;
        case "delete":
          console.log("Deleting note");
          if (selectedNode) {
            removeNode(selectedNode);
          }
          break;
        case "edit":
          console.log("Editing note");
          if (selectedNode) {
            setEditableNode(selectedNode.id);
          }
          break;
        case "edit-color":
          console.log("Editing color");
          handleEditColor(value);
        default:
          break;
      }
      setShowMenu(false);

      return {};
    },
    [selectedNode, setShowMenu, removeNode]
  );

  return (
    <div>
      {showMenu && (
        <div
          style={{
            ...styles.contextMenu,
            top: `${position.y}px`,
            left: `${position.x}px`,
            zIndex: 9999,
          }}
        >
          <MenuItem
            icon={FilePlus}
            text="New Note"
            onClick={() => handleMenuClick("new")}
          />
          <MenuItem
            icon={Edit}
            isDisabled={!selectedNode}
            text="Edit Note"
            onClick={() => handleMenuClick("edit")}
          />
          <MenuItem
            isDisabled={!selectedNode}
            icon={Paintbrush}
            text="Change Color"
            onClick={(value: any) => handleMenuClick("edit-color", value)}
            extraIcon={
              <ChevronRight
                size={16}
                color={!selectedNode ? "#ccc" : "#757575"}
              />
            }
          />
          <MenuItem
            isDisabled={!selectedNode}
            icon={Trash2}
            text="Delete Note"
            onClick={() => handleMenuClick("delete")}
          />
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
