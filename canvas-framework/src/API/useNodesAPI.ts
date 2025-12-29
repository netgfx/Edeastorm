import {
  arrayToRecord,
  findCenter,
  findModifiedObjects,
  globallyMutateData,
  updateNestedProperty,
} from "../helpers/utils";
import { MainNodeChild } from "../models/MainNodeChild";
import { useNodeStore } from "../state/globalState";
import _ from "lodash";
import { useCallback, useEffect } from "react";
import { NODE_COLOR, TILE_HEIGHT, TILE_WIDTH } from "../helpers/constants";
import { NodeState } from "../state/globalState";
import { createEntity, deleteEntity, updateEntity } from "./supabaseFns";
// import { useRoom } from "../components/external/RoomProvider";

type State = {
  addNode: () => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, value: any) => void;
  removeAll: () => void;
  getAll: () => void;
};

export const useNodeApi = ({ roomId }: { roomId: string | null }) => {
  // state
  //const { createEntity, deleteEntity, updateEntity } = useRoom();
  const setMainNodesProperty = useNodeStore(
    (state: NodeState) => state.setMainNodesProperty
  );
  //const addNode = useNodeStore((state: NodeState) => state.addNode);
  const setSelectedNode = useNodeStore(
    (state: NodeState) => state.setSelectedNode
  );
  const getNodes = useNodeStore((state: NodeState) => state.nodes);
  const setEditableNode = useNodeStore(
    (state: NodeState) => state.setEditableNode
  );

  useEffect(() => {
    // Setup subscriptions or other room-specific logic
    if (roomId) {
      console.log("node api has roomId", roomId);
    }

    return () => {
      // Cleanup
    };
  }, [roomId]);

  // ADD NODES
  const addNode = useCallback(() => {
    // grab a fresh state of the nodes
    const mainNodes = getNodes;
    const _id = Object.entries(mainNodes).length + 1;

    // adding true here makes it position the cluster to the center of the viewport (even if the canvas has moved)
    const { x, y } = findCenter(true);

    // add generic main node
    const newNode: MainNodeChild = MainNodeChild.fromPlainObject({
      x: x + window.innerWidth / 2,
      y: y + window.innerHeight / 2,
      metadata: {
        color: NODE_COLOR,
        textSize: 12,
        size: { width: TILE_WIDTH, height: TILE_HEIGHT },
        title: "Add Text",
        description: "",
      },
    });

    // create the node on the server
    const mainNodeDataToSend = newNode.toPlainObject();

    // add the node to DB
    if (roomId) {
      createEntity(roomId, mainNodeDataToSend);
    }
  }, [roomId, getNodes]);

  /**
   * Remove node and slots
   * @param id the main node id
   */
  const removeNode = useCallback(
    (node: MainNodeChild) => {
      const mainNodes = useNodeStore.getState().nodes;

      const _nodes = _.pickBy(_.cloneDeep(mainNodes), (o) => o.id !== node.id);

      // remove node from DB
      if (roomId) {
        deleteEntity(roomId, node.id);
      }

      setSelectedNode(null);
      setEditableNode(null);
    },
    [roomId]
  );

  const updateNode = useCallback(
    (id: string, property: any, value: any) => {
      const nodes = useNodeStore.getState().nodes;
      const _nodes = _.cloneDeep(nodes);
      let _initialNodes = _.cloneDeep(nodes); // for heuristic detection
      let result: MainNodeChild | undefined = _.find(
        _nodes,
        (o) => o.id === id
      );
      const _initialResult = _.cloneDeep(result);

      // end of variables
      if (result !== null && result !== undefined) {
        if (Array.isArray(property)) {
          property.forEach((prop) => {
            if (typeof value === "object" && value !== null && prop in value) {
              if (result) {
                result[prop] = value[prop];
              }
            }
          });
        } else {
          result = updateNestedProperty(result, property, value);
          //result[property] = value;
        }

        let _modifiedNodes = _.cloneDeep(_nodes);

        // find type of action performed on the object
        const { addition, modification, deletion } = findModifiedObjects(
          _initialNodes,
          _modifiedNodes
        );

        const additions = Object.keys(addition);
        const modifications = Object.keys(modification);
        const deletions = Object.keys(deletion);

        // end of heuristic detection //

        console.log(property, value);
        // update the node in DB
        if (result && roomId) {
          setMainNodesProperty(_nodes);
          updateEntity(roomId, result);
        }
      }
    },
    [roomId]
  );

  //////////////////////////////////////////////////////////////////////

  // return
  return { addNode, updateNode, removeNode };
};
