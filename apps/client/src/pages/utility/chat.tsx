import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import ThemeToggle from "@/components/feature/theme-toggle";
import MessageBox from "@/components/_old/message-box";
import { IApiResponse } from "@/utils/types";

type Message = {
  id: string;
  chatId: string;
  role: string;
  content: string;
  createdAt: string;
  createdById?: string | null;
  senderName?: string | null;
  avatarUrl?: string | null;
};

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { employee } = useAuth();
  const { id: routeId } = useParams<{ id?: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  
  const { get } = useApi<IApiResponse<Message[]>>();
  
  const refreshMessages = () => setRefreshToggle(prev => !prev);
  
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      
      const response = await get(`/chat/${selectedChatId}/messages`, {
        sort: "createdAt",
        order: "desc",
        page: 1,
        limit: 30,
      });

      if (response?.success) {
        setMessages(response.data || []);
      } else {
        setMessagesError(response?.error || "Failed to load messages");
      }
      
      setMessagesLoading(false);
    };

    fetchMessages();
  }, [selectedChatId, refreshToggle]);

  const orderedMessages = useMemo(() => {
    const base = (messages ?? []).slice().reverse();
    return [...base, ...liveMessages];
  }, [messages, liveMessages]);

  const initials =
    ((employee?.firstName?.[0] ?? "") + (employee?.lastName?.[0] ?? "")).toUpperCase() || "??";

  const handleSend = async (payload: { text: string; files: File[]; audio?: Blob }) => {
    const chatId = selectedChatId;
    if (!chatId) return;

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("message:send", { chatId, text: payload.text }, (ack?: { ok?: boolean }) => {
        if (!ack?.ok) {
          console.warn("message:send not acknowledged");
        }
      });
    } else {
      console.warn("Socket not connected; queued send/log only", payload);
    }
  };

  // Set chat id from route
  useEffect(() => {
    setSelectedChatId(routeId ?? null);
  }, [routeId]);

  // Scroll to bottom on chat change / initial load
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [selectedChatId, messagesLoading]);

  // Smooth scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [orderedMessages]);

  // Socket setup
  useEffect(() => {
    if (socketRef.current) return;

    const socket = io("http://localhost:8080/chat", {
      withCredentials: true,
      transports: ["websocket"],
      query: { employeeId: employee?.id ?? "" },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      if (selectedChatId) {
        socket.emit("room:join", { chatId: selectedChatId });
      }
    });

    socket.on("disconnect", () => setIsSocketConnected(false));
    socket.on("connect_error", (err) => console.error("socket connect_error", err));
    socket.on("error", (err) => console.error("socket error", err));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
    };
  }, [employee?.id, selectedChatId]);

  // Join/leave room on chat change
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (selectedChatId) {
      socket.emit("room:join", { chatId: selectedChatId });
    }
    return () => {
      if (selectedChatId) {
        socket.emit("room:leave", { chatId: selectedChatId });
      }
    };
  }, [selectedChatId]);

  // Handle live messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onMessageNew = (msg: Message) => {
      if (msg.chatId === selectedChatId) {
        setLiveMessages((prev) => [...prev, msg]);
        refreshMessages();
      }
    };

    socket.on("message:new", onMessageNew);
    return () => {
      socket.off("message:new", onMessageNew);
    };
  }, [selectedChatId, refreshMessages]);

  return (
    <div className="min-h-[100dvh] bg-background text-text flex">
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-20 h-14 bg-background/80 backdrop-blur border-b">
          <div className="h-full px-2 flex items-center gap-2">
            <div className="flex-1 font-semibold tracking-tight">Chat</div>

            <div className="flex items-center gap-3 pl-2">
              <ThemeToggle />
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium">
                  {employee?.firstName} {employee?.lastName?.[0] || ""}
                </span>
                <span className="text-xs text-text-muted">{employee?.jobTitle}</span>
              </div>
              {employee?.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={`${employee?.firstName ?? ""} ${employee?.lastName ?? ""}`}
                  className="h-9 w-9 rounded border object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded grid place-items-center border text-sm font-medium">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        {selectedChatId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4" id="messages-container">
              <div className="mx-auto max-w-5xl">
                <div className="mb-2 text-xs text-text-muted text-center">
                  Chat ID: {selectedChatId} • Socket: {isSocketConnected ? "connected" : "disconnected"}
                </div>

                {messagesLoading && <div className="px-3 py-2 text-text-muted">Loading messages…</div>}
                {!messagesLoading && messagesError && (
                  <div className="px-3 py-2 text-red-600">Error: {messagesError}</div>
                )}
                {!messagesLoading && !messagesError && orderedMessages.length === 0 && (
                  <div className="px-3 py-2 text-text-muted">No messages yet.</div>
                )}

                {!messagesLoading &&
                  !messagesError &&
                  orderedMessages.map((m) => {
                    const isSelf = m.role === "user";
                    const bubbleSide = isSelf ? "chat-end" : "chat-start";
                    const initials = isSelf
                      ? `${employee?.firstName?.[0] ?? ""}${employee?.lastName?.[0] ?? ""}`
                      : "AI";

                    return (
                      <div key={m.id} className={`chat ${bubbleSide}`}>
                        <div className="chat-image text-center flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full border bg-background grid place-items-center">
                            <span className="text-xs font-semibold">{initials}</span>
                          </div>
                        </div>

                        <div className="chat-header flex items-center gap-2">
                          {isSelf ? "You" : "Assistant"}
                          <time className="text-xs opacity-50">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>

                        <div
                          className={`chat-bubble text-sm text-text ${
                            isSelf ? "bg-surface" : "bg-foreground"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Composer pinned at bottom when a chat is selected */}
            <div className="sticky bottom-0 border-t bg-foreground p-4">
              <div className="mx-auto max-w-5xl">
                <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" />
              </div>
            </div>
          </>
        ) : (
          // No chat selected: show MessageBox centered
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="w-full max-w-3xl">
              <div className="mb-6 text-center text-text-muted text-sm">
                Start a new conversation
              </div>
              <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
