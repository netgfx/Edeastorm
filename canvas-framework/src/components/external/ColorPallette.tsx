import { NODE_COLOR, NODE_COLORS } from "../../helpers/constants";

const ColorSwab = ({
  color,
  colorName,
  onSelect,
}: {
  color: string;
  colorName: string;
  onSelect: (color: string) => void;
}) => {
  return (
    <div
      style={{
        backgroundColor: color,
        border: `2px solid lightgray`,
        borderRadius: "100%",
        width: "24px",
        height: "24px",
        cursor: "pointer",
      }}
      onClick={() => onSelect(colorName)}
    ></div>
  );
};
export const ColorPallette = ({
  onSelect,
}: {
  onSelect: (color: string) => void;
}) => {
  return (
    <div
      className="color-pallette"
      style={{
        position: "absolute",
        right: "calc(-120px)",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "center",
        width: "120px",
        backgroundColor: "white",
        borderRadius: "4px",
        boxShadow:
          "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)",
        padding: "8px 0",
      }}
    >
      {Object.entries(NODE_COLORS).map(([k, color]) => (
        <ColorSwab
          key={color}
          colorName={k}
          color={color}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
