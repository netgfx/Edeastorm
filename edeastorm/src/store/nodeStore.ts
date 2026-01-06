import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import type { CanvasItem } from '@/types/canvas';
import _ from 'lodash';

interface NodeState {
  nodes: CanvasItem[];
  selectedNode: CanvasItem | null;
  isDraggingNode: string | null;
  editableNode: string | null;
  
  // Actions
  setNodes: (nodes: CanvasItem[]) => void;
  addNode: (node: CanvasItem) => void;
  insertNodes: (nodes: CanvasItem[]) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<CanvasItem>) => void;
  setSelectedNode: (node: CanvasItem | null) => void;
  setEditableNode: (id: string | null) => void;
  setIsDraggingNode: (id: string | null) => void;
  clearNodes: () => void;
}

export const useNodeStore = create<NodeState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        nodes: [],
        selectedNode: null,
        isDraggingNode: null,
        editableNode: null,

        setNodes: (nodes) => set({ nodes }, false, { type: 'nodes/set', payload: { count: nodes.length } }),

        addNode: (node) =>
          set(
            (state) => {
              const existingIndex = state.nodes.findIndex((n) => n.id === node.id);
              if (existingIndex >= 0) {
                // Update existing node
                const updatedNodes = [...state.nodes];
                updatedNodes[existingIndex] = node;
                return { nodes: updatedNodes };
              }
              // Add new node
              return { nodes: [...state.nodes, node] };
            },
            false,
            { type: 'nodes/add', payload: { id: node.id } }
          ),

        insertNodes: (nodes) =>
          set(
            () => ({ nodes }),
            false,
            { type: 'nodes/insert', payload: { count: nodes.length } }
          ),

        removeNode: (id) =>
          set(
            (state) => ({
              nodes: state.nodes.filter((n) => n.id !== id),
              selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
              editableNode: state.editableNode === id ? null : state.editableNode,
            }),
            false,
            { type: 'nodes/remove', payload: { id } }
          ),

        updateNode: (id, updates) =>
          set(
            (state) => ({
              nodes: state.nodes.map((n) =>
                n.id === id ? { ...n, ...updates } : n
              ),
            }),
            false,
            { type: 'nodes/update', payload: { id, updates } }
          ),

        setSelectedNode: (node) =>
          set({ selectedNode: node }, false, { type: 'nodes/select', payload: { id: node?.id } }),

        setEditableNode: (id) =>
          set({ editableNode: id }, false, { type: 'nodes/editable', payload: { id } }),

        setIsDraggingNode: (id) =>
          set({ isDraggingNode: id }, false, { type: 'nodes/dragging', payload: { id } }),

        clearNodes: () =>
          set(
            { nodes: [], selectedNode: null, editableNode: null, isDraggingNode: null },
            false,
            { type: 'nodes/clear' }
          ),
      }),
      { name: 'NodeStore' }
    )
  )
);
