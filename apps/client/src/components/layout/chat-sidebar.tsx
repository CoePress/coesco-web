import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { EllipsisIcon } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import api from "@/utils/axios";
import Button from "../ui/button";

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

const trimmer = (path: string) => path.replace(/\/$/, "");

export default function ChatSidebar() {
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams<{ id?: string }>();
  
  const { get } = useApi<IApiResponse<Chat[]>>();
  
  const refresh = () => setRefreshToggle(prev => !prev);
  
  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      setError(null);
      
      const response = await get("/chat", {
        sort: "createdAt",
        order: "desc",
        limit: 100,
      });

      if (response?.success) {
        setChats(response.data || []);
      } else {
        setError(response?.error || "Failed to load chats");
      }
      
      setLoading(false);
    };

    fetchChats();
  }, [refreshToggle, get]);

  const isActive = (id: string) =>
    trimmer(location.pathname) === trimmer(`/chat/${id}`);

  const handleSelectChat = (id: string) => navigate(`/chat/${id}`);

  const handleDeleteChat = async (chatId: string) => {
    try {
      if (!chatId) throw new Error("Missing chat id");
      await api.delete<{ success: boolean; data?: Chat }>(`/chat/${chatId}`);
      if (routeId === chatId) navigate("/chat");
    } catch (e) {
      console.error((e as any)?.message || "Failed to delete chat");
    } finally {
      refresh();
    }
  };

  const startEditing = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingName(chat.name);
    setMenuOpenFor(null);
    setTimeout(() => editInputRef.current?.select(), 0);
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

  useEffect(() => {
    if (!menuOpenFor) return;
    const onDocClick = () => setMenuOpenFor(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpenFor]);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2">
        <Button
          onClick={() => navigate("/chat")}
          variant="secondary-outline"
          className="w-full"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          <span className="font-medium text-sm">New Chat</span>
        </Button>
        <Button
          onClick={() => navigate("/chat/resources")}
          variant="secondary-outline"
          className="w-full"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          <span className="font-medium text-sm">Resources</span>
        </Button>

        <div>
          <label htmlFor="chat-search" className="sr-only">
            Search chats
          </label>
          <input
            id="chat-search"
            type="text"
            placeholder="Search chats..."
            className="w-full rounded border border-border bg-background
                       px-3 py-2 text-sm text-text
                       focus:outline-none focus:ring-0 focus:border-primary"
          />
        </div>

        <nav className="space-y-1 text-sm">
          {loading && (
            <div className="px-4 py-2 text-text-muted">Loading…</div>
          )}
          {!loading && error && (
            <div className="px-4 py-2 text-red-600">Error: {error}</div>
          )}
          {!loading &&
            !error &&
            (chats ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectChat(c.id)}
                className={`relative flex w-full items-center justify-between
                            px-4 py-2 rounded cursor-pointer
                            ${isActive(c.id)
                              ? "bg-background text-primary"
                              : "text-text-muted hover:bg-surface"
                            }`}
                aria-current={isActive(c.id) ? "page" : undefined}
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
                  <span className="truncate pr-8 font-medium text-sm">{c.name}</span>
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
                  className="absolute right-2 inline-flex items-center justify-center rounded p-1
                             text-text-muted hover:text-text"
                >
                  <EllipsisIcon size={16} />
                </button>

                {menuOpenFor === c.id && (
                  <div
                    role="menu"
                    aria-label="Chat actions"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-9 z-50 w-36 overflow-hidden rounded-md
                               bg-background shadow-lg border border-border"
                  >
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => startEditing(c)}
                      className="w-full px-3 py-2 text-left text-sm
                                 hover:bg-surface text-text"
                    >
                      Rename
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => handleDeleteChat(c.id)}
                      className="w-full px-3 py-2 text-left text-sm
                                 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </button>
            ))}
        </nav>
      </div>
    </div>
  );
}
