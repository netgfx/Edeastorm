import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface InviteMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName?: string;
  onInvite: (email: string, role: "admin" | "editor" | "viewer") => void;
  isInviting: boolean;
}

export function InviteMemberModal({
  isOpen,
  onOpenChange,
  orgName,
  onInvite,
  isInviting,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");

  const handleSubmit = () => {
    onInvite(email, role);
    setEmail(""); // Reset after invite? Or let parent close decide.
    // Parent closes modal on success, so we might want to keep it if failed?
    // But parent handles the logic. Assuming success resets.
  };

  // Actually, resetting logic is tricky if managed by parent prop.
  // Better to just call onInvite.

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join {orgName}. They will receive an email
            with instructions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">
              Email Address
            </label>
            <Input
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(["admin", "editor", "viewer"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                    role === r
                      ? "bg-violet-500/10 border-violet-500 text-violet-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-medium capitalize">{r}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {role === "admin" && "Can manage team members and all boards."}
              {role === "editor" && "Can create and edit boards."}
              {role === "viewer" && "Can only view boards. No editing allowed."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isInviting || !email.trim()}>
            {isInviting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
