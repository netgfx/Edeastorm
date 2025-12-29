import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
} from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import React, { useCallback, useEffect } from "react";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";

export default function UsernameModal() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [data, setData] = useLocalStorage("username");

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = useCallback(() => {
    setData(name);
    setOpen(false);
  }, [name]);

  useEffect(() => {
    const existingUsername = localStorage.getItem("username");
    if (!existingUsername) {
      handleOpen();
    }
  }, []);

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Enter your desired username"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description"></DialogContentText>
          <TextField
            fullWidth
            required
            id="outlined-required"
            label="Username"
            variant="standard"
            value={name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setName(event.target.value);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
