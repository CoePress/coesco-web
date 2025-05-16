import { useState, useRef, useEffect } from "react";
import { Send, User, MessageSquare, X } from "lucide-react";
import { Button, PageHeader } from "@/components";

type Message =
  | {
      id: number;
      role: "user" | "assistant";
      content: string;
      type?: "text";
    }
  | {
      id: number;
      role: "assistant";
      type: "artifact";
      artifact: {
        title: string;
        summary: string;
        content: string; // Full report
      };
    };

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! How can I help you today?",
    type: "text",
  },
  // Example artifact message
  {
    id: 2,
    role: "assistant",
    type: "artifact",
    artifact: {
      title: "Production Report",
      summary: "Summary of today's production metrics.",
      content: `# Production Report\n\n- Output: 452 units\n- Efficiency: 90.4%\n- Quality: 99.1%\n\nSee attached for details.`,
    },
  },
];

const ChatPLK = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState<null | {
    title: string;
    content: string;
  }>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, artifactOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input,
      type: "text",
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate assistant response with artifact
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now() + 1,
          role: "assistant",
          type: "artifact",
          artifact: {
            title: "Sample Report",
            summary: "This is a sample artifact generated in response.",
            content: `# Sample Report\n\n- Item 1: Value\n- Item 2: Value\n\nYou can customize this content.`,
          },
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full">
      <PageHeader
        title="Chat Assistant"
        description="Ask anything – powered by Paul"
        actions={[
          {
            type: "button",
            label: "New Chat",
            variant: "secondary-outline",
            icon: <MessageSquare size={16} />,
            onClick: () => {},
          },
        ]}
      />

      <div className="flex flex-1 min-h-0 bg-background relative">
        <div
          className={`
            flex flex-col h-full transition-all duration-300 w-full
            ${artifactOpen ? "" : "mx-auto"}
          `}>
          <div className="flex-1 overflow-y-auto p-2 ">
            <div className="flex flex-col gap-3 max-w-screen-md mx-auto">
              {messages.map((msg) =>
                msg.type === "artifact" ? (
                  <div
                    key={msg.id}
                    className="flex justify-start">
                    <div className="rounded-lg border shadow-sm px-4 py-3 max-w-[80%] bg-surface text-text-muted mr-12">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-primary">
                          <MessageSquare size={16} />
                        </span>
                        <span className="text-xs font-medium capitalize">
                          assistant
                        </span>
                      </div>
                      <div className="text-sm font-semibold mb-1">
                        {msg.artifact.title}
                      </div>
                      <div className="text-sm mb-2">{msg.artifact.summary}</div>
                      <Button
                        size="sm"
                        variant="secondary-outline"
                        onClick={() =>
                          setArtifactOpen({
                            title: msg.artifact.title,
                            content: msg.artifact.content,
                          })
                        }>
                        View Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}>
                    <div
                      className={`rounded-lg border shadow-sm px-4 py-3 max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-primary text-foreground ml-12"
                          : "bg-surface text-text-muted mr-12"
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.role === "assistant" ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-primary">
                            <MessageSquare size={16} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-foreground">
                            <User size={16} />
                          </span>
                        )}
                        <span className="text-xs font-medium capitalize">
                          {msg.role}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-line">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg border shadow-sm px-4 py-3 max-w-[80%] bg-surface text-text-muted mr-12 animate-pulse">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 text-primary">
                        <MessageSquare size={16} />
                      </span>
                      <span className="text-xs font-medium capitalize">
                        assistant
                      </span>
                    </div>
                    <div className="text-sm">...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="bg-foreground border-t p-4 ">
            <div className="relative max-w-screen-md mx-auto flex justify-center items-center">
              <textarea
                className="w-full border rounded-lg p-3 pr-12 text-sm resize-none text-text"
                rows={2}
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={loading}
              />
              <div className="absolute right-3 h-full flex items-center justify-center">
                <Button
                  onClick={handleSend}
                  variant="primary"
                  disabled={loading || !input.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        {artifactOpen && (
          <div className="flex flex-col h-full bg-foreground border-l shadow-lg z-10 transition-all duration-300 w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{artifactOpen.title}</h2>
              <button
                onClick={() => setArtifactOpen(null)}
                className="p-2 rounded hover:bg-surface"
                aria-label="Close artifact"
                title="Close">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none whitespace-pre-line">
                {artifactOpen.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPLK;
