import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/auth.context";
import { useGetEntities } from "../hooks/use-get-entities";
import api from "../utils/axios";
import { MessageBox } from "../components";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { EllipsisIcon } from "lucide-react";

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
  role: string;
  content: string;
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
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // <-- for scroll

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

  const orderedMessages = useMemo(() => {
    const base = (messages ?? []).slice().reverse();
    return [...base, ...liveMessages];
  }, [messages, liveMessages]);

  // Jump to bottom instantly on initial load or when switching chats
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [selectedChatId, messagesLoading]);

  // Smooth scroll only when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [orderedMessages]);

  // Set selected chat from route
  useEffect(() => {
    setSelectedChatId(routeId ?? null);
  }, [routeId]);

  // Auto nav to newest chat if pending
  useEffect(() => {
    if (pendingNavToLatest && chats && chats.length > 0) {
      navigate(`/chat/${chats[0].id}`);
      setPendingNavToLatest(false);
    }
  }, [pendingNavToLatest, chats, navigate]);

  // Click outside menu to close
  useEffect(() => {
    if (!menuOpenFor) return;
    const onDocClick = () => setMenuOpenFor(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpenFor]);

  const initials =
    ((employee?.firstName?.[0] ?? "") + (employee?.lastName?.[0] ?? "")).toUpperCase() || "??";

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

  // Initialize socket once
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

  // Join/leave room when selectedChatId changes
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

  // Listen for new messages
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

  const startEditing = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingName(chat.name);
    setMenuOpenFor(null);
    setTimeout(() => {
      editInputRef.current?.select();
    }, 0);
  };

  const saveEditing = async () => {
    if (!editingChatId) return;
    try {
      await api.patch<{ success: boolean; data?: Chat }>(`/chat/${editingChatId}`, {
        name: editingName.trim(),
      });
    } catch (e) {
      console.error((e as any)?.message || "Failed to rename chat");
    } finally {
      setEditingChatId(null);
      setEditingName("");
      refresh();
    }
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingName("");
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 flex">
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
            {loading && <div className="px-3 py-2 text-text-muted">Loading…</div>}
            {!loading && error && <div className="px-3 py-2 text-red-600">Error: {error}</div>}
            {!loading &&
              !error &&
              (chats ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectChat(c.id)}
                  className={`relative flex w-full text-left items-center justify-between px-3 py-2 rounded-md hover:bg-slate-100 cursor-pointer ${
                    selectedChatId === c.id ? "bg-slate-100" : ""
                  }`}
                  aria-current={selectedChatId === c.id ? "page" : undefined}
                >
                  {editingChatId === c.id ? (
                    <input
                      ref={editInputRef}
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing();
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="flex-1 border-none bg-transparent text-sm focus:outline-none"
                    />
                  ) : (
                    <span className="truncate pr-8">{c.name}</span>
                  )}

                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpenFor === c.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpenFor((open) => (open === c.id ? null : c.id));
                    }}
                    className="absolute right-2 inline-flex items-center justify-center rounded-md p-1 hover:bg-slate-200"
                  >
                    <EllipsisIcon size={16} className="text-slate-600" />
                  </button>

                  {menuOpenFor === c.id && (
                    <div
                      role="menu"
                      aria-label="Chat actions"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-9 z-50 w-36 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
                    >
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => startEditing(c)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        Rename
                      </button>
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => handleDeleteChat(c.id)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </button>
              ))}
          </nav>

          <div className="px-3 py-2 text-xs text-text-muted">
            Socket: {isSocketConnected ? "connected" : "disconnected"}
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col ${open ? "lg:pl-72" : "lg:pl-0"}`}>
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
                <span className="text-xs text-text-muted">{employee?.jobTitle}</span>
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

        <div className="flex-1 overflow-y-auto p-4" id="messages-container">
          <div className="mx-auto max-w-5xl">
            {selectedChatId ? (
              <>
                <div className="mb-2 text-xs text-text-muted text-center">Chat ID: {selectedChatId}</div>
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

                      const initials = isSelf ? `${employee?.firstName[0]}${employee?.lastName[0]}` : "AI";

                      return (
                        <div key={m.id} className={`chat ${bubbleSide}`}>
                          <div className="chat-image text-center flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full ring-1 ring-slate-200 bg-white grid place-items-center">
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

                          <div className="chat-bubble text-sm">{m.content}</div>
                        </div>
                      );
                    })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="mb-2 text-xs text-text-muted">No chat selected</div>
            )}
          </div>
        </div>

        {selectedChatId && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
            <div className="mx-auto max-w-5xl">
              <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
