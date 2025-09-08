import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { EllipsisIcon, Plus, FileText, MessageCircle } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import Loader from "../ui/loader";

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

type ChatSidebarProps = {
  isOpen: boolean;
  onTooltipMouseEnter?: (e: React.MouseEvent, text: string) => void;
  onTooltipMouseLeave?: () => void;
};

export default function ChatSidebar({ isOpen, onTooltipMouseEnter, onTooltipMouseLeave }: ChatSidebarProps) {
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
  
  const { get, delete: deleteChat, patch: patchChat } = useApi<IApiResponse<Chat[]>>();
  
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
  }, [refreshToggle]);

  const isActive = (id: string) =>
    trimmer(location.pathname) === trimmer(`/chat/${id}`);

  const handleSelectChat = (id: string) => navigate(`/chat/${id}`);

  const handleDeleteChat = async (chatId: string) => {
    try {
      if (!chatId) throw new Error("Missing chat id");
      await deleteChat(`/chat/${chatId}`);
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
      await patchChat(`/chat/${editingChatId}`, {
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
        <button
          onClick={() => navigate("/chat")}
          onMouseEnter={(e) => onTooltipMouseEnter?.(e, "New Chat")}
          onMouseLeave={onTooltipMouseLeave}
          className="flex items-center gap-3 p-2 rounded transition-all duration-300 text-text-muted hover:bg-surface w-full cursor-pointer"
        >
          <Plus size={18} className="flex-shrink-0" />
          <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}>New Chat</span>
        </button>
        <button
          onClick={() => navigate("/chat/resources")}
          onMouseEnter={(e) => onTooltipMouseEnter?.(e, "Resources")}
          onMouseLeave={onTooltipMouseLeave}
          className="flex items-center gap-3 p-2 rounded transition-all duration-300 text-text-muted hover:bg-surface w-full cursor-pointer"
        >
          <FileText size={18} className="flex-shrink-0" />
          <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}>Resources</span>
        </button>
        <button
          onClick={() => navigate("/chat")}
          onMouseEnter={(e) => onTooltipMouseEnter?.(e, "Chats")}
          onMouseLeave={onTooltipMouseLeave}
          className="flex items-center gap-3 p-2 rounded transition-all duration-300 text-text-muted hover:bg-surface w-full cursor-pointer"
        >
          <MessageCircle size={18} className="flex-shrink-0" />
          <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}>Chats</span>
        </button>

        {isOpen && (
          <nav className="space-y-1 text-sm">
          <h2 className="text-text-muted text-xs">Recent</h2>
          {loading && (
            <div className="px-4 py-2 flex items-center justify-center">
              <Loader size="sm" />
            </div>
          )}
          {!loading && error && (
            <div className="px-4 py-2 text-red-600">Error: {error}</div>
          )}
          {!loading && !error && chats.length === 0 && (
            <div className="px-4 py-2 text-text-muted text-center text-nowrap">
              No recent chats
            </div>
          )}
          {!loading &&
            !error &&
            chats.length > 0 &&
            chats.map((c) => (
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
        )}
      </div>
    </div>
  );
}
