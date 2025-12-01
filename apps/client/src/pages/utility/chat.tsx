import type { Socket } from "socket.io-client";

import { CircleAlertIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

import type { IApiResponse } from "@/utils/types";

import MessageBox from "@/components/feature/message-box";
import PageHeader from "@/components/layout/page-header";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/contexts/auth.context";
import { useApi } from "@/hooks/use-api";

interface Message {
  id: string;
  chatId: string;
  role: string;
  content: string;
  createdAt: string;
  createdById?: string | null;
  senderName?: string | null;
  avatarUrl?: string | null;
}

export default function ChatPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(routeId ?? null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { employee } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(!!routeId);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const { get } = useApi<IApiResponse<Message[]>>();

  const fetchMessages = async (showLoading = true) => {
    if (!selectedChatId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    if (showLoading) {
      setMessagesLoading(true);
    }
    setMessagesError(null);

    const response = await get(`/chat/${selectedChatId}/messages`, {
      page: 1,
      limit: 25,
    });

    if (response?.success) {
      setMessages(response.data || []);
    }
    else {
      setMessagesError(response?.error || "Failed to load messages");
    }

    setMessagesLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedChatId]);

  const displayMessages = useMemo(() => {
    return (messages ?? []).slice().reverse();
  }, [messages]);

  const handleSend = async (payload: { message: string; files: File[]; audio?: Blob }) => {
    const chatId = selectedChatId;

    const socket = socketRef.current;
    if (socket && socket.connected) {
      setIsSending(true);
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: chatId || "",
        role: "user",
        content: payload.message,
        createdAt: new Date().toISOString(),
        createdById: employee.id,
      };

      setMessages(prev => [tempUserMessage, ...prev]);

      socket.emit("message:user", { employeeId: employee.id, chatId, message: payload.message }, (ack?: { ok?: boolean; chatId?: string }) => {
        if (ack?.ok) {
          if (ack.chatId && ack.chatId !== selectedChatId) {
            setSelectedChatId(ack.chatId);
          }
          else {
            fetchMessages(false);
          }
        }
        else {
          console.warn("message:user not acknowledged");
          setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        }
        setIsSending(false);
      });
    }
    else {
      console.warn("Socket not connected; queued send/log only", payload);
    }
  };

  useEffect(() => {
    setSelectedChatId(routeId ?? null);
  }, [routeId]);

  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [selectedChatId, messagesLoading]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayMessages]);

  useEffect(() => {
    if (socketRef.current)
      return;

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
    socket.on("connect_error", err => console.error("socket connect_error", err));
    socket.on("error", err => console.error("socket error", err));

    socket.on("chat:url-update", ({ chatId }) => {
      window.history.pushState(null, "", `/chat/c/${chatId}`);
      setSelectedChatId(chatId);
      window.dispatchEvent(new CustomEvent("chat:created", { detail: { chatId } }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
    };
  }, [employee?.id, selectedChatId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket)
      return;
    if (selectedChatId) {
      socket.emit("room:join", { chatId: selectedChatId });
    }
    return () => {
      if (selectedChatId) {
        socket.emit("room:leave", { chatId: selectedChatId });
      }
    };
  }, [selectedChatId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket)
      return;

    const onSystemMessage = (content: string) => {
      const tempSystemMessage: Message = {
        id: `temp-system-${Date.now()}`,
        chatId: selectedChatId || "",
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [tempSystemMessage, ...prev]);

      setTimeout(() => {
        fetchMessages(false);
      }, 100);
    };

    socket.on("message:system", onSystemMessage);
    return () => {
      socket.off("message:system", onSystemMessage);
    };
  }, [selectedChatId]);

  return (
    <div className="min-h-[100dvh] bg-background text-text flex">
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="Chat"
          description={selectedChatId ? `Chat ID: ${selectedChatId}` : "Start a new conversation"}
          actions={(
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium">
                  {employee?.firstName}
                  {" "}
                  {employee?.lastName?.[0] || ""}
                </span>
                <span className="text-xs text-text-muted">{employee?.jobTitle}</span>
              </div>
              {employee?.avatarUrl
                ? (
                    <img
                      src={employee.avatarUrl}
                      alt={`${employee?.firstName ?? ""} ${employee?.lastName ?? ""}`}
                      className="h-9 w-9 rounded border object-cover"
                    />
                  )
                : (
                    <div className="h-9 w-9 rounded grid place-items-center border text-sm font-medium">
                      {employee.initials}
                    </div>
                  )}
            </div>
          )}
        />

        {selectedChatId
          ? (
              messagesLoading
                ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader />
                    </div>
                  )
                : messagesError || displayMessages.length === 0
                  ? (
                      <div className="flex-1 p-2 flex items-center justify-center">
                        <div className="bg-error/10 border border-error/20 text-error text-sm p-2 rounded flex items-start">
                          <div>
                            <p className="font-semibold flex gap justify-center">
                              <CircleAlertIcon className="mr-2" size={18} />
                              Chat not found
                            </p>
                            <p className="text-center">The chat you're looking for doesn't exist or has been deleted.</p>
                          </div>
                        </div>
                      </div>
                    )
                  : (
                      <>
                        <div className="flex-1 overflow-y-auto p-4" id="messages-container">
                          <div className="mx-auto max-w-5xl">
                            <div className="mb-2 text-xs text-text-muted text-center">
                              Socket:
                              {" "}
                              {isSocketConnected ? "connected" : "disconnected"}
                            </div>

                            {displayMessages.map((m) => {
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

                        <div className="sticky bottom-2">
                          <div className="mx-auto max-w-5xl">
                            <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" disabled={isSending} />
                          </div>
                        </div>
                      </>
                    )
            )
          : (
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="w-full max-w-3xl">
                  <div className="mb-6 text-center text-text-muted text-sm">
                    Start a new conversation
                  </div>
                  <MessageBox onSend={handleSend} accept="image/*,.pdf,.txt,.md,.json" disabled={isSending} />
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
