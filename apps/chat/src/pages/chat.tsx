// src/pages/chat.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/auth.context";
import { useGetEntities } from "../hooks/use-get-entities";
import api from "../utils/axios";
import { MessageBox } from "../components";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

type Chat = {
  id: string;
  employeeId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string;
  updatedById: string;
};

type Message = {
  id: string;
  chatId: string;
  text: string;
  createdAt: string;
  createdById?: string | null;
  senderName?: string | null;
  avatarUrl?: string | null;
};

export default function ChatPage() {
  const [open, setOpen] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [pendingNavToLatest, setPendingNavToLatest] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const { employee } = useAuth();
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();

  const {
    entities: chats,
    loading,
    error,
    refresh,
  } = useGetEntities<Chat>("/chat", {
    sort: "createdAt",
    order: "desc",
    limit: 100,
  });

  // Messages: only call endpoint if we have a selected chat id
  const messagesEndpoint = selectedChatId ? `/chat/${selectedChatId}/messages` : null;
  const {
    entities: messages,
    loading: messagesLoading,
    error: messagesError,
    refresh: refreshMessages,
  } = useGetEntities<Message>(messagesEndpoint, {
    sort: "createdAt",
    order: "desc",
    page: 1,
    limit: 30,
  });

  // render messages oldest->newest
  const orderedMessages = useMemo(
    () => (messages ?? []).slice().reverse(),
    [messages]
  );

  useEffect(() => {
    setSelectedChatId(routeId ?? null);
  }, [routeId]);

  useEffect(() => {
    if (pendingNavToLatest && chats && chats.length > 0) {
      navigate(`/chat/${chats[0].id}`);
      setPendingNavToLatest(false);
    }
  }, [pendingNavToLatest, chats, navigate]);

  const initials =
    ((employee?.firstName?.[0] ?? "") + (employee?.lastName?.[0] ?? "")).toUpperCase() || "??";

  const handleCreateChat = async () => {
    navigate("/chat");
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      if (!chatId) throw new Error("Missing chat id");
      await api.delete<{ success: boolean; data?: Chat }>(`/chat/${chatId}`);
      if (routeId === chatId) {
        navigate("/chat");
      }
    } catch (e) {
      console.error((e as any)?.message || "Failed to delete chat");
    } finally {
      refresh();
    }
  };

  const handleSend = async (payload: { text: string; files: File[]; audio?: Blob }) => {
    const chatId = selectedChatId;
    if (!chatId) return;

    // If socket is connected, emit over socket; otherwise just log or fall back to HTTP later.
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("message:send", { chatId, text: payload.text }, (ack?: { ok?: boolean }) => {
        // Optionally refresh messages or rely on "message:new" push below
        if (!ack?.ok) {
          console.warn("message:send not acknowledged");
        }
      });
    } else {
      console.warn("Socket not connected; queued send/log only", payload);
    }

    // TODO: upload payload.files and payload.audio if needed
    console.log("send", { chatId, ...payload });
  };

  //
  // ---- SOCKET.IO: ensure connected while on this page ----
  //
  useEffect(() => {
    // Avoid duplicate connections
    if (socketRef.current) return;

    // Connect to namespace /chat
    const socket = io("http://localhost:8080/chat", {
      // If you have auth tokens/cookies, include them here
      // Example: auth: { token }, or withCredentials: true
      withCredentials: true,
      transports: ["websocket"], // prefer WS; Socket.IO will fallback if needed
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      query: {
        // Pass lightweight identity for server-side presence if helpful
        employeeId: employee?.id ?? "",
      },
    });

    socketRef.current = socket;

    const onConnect = () => {
      setIsSocketConnected(true);
      // Optionally re-join current room after reconnect
      if (selectedChatId) {
        socket.emit("room:join", { chatId: selectedChatId });
      }
      // You could also notify presence here if your server supports it
    };

    const onDisconnect = () => setIsSocketConnected(false);
    const onConnectError = (err: any) => console.error("socket connect_error", err);
    const onError = (err: any) => console.error("socket error", err);

    // Push message from server
    const onMessageNew = (msg: Message) => {
      // If message is for this chat, refresh or optimistically append.
      if (msg.chatId === selectedChatId) {
        // simplest: refetch page (KISS). Swap for local prepend/append later.
        refreshMessages();
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("error", onError);
    socket.on("message:new", onMessageNew);

    return () => {
      // Cleanup: leave any room and disconnect
      try {
        if (selectedChatId) {
          socket.emit("room:leave", { chatId: selectedChatId });
        }
      } finally {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("error", onError);
        socket.off("message:new", onMessageNew);
        socket.disconnect();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
    };
    // Intentionally exclude selectedChatId from deps here; room changes are handled below
    // We only want to create/destroy the connection when the page mounts/unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join/leave room whenever the selected chat changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Leave previous and join new room.
    // We don’t track previous id explicitly; server can handle idempotent join/leave,
    // or you can store a ref to the last joined id for precise leave.
    if (selectedChatId) {
      socket.emit("room:join", { chatId: selectedChatId });
    }
    return () => {
      if (selectedChatId) {
        socket.emit("room:leave", { chatId: selectedChatId });
      }
    };
  }, [selectedChatId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200",
          "transition-transform duration-200 ease-in-out",
          "-translate-x-full",
          open ? "translate-x-0" : "",
        ].join(" ")}
        aria-label="Chat selection sidebar"
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b lg:hidden">
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-md hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-medium">Chats</span>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>

          <button
            type="button"
            onClick={() => navigate("/resources")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Resources
          </button>

          <div>
            <label htmlFor="chat-search" className="sr-only">
              Search chats
            </label>
            <input
              id="chat-search"
              type="text"
              placeholder="Search chats..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <nav className="space-y-1 text-sm">
            {loading && <div className="px-3 py-2 text-slate-500">Loading…</div>}
            {!loading && error && <div className="px-3 py-2 text-red-600">Error: {error}</div>}
            {!loading &&
              !error &&
              (chats ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectChat(c.id)}
                  className={`flex w-full text-left items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 cursor-pointer ${
                    selectedChatId === c.id ? "bg-slate-100" : ""
                  }`}
                  aria-current={selectedChatId === c.id ? "page" : undefined}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
          </nav>

          {/* Tiny, non-intrusive connection status (no style changes) */}
          <div className="px-3 py-2 text-xs text-slate-500">
            Socket: {isSocketConnected ? "connected" : "disconnected"}
          </div>
        </div>
      </aside>

      <div className={`min-h-screen ${open ? "lg:pl-72" : "lg:pl-0"}`}>
        <header className="sticky top-0 z-20 h-14 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="h-full px-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle sidebar"
              aria-expanded={open}
              className="p-2 rounded-md hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                <path strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <div className="flex-1 font-semibold tracking-tight">Chat</div>

            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium">
                  {employee?.firstName} {employee?.lastName?.[0] || ""}
                </span>
                <span className="text-xs text-slate-500">{employee?.jobTitle}</span>
              </div>
              {employee?.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={`${employee?.firstName ?? ""} ${employee?.lastName ?? ""}`}
                  className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full grid place-items-center border border-slate-200 text-sm font-medium">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4">
          <div className="mx-auto max-w-5xl">
            {selectedChatId ? (
              <div className="mb-2 text-xs text-slate-500">Chat ID: {selectedChatId}</div>
            ) : (
              <div className="mb-2 text-xs text-slate-500">No chat selected</div>
            )}

            {/* Messages list */}
            {selectedChatId ? (
              <>
                {messagesLoading && (
                  <div className="px-3 py-2 text-slate-500">Loading messages…</div>
                )}
                {!messagesLoading && messagesError && (
                  <div className="px-3 py-2 text-red-600">Error: {messagesError}</div>
                )}

                {!messagesLoading && !messagesError && orderedMessages.length === 0 && (
                  <div className="px-3 py-2 text-slate-500">No messages yet.</div>
                )}

                {!messagesLoading &&
                  !messagesError &&
                  orderedMessages.map((m) => {
                    const isSelf = m.createdById && employee?.id && m.createdById === employee.id;
                    const bubbleSide = isSelf ? "chat-end" : "chat-start";
                    return (
                      <div key={m.id} className={`chat ${bubbleSide}`}>
                        <div className="chat-image avatar">
                          <div className="w-10 rounded-full">
                            <img
                              alt="Avatar"
                              src={
                                isSelf
                                  ? employee?.avatarUrl ||
                                    "https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                                  : m.avatarUrl ||
                                    "https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
                              }
                            />
                          </div>
                        </div>
                        <div className="chat-header">
                          {isSelf
                            ? `${employee?.firstName ?? "You"}`
                            : m.senderName ?? "User"}
                          <time className="text-xs opacity-50">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                        <div className="chat-bubble">{m.text}</div>
                      </div>
                    );
                  })}

                <div className="mt-4">
                  <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" />
                </div>
              </>
            ) : (
              // No chat selected: demo bubbles kept (styles untouched)
              <div>
                <div className="chat chat-start">
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full">
                      <img
                        alt="Tailwind CSS chat bubble component"
                        src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                      />
                    </div>
                  </div>
                  <div className="chat-header">
                    Obi-Wan Kenobi
                    <time className="text-xs opacity-50">12:45</time>
                  </div>
                  <div className="chat-bubble">You were the Chosen One!</div>
                  <div className="chat-footer opacity-50">Delivered</div>
                </div>
                <div className="chat chat-end">
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full">
                      <img
                        alt="Tailwind CSS chat bubble component"
                        src="https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
                      />
                    </div>
                  </div>
                  <div className="chat-header">
                    Anakin
                    <time className="text-xs opacity-50">12:46</time>
                  </div>
                  <div className="chat-bubble">I hate you!</div>
                  <div className="chat-footer opacity-50">Seen at 12:46</div>
                </div>

                <div className="mt-4">
                  <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
