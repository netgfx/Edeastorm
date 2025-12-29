import { Box } from "@mui/material";
import { MdOutlineInfo } from "react-icons/md";

export function TooltipButton({ data }: { data: any }) {
  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
      }}
      id={`tile-${data.id}-tooltip`}
      className="tile-tooltip"
      sx={{
        opacity: 0,
        top: "-5px",
        right: "-5px",
        position: "absolute",
        display: "inline-flex",
        height: "36px",
        padding: "0px 16px",
        alignItems: "center",
        gap: "16px",
        flexShrink: 0,
        borderRadius: `4px`,
        background: `rgba(97, 97, 97, 0.90)`,
        color: `#FFF`,
        textAlign: `center`,
        fontFamily: `var(--font-roboto)`,
        fontSize: `14px`,
        fontStyle: `normal`,
        fontWeight: `400`,
        lineHeight: `22px`,
        letterSpacing: `0.1px`,
        cursor: "pointer",
      }}
    >
      View Details <MdOutlineInfo size={18} />
    </Box>
  );
}
