import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, MessageCircleIcon, PlusIcon, MoreVerticalIcon } from "lucide-react";
import { PageHeader, Button } from "@/components";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import Loader from "@/components/ui/loader";

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


const RecentChats = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const navigate = useNavigate();
  
  const { get, delete: deleteChat } = useApi<IApiResponse<Chat[]>>();
  
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

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const chatTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - chatTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      if (!chatId) throw new Error("Missing chat id");
      await deleteChat(`/chat/${chatId}`);
      refresh();
    } catch (e) {
      console.error((e as any)?.message || "Failed to delete chat");
    }
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Recent Chats"
        description="Continue your conversations"
        actions={
          <Button onClick={() => {navigate("/chat")}}>
            <PlusIcon size={16} />
            New Chat
          </Button>
        }
      />

      <div className="w-full flex flex-1 flex-col items-center">
        <div className="w-full max-w-screen-md flex flex-col flex-1">
          <div className="my-2">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-foreground border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader size="lg" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <MessageCircleIcon size={32} className="text-red-500 mb-2" />
                <p className="text-sm text-red-500">Error: {error}</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <MessageCircleIcon size={32} className="text-text-muted mb-2" />
                <p className="text-sm text-text-muted">No chats found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-2 hover:bg-surface cursor-pointer group relative"
                    onClick={() => navigate(`/chat/c/${chat.id}`)}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-sm text-text-muted truncate">
                        {chat.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatTimeAgo(chat.createdAt)}
                      </span>
                    </div>
                    <div className="relative flex-shrink-0 ml-4">
                      <button
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-surface-hover rounded transition-opacity cursor-pointer flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === chat.id ? null : chat.id);
                        }}
                      >
                        <MoreVerticalIcon size={16} className="text-text-muted" />
                      </button>
                      {activeDropdown === chat.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-0 top-8 z-20 bg-background border border-border shadow-lg rounded-md py-1 min-w-32">
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Rename chat:', chat.id);
                                setActiveDropdown(null);
                              }}
                            >
                              Rename
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Star chat:', chat.id);
                                setActiveDropdown(null);
                              }}
                            >
                              Star
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Share chat:', chat.id);
                                setActiveDropdown(null);
                              }}
                            >
                              Share
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-surface cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
                                setActiveDropdown(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentChats;