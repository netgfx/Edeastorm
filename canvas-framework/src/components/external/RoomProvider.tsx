import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSupabase } from "./APIProvider";
import {
  getInitialConnectedUsers,
  getInitialEntities,
  getRoomByShortId,
  joinRoom,
  subscribeToPresence,
} from "../../API/supabaseFns";
import { MainNodeChild } from "../../models/MainNodeChild";
import { RoomProviderProps, SupaUser } from "../../interfaces/canvasInterfaces";
import {
  useNodeStore,
  useGlobalStore,
  CoreState,
} from "../../state/globalState";
import _ from "lodash";
import { RealtimePresenceState } from "@supabase/supabase-js";

interface RoomState {
  connectedUsers: Record<string, any>; // Replace 'any' with your user type
  roomData: any | null; // Replace 'any' with your room data type
  isConnected: boolean;
  error: Error | null;
}

interface RoomContextType extends RoomState {
  username: string;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({
  children,
  initialUsername,
  roomId,
}: RoomProviderProps) {
  // global store
  const insertNodes = useNodeStore((state) => state.insertNodes);
  const removeNode = useNodeStore((state) => state.removeNode);
  const addNode = useNodeStore((state) => state.addNode);
  const setCurrentUsers = useGlobalStore(
    (state: CoreState) => state.setCurrentUsers
  );
  const setCurrentUser = useGlobalStore(
    (state: CoreState) => state.setCurrentUser
  );

  const supabase = useSupabase();
  const [state, setState] = useState<RoomState>({
    connectedUsers: {},
    roomData: null,
    isConnected: false,
    error: null,
  });

  // Initialize room connection and subscriptions
  useEffect(() => {
    if (!roomId) return;

    let entitySubscription: any;
    let userSubscription: any;

    async function initializeRoom() {
      try {
        // Get room data
        const { room, user } = await joinRoom(roomId!, initialUsername);

        if (user) {
          setCurrentUser(user);
        }

        if (room === null) {
          return;
        }

        // Get initial entities
        const entities = await getInitialEntities(room.id);
        // Get initial connected users
        const users = await getInitialConnectedUsers(room.id);

        insertNodes(entities as MainNodeChild[]);
        console.log("entities & users: ", entities, users);
        if (users) {
          setCurrentUsers(users);
        }

        subscribeToPresence(room.id);

        // Initialize state with fetched data
        setState((prev) => ({
          ...prev,
          connectedUsers:
            users?.reduce(
              (acc: any, user: SupaUser) => ({
                ...acc,
                [user.username]: user,
              }),
              {}
            ) || {},
          roomData: room,
          isConnected: true,
        }));

        // Subscribe to entity changes
        entitySubscription = supabase
          .channel(`room:${room.id}:entities`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_entities",
              filter: `room_id=eq.${room.id}`,
            },
            (payload: any) => {
              switch (payload.eventType) {
                case "INSERT":
                  addNode(payload.new);
                  break;
                case "UPDATE":
                  addNode(payload.new);
                  break;
                case "DELETE":
                  removeNode(payload.old.id);
                  break;
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "room_entities",
            },
            (payload: any) => {
              // this might flood the clients, we might have to implement soft-delete
              if (
                payload.old &&
                _.find(
                  useNodeStore.getState().nodes,
                  (item, index) => item.id === payload.old.id
                ) !== undefined
              ) {
                console.log("removing entity ", payload.old.id);

                removeNode(payload.old.id);
              }
            }
          )
          .subscribe();

        // Subscribe to user presence changes
        userSubscription = supabase
          .channel(`room:${room.id}:users`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_users",
              filter: `room_id=eq.${room.id}`,
            },
            (payload: any) => {
              setState((prev) => {
                const users = { ...prev.connectedUsers };

                switch (payload.eventType) {
                  case "INSERT":
                    users[payload.new.username] = payload.new;
                  case "UPDATE":
                    users[payload.new.username] = payload.new;
                    break;
                  case "DELETE":
                    delete users[payload.old.username];
                    break;
                }

                return { ...prev, connectedUsers: users };
              });
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_users",
            },
            async (payload: any) => {
              const { data: users } = await supabase
                .from("room_users")
                .select("*")
                .eq("room_id", room.id);

              if (users) {
                console.log("current users: ", users);
                setCurrentUsers(users);
              }
            }
          )
          .subscribe();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to initialize room"),
          isConnected: false,
        }));
      }
    }

    initializeRoom();

    // Cleanup subscriptions
    return () => {
      entitySubscription?.unsubscribe();
      userSubscription?.unsubscribe();
    };
  }, [roomId, initialUsername, supabase]);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        username: initialUsername,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
