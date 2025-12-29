import { Stack, Typography, styled, Button } from "@mui/material";
import _ from "lodash";
import { useNodeApi } from "../../API/useNodesAPI";
import { useNodeStore } from "../../state/globalState";
import { useRoom } from "./RoomProvider";

const NoContentTitle = styled(Typography)({
  color: "var(--honda-blue)",
  fontSize: `24px`,
  fontFamily: "var(--font-roboto)",
  fontWeight: "700",
  letterSpacing: 0.1,
  wordWrap: "break-word",
  whiteSpace: "pre-line",
  textAlign: "center",
});

const NoContentSub = styled(Typography)({
  color: "var(--honda-blue)",
  fontSize: `20px`,
  fontFamily: "var(--font-roboto)",
  fontWeight: "400",
  letterSpacing: 0.1,
  wordWrap: "break-word",
  whiteSpace: "pre-line",
  textAlign: "center",
});

export function NoContentText() {
  const { roomData } = useRoom();
  const mainNodes = useNodeStore((state) => state.nodes);
  const { addNode } = useNodeApi({
    roomId: roomData?.id ?? null,
  });
  const onCreateNew = (e: any) => {
    e.preventDefault();

    addNode();
  };

  return (
    <>
      {_.isEmpty(mainNodes) ? (
        <Stack
          data-clickable="true"
          sx={{
            position: "fixed",
            left: "53%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
          gap={"10px"}
        >
          <NoContentTitle>{`There Are Currently No Items`}</NoContentTitle>
          <NoContentSub>
            <a
              data-clickable="true"
              href="#"
              onClick={onCreateNew}
            >{`Create New +`}</a>
          </NoContentSub>
        </Stack>
      ) : (
        <></>
      )}
    </>
  );
}
