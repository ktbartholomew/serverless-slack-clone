import { createContext, useContext, useEffect, useState } from "react";

export const RealtimeContext = createContext<{
  socket: WebSocket | null;
  readyState: number;
}>({ socket: null, readyState: -1 });

export function useSocket(userId: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<WebSocket["readyState"]>(0);
  const [reconnect, setReconnect] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    const s = new WebSocket(
      `wss://ziy84sz7yl.execute-api.us-west-2.amazonaws.com/production/?authorization=${userId}`
    );

    const presenceInterval = setInterval(() => {
      if (s.readyState === WebSocket.OPEN) {
        s.send(
          JSON.stringify({ event: "updatePresence", detail: { user: userId } })
        );
      }
    }, 60000);

    s.onopen = () => {
      setReadyState(s.readyState);
    };

    s.onclose = () => {
      setReadyState(s.readyState);
      setReconnect(Date.now());
    };

    s.onmessage = (e) => {
      setReadyState(s.readyState);
    };

    setSocket(s);

    return () => {
      clearInterval(presenceInterval);
      socket?.close();
    };
  }, [userId, reconnect]);

  return { socket, readyState };
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
