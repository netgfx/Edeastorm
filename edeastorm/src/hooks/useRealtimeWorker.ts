import { useEffect, useRef, useCallback } from 'react';

interface WorkerCallbacks {
  onItemChange?: (payload: any) => void;
  onPresenceChange?: (payload: any) => void;
  onCursorMove?: (payload: any) => void;
  onStatusChange?: (status: string) => void;
}

export function useRealtimeWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<WorkerCallbacks>({});

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/realtime.worker.ts', import.meta.url));

    // Set up message handler
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      const cbs = callbacksRef.current;

      switch (type) {
        case 'ITEM_CHANGE':
          cbs.onItemChange?.(payload);
          break;
        case 'PRESENCE_CHANGE':
          cbs.onPresenceChange?.(payload);
          break;
        case 'CURSOR_MOVE':
          cbs.onCursorMove?.(payload);
          break;
        case 'STATUS':
          cbs.onStatusChange?.(payload.status);
          break;
        case 'ERROR':
          console.error('Realtime Worker Error:', payload);
          break;
      }
    };

    // Send init config
    workerRef.current.postMessage({
      type: 'INIT',
      payload: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const subscribe = useCallback((boardId: string, callbacks: WorkerCallbacks) => {
    callbacksRef.current = callbacks;
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SUBSCRIBE',
        payload: { boardId },
      });
    }
  }, []);

  const unsubscribe = useCallback(() => {
    if (workerRef.current) {
        workerRef.current.postMessage({ type: 'UNSUBSCRIBE' });
    }
    callbacksRef.current = {};
  }, []);

  const broadcastCursor = useCallback((userId: string, position: { x: number; y: number }) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'BROADCAST_CURSOR',
        payload: { userId, position },
      });
    }
  }, []);

  return {
    subscribe,
    unsubscribe,
    broadcastCursor,
  };
}
