import { useAuth } from "../contexts/auth.context";
import api from "../utils/axios";
import { ReactNode, useEffect, useState } from "react";

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

type LayoutProps = {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
  onNewChat?: () => void;
};

export default function Layout({
  children,
  defaultSidebarOpen = false,
  onNewChat,
}: LayoutProps) {
  const [open, setOpen] = useState(defaultSidebarOpen);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { employee } = useAuth()
  
useEffect(() => {
  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Chat[]; meta: any }>("/chat");
      setChats(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load chats");
      setChats([]);
    } finally {
      setLoading(false);
    }
  };
  fetchChats();
}, []);

  const createChat = async () => {
    setError(null);
    try {
      await api.post("/chat", {
        employee: {
          connect: { id: employee.id }
        }
      });
      const updatedChats = await api.get<Chat[]>("/chat");
      setChats(updatedChats);
    } catch (err: any) {
      setError(err?.message || "Failed to create chat");
    }
  };

  const initials = `${employee?.firstName[0]}${employee?.lastName[0]}`

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
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <span className="font-medium">Chats</span>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={onNewChat ?? createChat}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            New Chat
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
            {!loading && !error && Array.isArray(chats) &&
              chats.map((c) => (
                <a
                  key={c.id}
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100"
                >
                  <span className="truncate">{c.name}</span>
                </a>
              ))
            }
          </nav>
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-6 h-6"
              >
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
                  alt={employee.name}
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
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
