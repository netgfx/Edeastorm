/** @format */

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  Settings,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas";
import { CanvasContent } from "@/components/canvas/CanvasContent";
import { Toolbar } from "@/components/canvas/Toolbar";
import { CursorLayer } from "@/components/canvas/CursorLayer";
import { CursorBroadcaster } from "@/components/canvas/CursorBroadcaster";
import { UserBar } from "@/components/canvas/UserBar";
import { ProblemCard } from "@/components/canvas/ProblemCard";
import { BoardImageGallery } from "@/components/canvas/BoardImageGallery";
import { ImageUploadModal } from "@/components/canvas/ImageUploadModal";
import { AIInsightsModal } from "@/components/canvas/AIInsightsModal";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

import { useNodeStore } from "@/store/nodeStore";
import { useGlobalStore } from "@/store/globalStore";
import { useEditorStore } from "@/store/editorStore";
import { useRealtimeWorker } from "@/hooks/useRealtimeWorker";
import {
  getBoardByShortId,
  getCanvasItems,
  createCanvasItem,
  updateCanvasItem,
  deleteCanvasItem,
  joinRoom,
  getRoomUsers,
  createSnapshot,
  getBoardImages,
  getOrganizationMembers,
} from "@/lib/api";
import { findCenter, throttle } from "@/lib/utils";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_WIDTH,
  TILE_HEIGHT,
  DEFAULT_NOTE_COLOR,
  NOTE_COLORS,
} from "@/lib/constants";
import type { Tables } from "@/types/database";
import type { CanvasItem, UserPresence, BoardImage } from "@/types/canvas";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const shortId = params.shortId as string;
  const worker = useRealtimeWorker();

  // Stores
  const {
    insertNodes,
    addNode,
    updateNode,
    removeNode,
    setSelectedNode,
    setEditableNode,
    clearNodes,
  } = useNodeStore();
  const {
    users,
    setUsers,
    addUser,
    currentUser,
    setCurrentRoom,
    setUsername,
    username,
  } = useGlobalStore();
  const setLoading = useEditorStore((state) => state.setLoading);
  const isLoading = useEditorStore((state) => state.isLoading);
  const theme = useEditorStore((state) => state.theme);
  const setTheme = useEditorStore((state) => state.setTheme);

  // Handle theme persistence
  useEffect(() => {
    const userId = session?.user?.id || username || "anonymous";
    const savedTheme = localStorage.getItem(`ideaflow-theme-${userId}`);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme as "light" | "dark");
    }
  }, [session?.user?.id, username, setTheme]);

  useEffect(() => {
    const userId = session?.user?.id || username || "anonymous";
    localStorage.setItem(`ideaflow-theme-${userId}`, theme);
  }, [theme, session?.user?.id, username]);

  // Local state
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [board, setBoard] = useState<Tables<"boards"> | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [roomUserId, setRoomUserId] = useState<string | null>(null);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "editor" | "viewer">(
    "editor"
  ); // Default to editor for now

  // Load board data
  useEffect(() => {
    async function loadBoard() {
      setLoading(true);
      try {
        const boardData = await getBoardByShortId(shortId);
        if (!boardData) {
          toast.error("Board not found");
          router.push("/dashboard");
          return;
        }
        setBoard(boardData);
        setCurrentRoom(boardData.id);

        // Check permissions
        if (session?.user?.id && boardData.organization_id) {
          const members = await getOrganizationMembers(
            boardData.organization_id
          );
          const member = members.find(
            (m: any) => m.user_id === session.user.id
          );
          if (member) {
            // @ts-ignore
            setUserRole(member.role);
          } else if (boardData.created_by === session.user.id) {
            setUserRole("admin");
          } else {
            // If public board, maybe viewer?
            // For now assume editor if not in org but has access (e.g. public)
            // But if it's an org board and user is not member, they shouldn't see it unless public
            if (boardData.is_public) {
              setUserRole("editor"); // Or viewer depending on public settings
            } else {
              // Should be handled by RLS, but UI wise:
              setUserRole("viewer");
            }
          }
        }

        // Load canvas items
        const items = await getCanvasItems(boardData.id);
        insertNodes(items);

        // Load board images
        const images = await getBoardImages(boardData.id);
        setBoardImages(images);

        // Check if user needs to set username
        if (sessionStatus !== "loading") {
          if (!session?.user && !username) {
            setIsUsernameModalOpen(true);
          } else {
            await initializePresence(boardData.id);
          }
        }
      } catch (error) {
        console.error("Error loading board:", error);
        toast.error("Failed to load board");
      } finally {
        if (sessionStatus !== "loading") {
          setLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      clearNodes();
      worker.unsubscribe();
    };
  }, [shortId, sessionStatus]);

  // Initialize realtime presence
  const initializePresence = async (boardId: string) => {
    const displayName = session?.user?.name || username || "Anonymous";

    // Join the room
    const roomUser = await joinRoom(
      boardId,
      session?.user?.id || null,
      displayName
    );
    if (roomUser) {
      setRoomUserId(roomUser.id);
    }

    // Get existing room users
    const roomUsers = await getRoomUsers(boardId);
    const presenceUsers: UserPresence[] = roomUsers.map((u) => ({
      id: u.id,
      username: u.username,
      cursor: { x: u.cursor_x ?? 0, y: u.cursor_y ?? 0 },
      color: u.color,
      lastSeen: new Date(u.last_seen),
    }));
    setUsers(presenceUsers);

    // Subscribe using Worker
    worker.subscribe(boardId, {
      onItemChange: (payload) => {
        switch (payload.eventType) {
          case "INSERT":
            addNode(payload.new as CanvasItem);
            break;
          case "UPDATE":
            addNode(payload.new as CanvasItem);
            break;
          case "DELETE":
            if (payload.old?.id) {
              removeNode(payload.old.id);
            }
            break;
        }
      },
      onPresenceChange: async () => {
        // Refresh room users
        const updatedUsers = await getRoomUsers(boardId);
        const presenceUsers: UserPresence[] = updatedUsers.map((u) => ({
          id: u.id,
          username: u.username,
          cursor: { x: u.cursor_x ?? 0, y: u.cursor_y ?? 0 },
          color: u.color,
          lastSeen: new Date(u.last_seen),
        }));
        setUsers(presenceUsers);
      },
      onCursorMove: (payload) => {
        // Update user cursor position in store
        const existingUsers = useGlobalStore.getState().users;
        const user = existingUsers.find((u) => u.id === payload.userId);
        if (user) {
          addUser({ ...user, cursor: payload.position });
        }
      },
    });
  };

  // Handle username submission
  const handleUsernameSubmit = async () => {
    if (!tempUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }
    setUsername(tempUsername);
    setIsUsernameModalOpen(false);
    if (board) {
      await initializePresence(board.id);
    }
  };

  // Add new note
  const handleAddNote = useCallback(async () => {
    if (!board || !session?.user?.id) return;

    const center = findCenter(true);
    let targetX = center.x - TILE_WIDTH / 2;
    let targetY = center.y - TILE_HEIGHT / 2;

    // Avoid Problem Card overlap (Card is at center of 10k x 10k canvas)
    const canvasCenterX = CANVAS_WIDTH / 2;
    const canvasCenterY = CANVAS_HEIGHT / 2;
    const cardHalfWidth = 200;
    const cardHalfHeight = 100;

    const isOverlappingCard =
      targetX + TILE_WIDTH > canvasCenterX - cardHalfWidth &&
      targetX < canvasCenterX + cardHalfWidth &&
      targetY + TILE_HEIGHT > canvasCenterY - cardHalfHeight &&
      targetY < canvasCenterY + cardHalfHeight;

    if (isOverlappingCard) {
      targetY += 200; // Move downwards by 200 pixels
    }

    const colorKeys = Object.keys(NOTE_COLORS);
    const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];

    const item = await createCanvasItem(board.id, {
      item_type: "sticky_note",
      x: targetX,
      y: targetY,
      z_index: useNodeStore.getState().nodes.length + 1,
      metadata: {
        title: "",
        description: "",
        color: randomColor,
        textSize: 14,
        size: { width: TILE_WIDTH, height: TILE_HEIGHT },
      },
      created_by: session.user.id,
    });

    if (item) {
      addNode(item);
      toast.success("Note added!");
    }
  }, [board, session?.user?.id, addNode]);

  // Add new header
  const handleAddHeader = useCallback(async () => {
    if (!board || !session?.user?.id) return;

    const center = findCenter(true);
    const headerWidth = 400;
    const headerHeight = 120;
    let targetX = center.x - headerWidth / 2;
    let targetY = center.y - headerHeight / 2;

    // Avoid Problem Card overlap
    const canvasCenterX = CANVAS_WIDTH / 2;
    const canvasCenterY = CANVAS_HEIGHT / 2;
    const cardHalfWidth = 200;
    const cardHalfHeight = 100;

    const isOverlappingCard =
      targetX + headerWidth > canvasCenterX - cardHalfWidth &&
      targetX < canvasCenterX + cardHalfWidth &&
      targetY + headerHeight > canvasCenterY - cardHalfHeight &&
      targetY < canvasCenterY + cardHalfHeight;

    if (isOverlappingCard) {
      targetY += 250; // Move downwards
    }

    const item = await createCanvasItem(board.id, {
      item_type: "header",
      x: targetX,
      y: targetY,
      z_index: useNodeStore.getState().nodes.length + 1,
      metadata: {
        title: "New Header",
        textSize: "h2",
        size: { width: headerWidth, height: headerHeight },
      },
      created_by: session.user.id,
    });

    if (item) {
      addNode(item);
      toast.success("Header added! Double-click to edit.");
    }
  }, [board, session?.user?.id, addNode]);

  // Add new image - create a placeholder image on canvas
  const handleAddImage = useCallback(async () => {
    if (!board || !session?.user?.id) return;

    // Create file input to trigger upload
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      // Validate file
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be under 10MB");
        return;
      }

      try {
        // Get image dimensions
        const img = new window.Image();
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve) => {
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.src = URL.createObjectURL(file);
          }
        );

        // Create form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("boardId", board.id);
        formData.append("caption", "");
        formData.append("displayOrder", boardImages.length.toString());
        formData.append("width", dimensions.width.toString());
        formData.append("height", dimensions.height.toString());

        // Upload via API route
        const response = await fetch("/api/board-images/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(`Failed to upload image: ${result.error}`);
          return;
        }

        // Construct public URL from storage path
        const imageData = result.data;
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/board-images/${imageData.storage_path}`;

        // Add to boardImages state immediately
        setBoardImages((prev) => [...prev, imageData]);

        // Calculate canvas position
        const center = findCenter(true);
        const imageWidth = Math.min(400, dimensions.width);
        const imageHeight = (imageWidth / dimensions.width) * dimensions.height;
        const targetX = center.x - imageWidth / 2;
        const targetY = center.y - imageHeight / 2;

        // Create canvas item with the uploaded image URL
        const item = await createCanvasItem(board.id, {
          item_type: "image",
          x: targetX,
          y: targetY,
          z_index: useNodeStore.getState().nodes.length + 1,
          metadata: {
            url: publicUrl,
            alt: file.name,
            size: { width: imageWidth, height: imageHeight },
          },
          created_by: session.user.id,
        });

        if (item) {
          addNode(item);
          toast.success("Image added to canvas!");
        }

        // Cleanup
        URL.revokeObjectURL(img.src);
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image");
      }
    };
    input.click();
  }, [board, session?.user?.id, boardImages.length, addNode]);

  // Update item
  const handleUpdateItem = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      const updated = await updateCanvasItem(id, updates as any);
      if (updated) {
        updateNode(id, updated as any);
      } else {
        toast.error("Failed to save changes");
      }
    },
    [updateNode]
  );

  // Delete item
  const handleDeleteItem = useCallback(
    async (id: string) => {
      const success = await deleteCanvasItem(id);
      if (success) {
        removeNode(id);
        setSelectedNode(null);
        setEditableNode(null);
        toast.success("Item deleted");
      }
    },
    [setSelectedNode, setEditableNode, removeNode]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (id: string, x: number, y: number) => {
      await updateCanvasItem(id, { x, y });
    },
    []
  );

  // Save snapshot
  const handleSave = useCallback(async () => {
    if (!board || !session?.user?.id) return;

    const result = await createSnapshot(
      board.id,
      `Snapshot ${new Date().toLocaleString()}`,
      "",
      session.user.id
    );

    if (result) {
      toast.success("Snapshot saved!");
    } else {
      toast.error("Failed to save snapshot");
    }
  }, [board, session?.user?.id]);

  // Refresh board images after upload
  const handleImageUploadComplete = useCallback(async () => {
    if (!board) return;
    console.log("Refreshing board images for board:", board.id);
    const images = await getBoardImages(board.id);
    console.log("Fetched images:", images);
    setBoardImages(images);
  }, [board]);

  // Copy share link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/board/${shortId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable shortcuts for viewers
      if (userRole === "viewer") return;

      // Delete selected node
      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = useNodeStore.getState().selectedNode;
        if (selected && useNodeStore.getState().editableNode !== selected.id) {
          handleDeleteItem(selected.id);
        }
      }

      // Deselect on Escape
      if (e.key === "Escape") {
        setSelectedNode(null);
        setEditableNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteItem, setSelectedNode, setEditableNode, userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading board...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold text-sm leading-tight">
                {board?.title || "Loading..."}
              </h1>
              {board?.problem_statement && (
                <div className="flex items-center gap-1.5 opacity-80">
                  <div className="w-1 h-1 rounded-full bg-violet-400" />
                  <p className="text-[10px] text-violet-300 font-medium uppercase tracking-wider max-w-[300px] truncate">
                    {board.problem_statement}
                  </p>
                </div>
              )}
            </div>
            {userRole === "viewer" && (
              <span className="ml-2 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700">
                View Only
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserBar />
          <div className="w-px h-6 bg-zinc-800 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="h-8 gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      {userRole !== "viewer" && (
        <Toolbar
          onAddNote={handleAddNote}
          onAddHeader={handleAddHeader}
          onAddImage={handleAddImage}
          onSave={handleSave}
          boardId={board?.id}
          boardShortId={shortId}
          isCreator={session?.user?.id === board?.created_by}
          onOpenAIInsights={() => setIsAIInsightsOpen(true)}
          onImageUploadComplete={handleImageUploadComplete}
        />
      )}

      {/* Canvas */}
      <div className="pt-14 h-full relative">
        {/* Board Image Gallery */}
        <BoardImageGallery images={boardImages} boardShortId={shortId} />

        <InfiniteCanvas
          outerChildren={
            <>
              <CursorLayer currentPresenceId={roomUserId} />
              <CursorBroadcaster worker={worker} roomUserId={roomUserId} />
            </>
          }
        >
          {board?.problem_statement && (
            <ProblemCard
              title={board.title}
              problemStatement={board.problem_statement}
            />
          )}
          <CanvasContent
            onUpdateItem={
              userRole !== "viewer" ? handleUpdateItem : async () => {}
            }
            onDeleteItem={
              userRole !== "viewer" ? handleDeleteItem : async () => {}
            }
            onDragEnd={userRole !== "viewer" ? handleDragEnd : async () => {}}
            readOnly={userRole === "viewer"}
          />
        </InfiniteCanvas>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share This Board</DialogTitle>
            <DialogDescription>
              Anyone with the link can view and collaborate on this board
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Input
              value={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/board/${shortId}`}
              readOnly
              className="flex-1"
            />
            <Button onClick={handleCopyLink}>
              {isCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Username Modal (for anonymous users) */}
      <Dialog open={isUsernameModalOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">
              Join the session
            </DialogTitle>
            <DialogDescription className="text-center">
              Enter your name to start collaborating with the team in real-time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Display Name
              </label>
              <Input
                placeholder="e.g. Alex Smith"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUsernameSubmit()}
                autoFocus
                className="h-11 bg-zinc-900 border-zinc-800 focus:border-violet-500 focus:ring-violet-500/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUsernameSubmit}
                className="w-full h-11 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25"
              >
                Join Board
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-center text-zinc-600">
              Your name will be visible to other participants.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Insights Modal */}
      {board?.id && (
        <AIInsightsModal
          isOpen={isAIInsightsOpen}
          onClose={() => setIsAIInsightsOpen(false)}
          boardId={board.id}
        />
      )}
    </div>
  );
}
