import { htmlDecode } from "../../helpers/utils";
import { useNodeStore } from "../../state/globalState";
import _ from "lodash";
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import sanitizeHtml from "sanitize-html";
import { useNodeApi } from "../../API/useNodesAPI";
import { useRoom } from "./RoomProvider";

/**
 * Component to support
 * @param param0
 * @returns
 */
export function EditableNode({
  id,
  metadata,
  focus,
}: {
  id: string;
  metadata: any;
  focus: boolean;
  saveTile: (value: any) => void;
}) {
  const setEditableNode = useNodeStore((state: any) => state.setEditableNode);
  const editableNode = useNodeStore((state: any) => state.editableNode);
  const { roomData } = useRoom();
  const { updateNode, removeNode } = useNodeApi({
    roomId: roomData?.id ?? null,
  });
  const inputRef = useRef<HTMLElement>();
  const stickyContent = useRef("");
  const idRef = useRef(id);
  const maxLength = 60;
  const sanitizeConf: any = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "recursiveEscape",
  };
  //
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      setEditableNode(id);
    },
    [id]
  );

  const handleChange = (evt: ContentEditableEvent) => {
    if (evt.target.value.length <= maxLength) {
      stickyContent.current = evt.target.value;
    }
  };

  const handleFocus = (evt: ContentEditableEvent) => {
    const range = document.createRange();
    if (evt.target instanceof Node) {
      range.selectNodeContents(evt.target);
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const sanitize = (i: string) => {
    return sanitizeHtml(i, sanitizeConf);
  };

  const focusOut = (shouldSanitize: boolean) => {
    if (shouldSanitize) {
      const value = sanitize(stickyContent.current);
      //send it to Backend
      saveNote(value);
    }
  };

  const removeNodeByShortcut = (e: KeyboardEvent) => {
    const selected = useNodeStore.getState().selectedNode;

    if (e.key.toLowerCase() === "delete") {
      if (selected?.id) {
        removeNode(selected);
      }
    }
  };

  // #note, #save
  const saveNote = (value: string) => {
    const items = _.cloneDeep(useNodeStore.getState().nodes);

    if (items) {
      updateNode(id, "title", value);
    }
  };

  const checkKeyEvent = (key: string) => {
    return {
      ArrowLeft: "Allowed",
      ArrowRight: "Allowed",
      ArrowUp: "Allowed",
      ArrowDown: "Allowed",
      Backspace: "Allowed",
    }[key];
  };

  const keyDownHandler = (event: any) => {
    if (event.key === "Escape") {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }

    if (inputRef.current) {
      if (
        inputRef.current.innerHTML.length >= 120 &&
        checkKeyEvent(event.key) !== "Allowed"
      )
        return event.preventDefault();
    }
  };

  // use effect
  useEffect(() => {
    idRef.current = id;
  }, [id]);

  useEffect(() => {
    const selection = window.getSelection();
    if (editableNode) {
      if (editableNode === id && inputRef.current) {
        if (selection) {
          selection.removeAllRanges();
        }
        inputRef.current.focus();
      } else {
      }
    } else {
      if (inputRef.current) {
        inputRef.current.blur();
        if (selection) {
          selection.removeAllRanges();
        }
        focusOut(false);
      }
    }
  }, [editableNode, id]);

  useEffect(() => {
    if (focus !== undefined && focus !== null) {
      focusOut(focus);
    }
  }, [focus]);

  const value = useMemo(() => {
    if (metadata) {
      const finalHtml = htmlDecode(metadata.title);

      if (finalHtml) {
        stickyContent.current = finalHtml;
      }

      return stickyContent.current;
    } else return "";
  }, [metadata]);

  useEffect(() => {
    window.addEventListener("keydown", removeNodeByShortcut);

    return () => {
      window.removeEventListener("keydown", removeNodeByShortcut);
    };
  }, []);

  return (
    <div
      className="flex justify-center items-center sticky-content-wrapper absolute top-0 left-[2px]"
      onDoubleClick={(e) => onDoubleClick(e)}
    >
      <ContentEditable
        className="sticky-content text-center"
        innerRef={inputRef as RefObject<HTMLElement>}
        html={value}
        onFocus={(e) => handleFocus(e as any)}
        onBlur={() => focusOut(true)}
        onChange={handleChange}
        onKeyDown={keyDownHandler}
        style={{
          pointerEvents: "auto",
          height: "auto",
          fontSize: `${metadata?.textSize}px`,
        }}
      />
    </div>
  );
}
