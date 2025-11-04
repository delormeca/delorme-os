/**
 * WebSocket hook for real-time research progress updates
 */

import { useEffect, useRef, useState } from "react";

export interface ProgressMessage {
  type: string; // "progress", "log", "error", "complete"
  content?: string;
  progress?: number;
  step?: string;
  cost?: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8020";

export const useResearchWebSocket = (researchId: string | null) => {
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!researchId) {
      return;
    }

    // Create WebSocket connection
    const wsUrl = `${WS_URL}/ws/research/${researchId}`;
    console.log("Connecting to WebSocket:", wsUrl);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    };

    ws.current.onmessage = (event) => {
      try {
        const data: ProgressMessage = JSON.parse(event.data);
        console.log("WebSocket message:", data);

        setMessages((prev) => [...prev, data]);

        if (data.progress !== undefined) {
          setProgress(data.progress);
        }

        if (data.type === "error") {
          setError(data.content || "Unknown error");
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.current.onerror = (event) => {
      console.error("WebSocket error:", event);
      setIsConnected(false);
      setError("WebSocket connection error");
    };

    ws.current.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [researchId]);

  return {
    messages,
    progress,
    isConnected,
    error,
  };
};
