import {
  Calendar,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Notebook,
  Phone,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Modal from "@/components/shared/modal";

const CompanyDetails = () => {
  const [activeModal, setActiveModal] = useState<{
    type: string;
    isOpen: boolean;
  }>({ type: "", isOpen: false });

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mirrorContent, setMirrorContent] = useState("");
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [mirrorScroll, setMirrorScroll] = useState(0);
  const [mentionDropdownIndex, setMentionDropdownIndex] = useState(0);

  // Mock data for mentions
  const mentionOptions = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com" },
  ];

  const handleOpenModal = (type: string) => {
    setActiveModal({ type, isOpen: true });
  };

  const handleCloseModal = () => {
    setActiveModal({ type: "", isOpen: false });
    setNoteContent("");
    setShowMentionDropdown(false);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNoteContent(value);

    // Check for @ symbol
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    // Mirror logic
    let mirrorHtml = value
      .slice(0, lastAtIndex)
      .replace(/\n/g, "<br/>")
      .replace(/ /g, "&nbsp;");
    if (lastAtIndex !== -1) {
      mirrorHtml += '<span id="mention-marker">@</span>';
      mirrorHtml += value
        .slice(lastAtIndex + 1, cursorPosition)
        .replace(/\n/g, "<br/>")
        .replace(/ /g, "&nbsp;");
    }
    setMirrorContent(mirrorHtml);

    if (lastAtIndex !== -1) {
      const charBeforeAt =
        lastAtIndex === 0 ? "" : textBeforeCursor[lastAtIndex - 1];
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      const isInMention = searchText.includes("<") && !searchText.includes(">");
      // Only trigger if @ is at start, after space, or after line break
      const validTrigger =
        lastAtIndex === 0 || charBeforeAt === " " || charBeforeAt === "\n";
      // Hide if @ is followed by space
      const atFollowedBySpace = searchText.startsWith(" ");
      if (
        validTrigger &&
        !atFollowedBySpace &&
        !searchText.includes(" ") &&
        !isInMention
      ) {
        setMentionSearch(searchText);
        setTimeout(() => {
          const textarea = textareaRef.current;
          const marker = mirrorRef.current?.querySelector("#mention-marker");
          if (textarea && marker && mirrorRef.current) {
            const textareaRect = textarea.getBoundingClientRect();
            const markerRect = marker.getBoundingClientRect();
            const mirrorRect = mirrorRef.current.getBoundingClientRect();
            setMentionPosition({
              top: markerRect.top - mirrorRect.top - textarea.scrollTop + 24, // 24 for line height/padding
              left: markerRect.left - mirrorRect.left - textarea.scrollLeft,
            });
          }
        }, 0);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (mention: {
    id: number;
    name: string;
    email: string;
  }) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = noteContent.slice(0, cursorPosition);
    const textAfterCursor = noteContent.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    const newContent =
      textBeforeCursor.slice(0, lastAtIndex) +
      `@<${mention.id}> ` +
      textAfterCursor;

    setNoteContent(newContent);
    setShowMentionDropdown(false);

    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = lastAtIndex + mention.id.toString().length + 4; // +4 for @<> and space
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Filtered mention options
  const filteredMentionOptions = mentionOptions.filter(
    (option) =>
      option.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      option.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (!showMentionDropdown) return;
    if (filteredMentionOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionDropdownIndex(
        (prev) => (prev + 1) % filteredMentionOptions.length
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionDropdownIndex(
        (prev) =>
          (prev - 1 + filteredMentionOptions.length) %
          filteredMentionOptions.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      insertMention(filteredMentionOptions[mentionDropdownIndex]);
      setMentionDropdownIndex(0);
    }
  };

  const getModalContent = () => {
    switch (activeModal.type) {
      case "note":
        return (
          <div className="flex flex-col gap-4 relative">
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={handleNoteChange}
              className="w-full h-[300px] bg-background border border-border rounded p-3 text-text focus:outline-none focus:border-primary resize-none overflow-y-auto relative z-0"
              placeholder="Write your notes here... Use @ to mention someone"
              onScroll={() =>
                setMirrorScroll(textareaRef.current?.scrollTop || 0)
              }
              onKeyDown={handleTextareaKeyDown}
            />
            {/* Hidden mirror div for mention positioning */}
            <div
              ref={mirrorRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 300,
                color: "transparent",
                background: "transparent",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                pointerEvents: "none",
                overflow: "hidden",
                zIndex: -1,
                font: "inherit",
                padding: 12,
                borderRadius: 8,
                border: "1px solid transparent",
                visibility: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: mirrorContent + "<br />" }}
            />
            {showMentionDropdown && (
              <div
                className="absolute bg-foreground border border-border rounded shadow-lg max-h-[200px] overflow-y-auto w-64 z-10"
                style={{
                  top: mentionPosition.top,
                  left: mentionPosition.left,
                }}>
                {filteredMentionOptions.length > 0 ? (
                  filteredMentionOptions.map((option, idx) => (
                    <button
                      key={option.id}
                      onClick={() => insertMention(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-surface flex flex-col${
                        mentionDropdownIndex === idx ? " bg-surface" : ""
                      }`}>
                      <span className="text-text">{option.name}</span>
                      <span className="text-text-muted text-xs">
                        {option.email}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-text-muted text-sm">
                    No matching users found
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "email":
        return <div>Email Modal Content</div>;
      case "call":
        return <div>Call Modal Content</div>;
      case "task":
        return <div>Task Modal Content</div>;
      case "meeting":
        return <div>Meeting Modal Content</div>;
      case "more":
        return <div>More Modal Content</div>;
      default:
        return null;
    }
  };

  // Sync scroll between textarea and mirror
  useEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (textarea && mirror) {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    }
  }, [noteContent]);

  useEffect(() => {
    setMentionDropdownIndex(0);
  }, [showMentionDropdown, mentionSearch]);

  return (
    <div className="flex flex-1 bg-background">
      <aside className="w-80 bg-foreground flex flex-col border-r border-border">
        <div className="flex flex-col items-center py-4 border-b border-border">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-2 border border-border"></div>
          <h2 className="text-xl font-bold text-text">HubSpot</h2>
          <a
            href="https://hubspot.com"
            className="text-text-muted text-sm hover:underline mb-2">
            hubspot.com
          </a>

          <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("note")}
                className="text-text-muted text-sm hover:underline p-3 rounded-lg border border-border hover:bg-surface cursor-pointer">
                <Notebook size={16} />
              </button>
              <span className="text-text-muted text-xs">Note</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("email")}
                className="text-text-muted text-sm hover:underline p-3 rounded-lg border border-border hover:bg-surface cursor-pointer">
                <Mail size={16} />
              </button>
              <span className="text-text-muted text-xs">Email</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("call")}
                className="text-text-muted text-sm hover:underline p-3 rounded-lg border border-border hover:bg-surface cursor-pointer">
                <Phone size={16} />
              </button>
              <span className="text-text-muted text-xs">Call</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("task")}
                className="text-text-muted text-sm hover:underline p-3 rounded-lg border border-border hover:bg-surface cursor-pointer">
                <CheckCircle size={16} />
              </button>
              <span className="text-text-muted text-xs">Task</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("meeting")}
                className="text-text-muted text-sm hover:underline p-3 rounded-lg border border-border hover:bg-surface cursor-pointer">
                <Calendar size={16} />
              </button>
              <span className="text-text-muted text-xs">Meeting</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {}}
                className="text-text-muted text-sm hover:underline p-3 rounded-lg border border-border hover:bg-surface cursor-pointer">
                <MoreHorizontal size={16} />
              </button>
              <span className="text-text-muted text-xs">More</span>
            </div>
          </div>
        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          <div className="space-y-2 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Company domain name</span>
              <input
                type="text"
                defaultValue="hubspot.com"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Industry</span>
              <input
                type="text"
                placeholder="Enter industry"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Company owner</span>
              <input
                type="text"
                placeholder="Enter owner"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Type</span>
              <input
                type="text"
                placeholder="Enter type"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">City</span>
              <input
                type="text"
                placeholder="Enter city"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">State/Region</span>
              <input
                type="text"
                placeholder="Enter state"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Postal code</span>
              <input
                type="text"
                placeholder="Enter postal code"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Number of employees</span>
              <input
                type="number"
                placeholder="Enter number"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Annual revenue</span>
              <input
                type="text"
                placeholder="Enter revenue"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Time zone</span>
              <input
                type="text"
                placeholder="Entertimezone"
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-2">
        <div className="bg-foreground px-4 pt-2 rounded-lg border border-border">
          <div className="flex space-x-8 text-sm">
            <button className="pb-2 border-b-2 border-primary text-primary font-semibold cursor-pointer">
              Overview
            </button>
            <button className="pb-2 text-text-muted hover:text-primary cursor-pointer">
              Activities
            </button>
          </div>
        </div>
        <div className="flex-1 flex mt-2 space-x-2 overflow-auto">
          <section className="flex-1 space-y-2">
            {/* Data Highlights */}
            <div
              className="bg-foreground rounded-lg border border-border p-4 flex justify-between"
              style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
              <div>
                <div className="text-xs text-text-muted">CREATE DATE</div>
                <div className="font-semibold text-text">
                  06/09/2025 3:16 PM EDT
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">LIFECYCLE STAGE</div>
                <div className="font-semibold text-text">Opportunity</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">
                  LAST ACTIVITY DATE
                </div>
                <div className="font-semibold text-text">--</div>
              </div>
            </div>
            {/* Recent Activities */}
            <div
              className="bg-foreground rounded-lg border border-border p-4"
              style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text">Recent activities</h4>
                <button className="text-xs text-text-muted border border-border px-2 py-1 rounded hover:bg-surface">
                  All time so far
                </button>
              </div>
              <div className="flex items-center mb-4">
                <input
                  type="text"
                  placeholder="Search activities"
                  className="border border-border bg-background text-text rounded px-3 py-1 text-sm w-64 placeholder:text-text-muted"
                />
                <span className="ml-4 text-info text-xs cursor-pointer">
                  5 activities
                </span>
              </div>
              <div className="flex flex-col items-center py-8">
                <svg
                  className="w-12 h-12 text-text-muted/50 mb-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <div className="text-text-muted">No activities.</div>
              </div>
            </div>
            {/* Contacts Table */}
            <div
              className="bg-foreground rounded-lg border border-border p-4"
              style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text">Contacts</h4>
                <button className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
                  + Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Search"
                className="border border-border bg-background text-text rounded px-3 py-1 text-sm mb-4 w-64 placeholder:text-text-muted"
              />
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    <th className="text-left py-2">NAME</th>
                    <th className="text-left py-2">EMAIL</th>
                    <th className="text-left py-2">PHONE NUMBER</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2 flex items-center">
                      <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                          />
                        </svg>
                      </span>
                      <span className="text-text">
                        Maria Johnson (Sample Contact)
                      </span>
                    </td>
                    <td className="py-2 text-info">emailmaria@hubspot.com</td>
                    <td className="py-2 text-text">--</td>
                  </tr>
                  <tr>
                    <td className="py-2 flex items-center">
                      <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                          />
                        </svg>
                      </span>
                      <span className="text-text">
                        Brian Halligan (Sample Contact)
                      </span>
                    </td>
                    <td className="py-2 text-info">bh@hubspot.com</td>
                    <td className="py-2 text-text">--</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <aside className="w-96 flex flex-col space-y-2 pt-2">
        {/* Company summary */}
        <div
          className="bg-foreground rounded-lg border border-border p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text">Company summary</h4>
            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded font-bold">
              +AI
            </span>
          </div>
          <div className="text-xs text-text-muted mb-2">
            Generated Jun 10, 2025
          </div>
          <div className="text-text text-sm mb-4">
            There are no activities associated with this company, and further
            details are needed to provide a comprehensive summary.
          </div>
          <button className="text-primary border border-primary rounded px-3 py-1 text-xs hover:bg-primary/10">
            + Ask a question
          </button>
        </div>
        {/* Contacts Panel */}
        <div
          className="bg-foreground rounded-lg border border-border p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text">Contacts (2)</h4>
            <button className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
              + Add
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-surface p-3 rounded">
              <div>
                <div className="font-semibold text-sm text-text">
                  Maria Johnson (Sample Contact)
                </div>
                <div className="text-xs text-text-muted">
                  Salesperson at HubSpot
                </div>
                <div className="text-xs text-info">emailmaria@hubspot.com</div>
              </div>
              <span className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                </svg>
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface p-3 rounded">
              <div>
                <div className="font-semibold text-sm text-text">
                  Brian Halligan (Sample Contact)
                </div>
                <div className="text-xs text-text-muted">
                  Executive Chairperson at HubSpot
                </div>
                <div className="text-xs text-info">bh@hubspot.com</div>
              </div>
              <span className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                </svg>
              </span>
            </div>
          </div>
          <button className="mt-4 text-xs text-info hover:underline">
            View associated Contacts
          </button>
        </div>
        {/* Deals Panel */}
        <div
          className="bg-foreground rounded-lg border border-border p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text">Deals (1)</h4>
          </div>
          <div className="bg-surface p-3 rounded">
            <div className="font-semibold text-sm text-text">Sample Deal</div>
            <div className="text-xs text-text-muted">Amount: $5,000.00</div>
            <div className="text-xs text-text-muted">
              Close date: June 30, 2025
            </div>
          </div>
        </div>
      </aside>

      <Modal
        isOpen={activeModal.isOpen}
        onClose={handleCloseModal}
        title={`${
          activeModal.type.charAt(0).toUpperCase() + activeModal.type.slice(1)
        }`}
        size="sm">
        {getModalContent()}
      </Modal>
    </div>
  );
};

export default CompanyDetails;
