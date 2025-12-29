import { useNodeStore } from "../../state/globalState";
import { useMemo } from "react";
import _ from "lodash";
import { NodeController } from "../NodeController";

export function CanvasContent({ children }: { children: React.ReactNode }) {
  const mainNodes = useNodeStore((state) => state.nodes);

  const tiles = useMemo(() => {
    console.log("main nodes", mainNodes);
    return (
      <div className="stickies" id="stickies-container">
        {(mainNodes ?? []).map((value, index) => (
          <NodeController key={index} data={value}>
            {children}
          </NodeController>
        ))}
        {/* <NodeController data={{ id: 1 }}>
          <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/crayon.jpg" />
        </NodeController> */}
      </div>
    );
  }, [mainNodes]);

  return <>{!_.isEmpty(mainNodes) && tiles}</>;
}
