import { SupaUser } from "../../interfaces/canvasInterfaces";
import { UserIndicator } from "./UserIndicator";

export const UserBar = ({ users }: { users: SupaUser[] }) => {
  return (
    <section
      style={{
        position: "fixed",
        zIndex: 1,
        //minWidth: "300px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "10px",
        paddingRight: "10px",
        height: "auto",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",

        backgroundColor: "white",
        borderRadius: "4px",
        border: "2px solid black",
      }}
    >
      {users.map((user, index) => (
        <UserIndicator key={index} user={user} />
      ))}
    </section>
  );
};
