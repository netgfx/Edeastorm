import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/Textarea";

interface CreateBoardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, problemStatement: string) => void;
  isCreating: boolean;
}

export function CreateBoardModal({
  isOpen,
  onOpenChange,
  onCreate,
  isCreating,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");

  const handleSubmit = () => {
    onCreate(title, problemStatement);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Start a new ideation session with your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Board Title *
            </label>
            <Input
              placeholder="e.g., Product Roadmap Brainstorm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Problem Statement / Challenge
            </label>
            <Textarea
              placeholder="What problem are we trying to solve? What's the challenge we're addressing?"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-zinc-500 mt-1">
              This will be displayed at the top of the board to guide ideation
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Board
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
