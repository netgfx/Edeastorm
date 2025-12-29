import _ from "lodash";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { Position, SupaUser } from "../interfaces/canvasInterfaces";
import { MainNodeChild } from "../models/MainNodeChild";

export interface CoreState {
  currentUser: SupaUser | null;
  setCurrentUser: (value: SupaUser) => void;
  users: SupaUser[];
  setCurrentUsers: (value: SupaUser[]) => void;
  updateUserPosition: (userId: string, pos: Position) => void;
  currentRoom: string | null;
  setCurrentRoom: (value: string) => void;
  lastUpdated: number;
  setLastUpdated: (value: number) => void;
}

export interface DraggableElement {
  ref: Record<string, any>;
  id: string;
  parentId: string;
  // include other properties here as necessary
}

interface EditorState {
  canvasScale: number;
  previousPos: Record<string, number>;
  setPreviousPos: (value: Record<string, number>) => void;
  setCanvasScale: (value: any) => void;
}

export interface NodeState {
  nodes: MainNodeChild[];
  selectedNode: MainNodeChild | null;
  isDraggingNode: string | null;
  editableNode: string | null;
  setIsDraggingNode: (value: string | null) => void;
  addNode: (node: MainNodeChild) => void;
  insertNodes: (nodes: MainNodeChild[]) => void;
  removeNode: (id: any) => void;
  setEditableNode: (value: any) => void;
  setSelectedNode: (value: MainNodeChild | null) => void;
  setMainNodesProperty: (value: any) => void;
}

// STORES
export const useGlobalStore = create<CoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      setCurrentUser: (value) => set({ currentUser: value }),
      users: [],
      setCurrentUsers: (value: any[]) => set({ users: value }),
      currentRoom: null,
      updateUserPosition: (id: string, pos: any) =>
        set((state) => {
          const _users = _.cloneDeep(state.users);

          const users = _users.map((user) => {
            if (user.id === id) {
              return { ...user, metadata: { ...user.metadata, position: pos } };
            }
            return user;
          });

          return { users: users };
        }),
      setCurrentRoom: (value: string) => set({ currentRoom: value }),
      lastUpdated: 0,
      setLastUpdated: (value: number) => set({ lastUpdated: value }),
    }),
    {
      name: "draggable-storage-v0", // name of item in the storage (must be unique)
      //storage: createJSONStorage(() => sessionStorage), // (optional) by default the 'localStorage' is used
      //partialize: (state) => ({ bears: state.bears }),
    }
  )
);

export const useNodeStore = create<NodeState>()(
  subscribeWithSelector(
    devtools((set) => ({
      nodes: [],
      selectedNode: null,
      editableNode: "",
      isDraggingNode: null,
      setEditableNode: (value: any) => set(() => ({ editableNode: value })),
      setIsDraggingNode: (value: string | null) =>
        set(
          () => ({
            isDraggingNode: value,
          }),
          false,
          {
            type: "dragging node",
            payload: { value },
          }
        ),
      addNode: (node: MainNodeChild) =>
        set(
          (state) => {
            const _nodes = _.cloneDeep(state.nodes);
            _nodes.push(node);
            const finalNodes = _.uniqBy(_.reverse(_nodes), "id");

            return {
              nodes: _.reverse(finalNodes),
            };
          },
          false,
          { type: "add/node", payload: node }
        ),
      insertNodes: (nodes: MainNodeChild[]) =>
        set(
          (state) => {
            return {
              nodes: nodes,
            };
          },
          false,
          { type: "insert/nodes", payload: nodes }
        ),
      removeNode: (id: string) =>
        set(
          (state: NodeState) => {
            const _nodes = _.cloneDeep(state.nodes);
            _.remove(_nodes, (o) => o.id === id);

            return { nodes: _nodes };
          },
          false,
          { type: "remove/node", payload: { id } }
        ),
      setSelectedNode: (value: any) =>
        set(() => ({ selectedNode: value }), false, {
          type: "selected node",
          payload: { value },
        }),

      setMainNodesProperty: (nodes: MainNodeChild[]) =>
        set(
          (state: NodeState) => {
            // const nodes = state.nodes.map((node) => {
            //   if (node.id === node.id) {
            //     node[key] = value;
            //     node.metadata[key] = value;
            //   }

            //   return node;
            // });

            return { nodes: nodes };
          },
          false,
          { type: "modify property", payload: { nodes } }
        ),
    }))
  )
);

export const useEditorStore = create<EditorState>()(
  devtools(
    (set) => ({
      canvasScale: 1,
      previousPos: { x: 0, y: 0 },
      setPreviousPos: (value: Record<string, number>) =>
        set(() => ({ previousPos: value })),
      setCanvasScale: (value: any) => set(() => ({ canvasScale: value })),
    }),
    { name: "draggable-editorStorage" }
  )
);
