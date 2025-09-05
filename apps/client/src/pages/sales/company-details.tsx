import {
  Calendar,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Notebook,
  Phone,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import Modal from "@/components/ui/modal";
import { Button } from "@/components";
import { formatCurrency, formatDate } from "@/utils";

const CompanyDetails = () => {
  const { id } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [companyContacts, setCompanyContacts] = useState<any[]>([]);
  const [companyJourneys, setCompanyJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [_, setMirrorScroll] = useState(0);
  const [mentionDropdownIndex, setMentionDropdownIndex] = useState(0);

  // Email modal state
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Meeting modal state
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingHour, setMeetingHour] = useState(9);
  const [meetingMinute, setMeetingMinute] = useState(0);
  const [meetingAmPm, setMeetingAmPm] = useState("AM");
  const [meetingDuration, setMeetingDuration] = useState(15);

  // Mock data for mentions
  const mentionOptions = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com" },
  ];

  // Journey adaptation logic (from pipeline.tsx)
  const mapLegacyStageToId = (stage: any): number => {
    const s = String(stage ?? "").toLowerCase();
    if (!s) return 1;
    if (s.includes("qualify") || s.includes("qualifi") || s.includes("pain") || s.includes("discover")) return 2;
    if (s.includes("present") || s.includes("demo") || s.includes("proposal") || s.includes("quote")) return 3;
    if (s.includes("negot")) return 4;
    if (s.includes("po") || s.includes("won") || s.includes("closedwon") || s.includes("closed won") || s.includes("order")) return 5;
    if (s.includes("lost") || s.includes("closedlost") || s.includes("closed lost") || s.includes("declin")) return 6;
    if (s.includes("lead") || s.includes("open") || s.includes("new")) return 1;
    return 1;
  };

  const normalizeDate = (d: any) => {
    if (!d) return undefined;
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
    return s.includes(" ") ? s.replace(" ", "T") : s;
  };

  const parseConfidence = (v: any) => {
    if (v == null || v === "") return undefined;
    const m = String(v).match(/\d+/);
    return m ? Math.min(100, Math.max(0, Number(m[0]))) : undefined;
  };

  const normalizePriority = (v: any): string => {
    const s = String(v ?? "").toUpperCase().trim();
    if (s === "A" || s === "B" || s === "C" || s === "D") return s;
    if (s.startsWith("H")) return "A";
    if (s.startsWith("L")) return "D";
    if (s.startsWith("M")) return "C";
    return "C";
  };

  const adaptLegacyJourney = (raw: any) => {
    const id = raw.ID;
    const name = raw.Project_Name && String(raw.Project_Name).trim()
      ? raw.Project_Name
      : (raw.Target_Account || `Journey ${raw.ID}`);

    const stage = mapLegacyStageToId(raw.Journey_Stage);
    const value = Number(raw.Journey_Value ?? 0);
    const priority = normalizePriority(raw.Priority);

    const closeDate =
      normalizeDate(raw.Expected_Decision_Date) ??
      normalizeDate(raw.Quote_Presentation_Date) ??
      normalizeDate(raw.Date_PO_Received) ??
      normalizeDate(raw.Journey_Start_Date) ??
      normalizeDate(raw.CreateDT) ??
      new Date().toISOString();

    const updatedAt =
      normalizeDate(raw.Action_Date) ??
      normalizeDate(raw.CreateDT) ??
      new Date().toISOString();

    const customerId = String(raw.Company_ID ?? "");
    const companyName = raw.Target_Account || undefined;
    const confidence = parseConfidence(raw.Chance_To_Secure_order);

    return {
      id,
      name,
      stage,
      value,
      priority,
      closeDate,
      updatedAt,
      customerId,
      companyName,
      confidence,
      Project_Name: raw.Project_Name,
      Target_Account: raw.Target_Account,
      Journey_Stage: raw.Journey_Stage,
      Journey_Type: raw.Journey_Type,
      Journey_Value: raw.Journey_Value,
      Priority: raw.Priority,
      Lead_Source: raw.Lead_Source,
      Equipment_Type: raw.Equipment_Type,
      Quote_Type: raw.Quote_Type,
      RSM: raw.RSM,
      RSM_Territory: raw.RSM_Territory,
      Quote_Number: raw.Quote_Number,
      Qty_of_Items: raw.Qty_of_Items,
      CreateDT: raw.CreateDT,
      Quote_Presentation_Date: raw.Quote_Presentation_Date,
      Expected_Decision_Date: raw.Expected_Decision_Date,
      Action_Date: raw.Action_Date,
      Journey_Status: raw.Journey_Status,
      Notes: raw.Notes,
      Industry: raw.Industry,
      Chance_To_Secure_order: raw.Chance_To_Secure_order,
    };
  };

  // Data fetching logic
  useEffect(() => {
    console.log("Company ID from URL:", id, "Type:", typeof id); // Debug log
    if (!id || id === "undefined" || id === "null") {
      console.error("No valid company ID provided in URL");
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    const fetchCompanyData = async () => {
      setLoading(true);
      try {
        
        // Use new custom ID API endpoints for proper server-side filtering
        const [companyResponse, contactsResponse, journeysResponse] = await Promise.all([
          // Get company by Company_ID using custom ID endpoint
          fetch(`http://localhost:8080/api/legacy/std/Company/custom/${id}?idField=Company_ID`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          // Get contacts filtered by Company_ID
          fetch(`http://localhost:8080/api/legacy/std/Contacts/filter/custom?filterField=Company_ID&filterValue=${id}&limit=100`, {
            method: "GET", 
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          // Get journeys filtered by Company_ID
          fetch(`http://localhost:8080/api/legacy/std/Journey/filter/custom?filterField=Company_ID&filterValue=${id}&limit=100`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          })
        ]);

        // Process contacts data
        let contactsData = [];
        if (contactsResponse.ok) {
          const rawContacts = await contactsResponse.json();
          contactsData = Array.isArray(rawContacts) ? rawContacts : [];
          if (!cancelled) setCompanyContacts(contactsData);
        } else {
          console.error("Contacts fetch failed:", contactsResponse.status);
        }

        // Process journeys data
        let journeysData = [];
        if (journeysResponse.ok) {
          const rawJourneys = await journeysResponse.json();
          journeysData = Array.isArray(rawJourneys) ? rawJourneys.map(adaptLegacyJourney) : [];
          if (!cancelled) setCompanyJourneys(journeysData);
        } else {
          console.error("Journeys fetch failed:", journeysResponse.status);
        }

        // Process company data
        if (companyResponse.ok) {
          const rawCompanyData = await companyResponse.json();
          // Custom ID endpoint returns array, get first item
          const companyData = Array.isArray(rawCompanyData) ? rawCompanyData[0] : rawCompanyData;
          
          if (companyData && !cancelled) {
            // Find primary contact
            const primaryContact = contactsData.find(contact => contact.Type === 'A') || contactsData[0];
            
            const adaptedCompany = {
              id: companyData.Company_ID,
              name: companyData.CustDlrName || `Company ${companyData.Company_ID}`,
              phone: primaryContact?.PhoneNumber || companyData.BillToPhone || "",
              email: primaryContact?.Email || "",
              website: primaryContact?.Website || "",
              dealer: companyData.Dealer,
              active: companyData.Active,
              isDealer: companyData.IsDealer,
              isExcDealer: companyData.IsExcDealer,
              creditStatus: companyData.CreditStatus,
              creditNote: companyData.CreditNote,
              onHoldBy: companyData.OnHoldBy,
              onHoldDate: companyData.OnHoldDate,
              offHoldBy: companyData.OffHoldBy,
              offHoldDate: companyData.OffHoldDate,
              classification: companyData.Classification,
              custType: companyData.CustType,
              lastCreditStat: companyData.LastCreditStat,
              coeRSM: companyData.CoeRSM,
              discounted: companyData.Discounted,
              notes: companyData.Notes,
              shipInstr: companyData.ShipInstr,
              billToExt: companyData.BillToExt,
              creditLimit: companyData.CreditLimit,
              acctBalance: companyData.AcctBalance,
              balanceDate: companyData.BalanceDate,
              termsCode: companyData.TermsCode,
              exported: companyData.Exported,
              systemNotes: companyData.SystemNotes,
            };
            setCompany(adaptedCompany);
          } else {
            console.warn(`No company found with ID ${id}`);
          }
        } else {
          console.error("Company fetch failed:", companyResponse.status);
          if (companyResponse.status === 404) {
            console.warn(`Company with ID ${id} not found`);
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCompanyData();
    return () => { cancelled = true; };
  }, [id]);

  const handleOpenModal = (type: string) => {
    setActiveModal({ type, isOpen: true });
  };

  const handleCloseModal = () => {
    setActiveModal({ type: "", isOpen: false });
    setNoteContent("");
    setShowMentionDropdown(false);
  };

  const handleEmailModalClose = () => {
    setActiveModal({ type: "", isOpen: false });
    setEmailRecipients("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleMeetingModalClose = () => {
    setActiveModal({ type: "", isOpen: false });
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingHour(9);
    setMeetingMinute(0);
    setMeetingAmPm("AM");
    setMeetingDuration(15);
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
          <div className="flex flex-col gap-2 relative">
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={handleNoteChange}
              className="w-full h-60 bg-background border border-border rounded p-3 text-text focus:outline-none focus:border-primary resize-none overflow-y-auto relative z-0"
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
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCloseModal}>
                Submit
              </Button>
            </div>
          </div>
        );
      case "email":
        return (
          <div className="flex flex-col gap-2 relative">
            <input
              type="text"
              className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
              placeholder="Recipients (comma separated)"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
            />
            <input
              type="text"
              className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
              placeholder="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <textarea
              className="w-full h-40 bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none overflow-y-auto"
              placeholder="Write your email here..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={handleEmailModalClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleEmailModalClose}>
                Send
              </Button>
            </div>
          </div>
        );
      case "call":
        return (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
              placeholder="Phone number"
            />
            <textarea
              className="w-full h-24 bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none overflow-y-auto"
              placeholder="Call notes (optional)"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCloseModal}>
                Log Call
              </Button>
            </div>
          </div>
        );
      case "task":
        return (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
              placeholder="Task title"
            />
            <textarea
              className="w-full h-24 bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none overflow-y-auto"
              placeholder="Task details"
            />
            <input
              type="date"
              className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
              placeholder="Due date"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCloseModal}>
                Create Task
              </Button>
            </div>
          </div>
        );
      case "meeting":
        return (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              className="w-full bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
              placeholder="Meeting title"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
            />
            <div className="flex flex-row gap-2">
              <div className="flex flex-col items-center">
                <label className="block text-xs text-text-muted mb-1">
                  Date
                </label>
                <MiniCalendar
                  selected={meetingDate}
                  onSelect={setMeetingDate}
                />
                {meetingDate && (
                  <div className="mt-1 text-xs text-info">
                    Selected: {meetingDate}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="block text-xs text-text-muted">
                  Start Time
                </label>
                <div className="flex gap-2">
                  <select
                    className="bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
                    value={meetingHour}
                    onChange={(e) => setMeetingHour(Number(e.target.value))}>
                    {[...Array(12)].map((_, i) => (
                      <option
                        key={i + 1}
                        value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <span className="self-center">:</span>
                  <select
                    className="bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
                    value={meetingMinute}
                    onChange={(e) => setMeetingMinute(Number(e.target.value))}>
                    {[0, 15, 30, 45].map((min) => (
                      <option
                        key={min}
                        value={min}>
                        {min.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <select
                    className="bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
                    value={meetingAmPm}
                    onChange={(e) => setMeetingAmPm(e.target.value)}>
                    {["AM", "PM"].map((ampm) => (
                      <option
                        key={ampm}
                        value={ampm}>
                        {ampm}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="block text-xs text-text-muted mt-2">
                  Duration
                </label>
                <select
                  className="bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary"
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(Number(e.target.value))}>
                  {[15, 30, 45, 60, 75, 90, 105, 120].map((min) => (
                    <option
                      key={min}
                      value={min}>
                      {min} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="secondary-outline"
                onClick={handleMeetingModalClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMeetingModalClose}>
                Schedule
              </Button>
            </div>
          </div>
        );
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

  if (loading) {
    return (
      <div className="flex flex-1 bg-background items-center justify-center">
        <div className="text-text">Loading company details...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-1 bg-background items-center justify-center">
        <div className="text-text">Company not found</div>
      </div>
    );
  }

  const companyInitial = company.name ? company.name.charAt(0).toUpperCase() : 'C';
  
  return (
    <div className="flex flex-1 bg-background">
      <aside className="w-max bg-foreground flex flex-col border-r border-border">
        <div className="flex flex-col items-center py-4 border-b border-border">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-2 border border-border">
            <span className="text-primary text-2xl font-bold">{companyInitial}</span>
          </div>
          <h2 className="text-xl font-bold text-text px-2">{company.name}</h2>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted text-sm hover:underline mb-2">
              {company.website}
            </a>
          )}

          <div className="flex items-center justify-center gap-2 px-2">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("note")}
                className="text-primary text-sm hover:underline p-3 rounded-lg bg-primary/25 hover:bg-primary/35 cursor-pointer">
                <Notebook size={16} />
              </button>
              <span className="text-text-muted text-xs">Note</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("email")}
                className="text-primary text-sm hover:underline p-3 rounded-lg bg-primary/25 hover:bg-primary/35 cursor-pointer">
                <Mail size={16} />
              </button>
              <span className="text-text-muted text-xs">Email</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("call")}
                className="text-primary text-sm hover:underline p-3 rounded-lg bg-primary/25 hover:bg-primary/35 cursor-pointer">
                <Phone size={16} />
              </button>
              <span className="text-text-muted text-xs">Call</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("task")}
                className="text-primary text-sm hover:underline p-3 rounded-lg bg-primary/25 hover:bg-primary/35 cursor-pointer">
                <CheckCircle size={16} />
              </button>
              <span className="text-text-muted text-xs">Task</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleOpenModal("meeting")}
                className="text-primary text-sm hover:underline p-3 rounded-lg bg-primary/25 hover:bg-primary/35 cursor-pointer">
                <Calendar size={16} />
              </button>
              <span className="text-text-muted text-xs">Meet</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {}}
                className="text-primary text-sm hover:underline p-3 rounded-lg bg-primary/25 hover:bg-primary/35 cursor-pointer">
                <MoreHorizontal size={16} />
              </button>
              <span className="text-text-muted text-xs">More</span>
            </div>
          </div>
        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          <div className="space-y-2 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Company ID</span>
              <input
                type="text"
                value={company.id || ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Customer Type</span>
              <input
                type="text"
                value={company.custType || ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Active Status</span>
              <input
                type="text"
                value={company.active ? "Active" : "Inactive"}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Is Dealer</span>
              <input
                type="text"
                value={company.isDealer ? "Yes" : "No"}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Credit Status</span>
              <input
                type="text"
                value={company.creditStatus || ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Credit Limit</span>
              <input
                type="text"
                value={company.creditLimit ? formatCurrency(company.creditLimit) : ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Account Balance</span>
              <input
                type="text"
                value={company.acctBalance ? formatCurrency(company.acctBalance) : ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Terms Code</span>
              <input
                type="text"
                value={company.termsCode || ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">COE RSM</span>
              <input
                type="text"
                value={company.coeRSM || ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Classification</span>
              <input
                type="text"
                value={company.classification || ""}
                readOnly
                className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-2">
        <div className="bg-foreground px-4 pt-2 rounded-lg border border-border">
          <div className="flex space-x-8 text-sm">
            <button className="pb-2 border-b-2 border-primary/50 text-primary font-semibold cursor-pointer">
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
                <div className="text-xs text-text-muted">CREDIT STATUS</div>
                <div className="font-semibold text-text">
                  {company.creditStatus || "--"}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">ACCOUNT BALANCE</div>
                <div className="font-semibold text-text">
                  {company.acctBalance ? formatCurrency(company.acctBalance) : "--"}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">BALANCE DATE</div>
                <div className="font-semibold text-text">
                  {company.balanceDate ? formatDate(company.balanceDate) : "--"}
                </div>
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
                <h4 className="font-semibold text-text">Contacts ({companyContacts.length})</h4>
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
                  {companyContacts.length > 0 ? (
                    companyContacts.map((contact, index) => {
                      const fullName = `${contact.FirstName || ""} ${contact.LastName || ""}`.trim();
                      const contactInitial = fullName ? fullName.charAt(0).toUpperCase() : 'C';
                      const uniqueKey = `contact-${contact.Cont_Id || contact.Company_ID}-${index}`;
                      
                      return (
                        <tr key={uniqueKey} className="border-b border-border">
                          <td className="py-2 flex items-center">
                            <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                              <span className="text-primary text-xs font-bold">{contactInitial}</span>
                            </span>
                            <div className="flex flex-col">
                              <span className="text-text">
                                {fullName || "Unnamed Contact"}
                              </span>
                              {contact.ConTitle && (
                                <span className="text-xs text-text-muted">
                                  {contact.ConTitle}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2">
                            {contact.Email ? (
                              <a href={`mailto:${contact.Email}`} className="text-info hover:underline">
                                {contact.Email}
                              </a>
                            ) : (
                              <span className="text-text">--</span>
                            )}
                          </td>
                          <td className="py-2">
                            {contact.PhoneNumber ? (
                              <a href={`tel:${contact.PhoneNumber}`} className="text-text hover:underline">
                                {contact.PhoneNumber}
                                {contact.PhoneExt && ` ext. ${contact.PhoneExt}`}
                              </a>
                            ) : (
                              <span className="text-text">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-text-muted">
                        No contacts found for this company
                      </td>
                    </tr>
                  )}
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
            <h4 className="font-semibold text-text">Company Information</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-text-muted">Status: </span>
              <span className={`font-medium ${company.active ? 'text-green-600' : 'text-red-600'}`}>
                {company.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {company.isDealer && (
              <div>
                <span className="text-text-muted">Type: </span>
                <span className="text-text font-medium">Dealer</span>
              </div>
            )}
            
            {company.creditNote && (
              <div>
                <span className="text-text-muted">Credit Note: </span>
                <span className="text-text">{company.creditNote}</span>
              </div>
            )}
            
            {(company.onHoldBy || company.onHoldDate) && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                <div className="text-yellow-800 text-xs font-medium">Account On Hold</div>
                {company.onHoldBy && (
                  <div className="text-yellow-700 text-xs">By: {company.onHoldBy}</div>
                )}
                {company.onHoldDate && (
                  <div className="text-yellow-700 text-xs">Date: {formatDate(company.onHoldDate)}</div>
                )}
              </div>
            )}
            
            {company.notes && (
              <div>
                <span className="text-text-muted">Notes: </span>
                <div className="text-text mt-1 p-2 bg-background rounded border text-xs">
                  {company.notes}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Contacts Panel */}
        <div
          className="bg-foreground rounded-lg border border-border p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text">Contacts ({companyContacts.length})</h4>
            <button className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
              + Add
            </button>
          </div>
          <div className="space-y-4">
            {companyContacts.length > 0 ? (
              companyContacts.slice(0, 3).map((contact, index) => {
                const fullName = `${contact.FirstName || ""} ${contact.LastName || ""}`.trim();
                const contactInitial = fullName ? fullName.charAt(0).toUpperCase() : 'C';
                const uniqueKey = `sidebar-contact-${contact.Cont_Id || contact.Company_ID}-${index}`;
                
                return (
                  <div key={uniqueKey} className="flex items-center justify-between bg-surface p-3 rounded">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-text">
                        {fullName || "Unnamed Contact"}
                      </div>
                      {contact.ConTitle && (
                        <div className="text-xs text-text-muted">
                          {contact.ConTitle}
                        </div>
                      )}
                      {contact.Email && (
                        <div className="text-xs text-info">{contact.Email}</div>
                      )}
                      {contact.PhoneNumber && (
                        <div className="text-xs text-text-muted">
                          {contact.PhoneNumber}
                          {contact.PhoneExt && ` ext. ${contact.PhoneExt}`}
                        </div>
                      )}
                    </div>
                    <span className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary text-sm font-bold">{contactInitial}</span>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-text-muted">
                No contacts found for this company
              </div>
            )}
          </div>
          {companyContacts.length > 3 && (
            <button className="mt-4 text-xs text-info hover:underline">
              View all {companyContacts.length} contacts
            </button>
          )}
        </div>
        {/* Deals Panel */}
        <div
          className="bg-foreground rounded-lg border border-border p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-text">Journeys ({companyJourneys.length})</h4>
            <button className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
              + Add
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {companyJourneys.length > 0 ? (
              companyJourneys.map((journey, index) => {
                const uniqueKey = `journey-${journey.id || journey.customerId}-${index}`;
                return (
                  <div key={uniqueKey} className="bg-surface p-3 rounded">
                    <div className="font-semibold text-sm text-text mb-1">{journey.name}</div>
                    <div className="text-xs text-text-muted mb-1">
                      Amount: {formatCurrency(journey.value)}
                    </div>
                    <div className="text-xs text-text-muted mb-1">
                      Close date: {formatDate(journey.closeDate)}
                    </div>
                    <div className="text-xs text-text-muted mb-1">
                      Stage: {journey.Journey_Stage || `Stage ${journey.stage}`}
                    </div>
                    {journey.confidence && (
                      <div className="text-xs text-text-muted mb-1">
                        Confidence: {journey.confidence}%
                      </div>
                    )}
                    {journey.Priority && (
                      <div className="flex items-center mt-2">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Priority {journey.Priority}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-text-muted">
                No journeys found for this company
              </div>
            )}
          </div>
          {companyJourneys.length > 0 && (
            <div className="mt-3 pt-2 border-t border-border">
              <div className="text-xs text-text-muted">
                Total Pipeline Value: {formatCurrency(companyJourneys.reduce((sum, j) => sum + (j.value || 0), 0))}
              </div>
            </div>
          )}
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

// MiniCalendar component
const MiniCalendar = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (date: string) => void;
}) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = firstDayOfMonth.getDay();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    const d = new Date(selected);
    return (
      d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    );
  };

  return (
    <div className="inline-block p-2 border border-border rounded bg-background">
      <div className="flex justify-between items-center mb-1">
        <button
          type="button"
          className="px-2"
          onClick={handlePrev}>
          &lt;
        </button>
        <span className="font-semibold text-sm">
          {new Date(year, month).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          type="button"
          className="px-2"
          onClick={handleNext}>
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 text-xs mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-text-muted">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((w, i) => (
        <div
          key={i}
          className="grid grid-cols-7 mb-1">
          {w.map((day, j) =>
            day ? (
              <button
                key={j}
                className={`w-7 h-7 rounded text-sm ${
                  isSelected(day) ? "bg-primary text-white" : "hover:bg-surface"
                } ${
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear()
                    ? "border border-primary"
                    : ""
                }`}
                onClick={() =>
                  onSelect(
                    `${year}-${String(month + 1).padStart(2, "0")}-${String(
                      day
                    ).padStart(2, "0")}`
                  )
                }
                type="button">
                {day}
              </button>
            ) : (
              <div key={j} />
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default CompanyDetails;