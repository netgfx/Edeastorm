import "./styles/styles.css";
import "./styles/editor.css";
import StickyCanvas from "./components/StickyCanvas";
import { CanvasContent } from "./components/external/CanvasContent";
import SupabaseProvider from "./components/external/APIProvider";
import { getRoomIdFromUrl } from "./helpers/utils";
import { useEffect, useState } from "react";
import { RoomProvider } from "./components/external/RoomProvider";
import { NoContentText } from "./components/external/NoContentText";
import { GridCanvas } from "./components/GridCanvas";
import ContextMenu from "./components/shared/ContextMenu";
import { NodeItem } from "./components/external/NodeItem";
import { useLocalStorage } from "./components/shared/hooks/useLocalStorage";
import UsernameModal from "./components/UI/UsernameModal";
import { UserBar } from "./components/UI/UserBar";
import { CoreState, useGlobalStore } from "./state/globalState";
import { UserTracking } from "./components/external/UserTracking";

export default function App() {
  const roomId = "aebe8e34e9"; //getRoomIdFromUrl();
  const [username, setUsername] = useLocalStorage("username", "");
  const users = useGlobalStore((state: CoreState) => state.users);

  useEffect(() => {
    console.log("username: ", username);
  }, [username]);

  return (
    <div className="App">
      {!username && <UsernameModal />}
      <SupabaseProvider>
        <RoomProvider initialUsername={username ?? ""} roomId={roomId}>
          <GridCanvas>
            <GridCanvas.OuterChildren>
              <ContextMenu />
              <NoContentText />
              <UserBar users={users} />
              <UserTracking />
            </GridCanvas.OuterChildren>
            <GridCanvas.InnerChildren>
              <CanvasContent>
                <NodeItem />
              </CanvasContent>
            </GridCanvas.InnerChildren>
          </GridCanvas>
        </RoomProvider>
      </SupabaseProvider>
    </div>
  );
}
