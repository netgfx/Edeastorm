import { useCallback } from "react";
import { SupaUser } from "../../interfaces/canvasInterfaces";

export const UserIndicator = ({ user }: { user: SupaUser }) => {
  const getFirstLetter = useCallback(() => {
    return user.username.charAt(0).toUpperCase();
  }, [user]);

  return (
    <div
      style={{
        borderRadius: "100%",
        width: "24px",
        height: "24px",
        background: "white",
        color: "black",
        border: "2px solid black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>{getFirstLetter()}</div>
    </div>
  );
};
