import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Plus, User, Trash2, Search } from "lucide-react";
import { PageHeader, Tabs, Table, Button, Modal, AddContactModal } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { STAGES, VALID_CONFIDENCE_LEVELS, VALID_REASON_WON, VALID_REASON_LOST, VALID_PRESENTATION_METHODS, VALID_JOURNEY_TYPES, VALID_LEAD_SOURCES, VALID_EQUIPMENT_TYPES, VALID_DEALERS, VALID_DEALER_CONTACTS, VALID_INDUSTRIES, VALID_QUOTE_TYPES } from "./journeys/constants";
import { formatDateForDatabase, getValidEquipmentType, getValidLeadSource, getValidJourneyType, getValidDealer, getValidDealerContact, getValidIndustry, fetchAvailableRsms, fetchDemographicCategory, Employee } from "./journeys/utils";
import { COMPETITION_OPTIONS } from "./journeys/types";

type StageId = (typeof STAGES)[number]["id"];

const mapLegacyStageToId = (stage: any): StageId => {
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

const stageLabel = (id?: number) => STAGES.find(s => s.id === Number(id))?.label ?? `Stage ${id ?? ""}`;
const getStageLabel = (journey: any) => {
  if (journey?.Journey_Stage) {
    const mappedStageId = mapLegacyStageToId(journey.Journey_Stage);
    return stageLabel(mappedStageId);
  }
  if (typeof journey?.stage === 'number') return stageLabel(journey.stage);
  return "-";
};

const getPriorityLabel = (priority: string) => {
  const labels = { A: "Highest", B: "High", C: "Medium", D: "Lowest" };
  return labels[String(priority ?? "").toUpperCase() as keyof typeof labels] || "Medium";
};

const getPriorityColor = (priority: string) => {
  const colors = { A: "bg-red-500", B: "bg-orange-500", C: "bg-yellow-500", D: "bg-green-500" };
  return colors[String(priority ?? "").toUpperCase() as keyof typeof colors] || "bg-gray-400";
};

const logJourneyChanges = async (api: any, journeyId: string, oldData: any, newData: Record<string, any>, originalUpdates: Record<string, any>, employee: any) => {
  if (!employee?.initials) return;
  const areValuesEqual = (oldVal: any, newVal: any, originalVal: any, fieldName: string) => {
    if (fieldName.includes('Date') || fieldName.includes('_Date')) {
      const oldDateStr = oldVal ? String(oldVal).split(' ')[0] : '';
      const newDateStr = originalVal ? String(originalVal) : '';
      return oldDateStr === newDateStr;
    }
    return oldVal === newVal;
  };
  const changes = [];
  for (const [field, newValue] of Object.entries(newData)) {
    const oldValue = oldData?.[field];
    const originalValue = originalUpdates?.[field];
    if (!areValuesEqual(oldValue, newValue, originalValue, field)) {
      let fromValue = oldValue || 'null';
      let toValue = originalValue !== undefined ? originalValue : newValue;
      if ((field.includes('Date') || field.includes('_Date')) && toValue && toValue !== 'null') {
        if (toValue.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(toValue)) toValue = toValue;
      }
      changes.push(`${field}: FROM ${fromValue} TO ${toValue}`);
    }
  }
  if (changes.length > 0) {
    try {
      await api.post('/legacy/std/Journey_Log', {
        Jrn_ID: journeyId,
        Action: changes.join('; '),
        CreateDtTm: new Date().toISOString().replace('T', ' ').substring(0, 23),
        CreateInit: employee.initials
      });
    } catch (error) {
      console.error('Error logging journey changes:', error);
    }
  }
};

const saveJourneyUpdates = async (api: any, journey: any, updates: Record<string, any>, originalUpdates: Record<string, any>, employee: any, setIsSaving: (val: boolean) => void) => {
  if (!journey?.ID && !journey?.id) return false;
  setIsSaving(true);
  try {
    const journeyId = journey.ID || journey.id;
    await logJourneyChanges(api, journeyId, journey, updates, originalUpdates, employee);
    const result = await api.patch(`/legacy/base/Journey/${journeyId}`, updates);
    return result !== null;
  } catch (error) {
    console.error("Error updating journey:", error);
    return false;
  } finally {
    setIsSaving(false);
  }
};

const formatDateSafe = (date: any) => {
  try {
    return date ? formatDate(date) : "-";
  } catch {
    return date || "-";
  }
};

// Will work on removing these later
const extractDateOnly = (dateStr: any) => {
  if (!dateStr) return "";
  const str = String(dateStr);
  const match = str.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};

const EditButtons = ({ isEditing, onSave, onCancel, onEdit, isSaving }: any) => (
  <div className="flex gap-2">
    {isEditing ? (
      <>
        <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button variant="secondary-outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </>
    ) : (
      <Button variant="secondary-outline" size="sm" onClick={onEdit}>
        <Edit size={16} />
      </Button>
    )}
  </div>
);

const FormField = ({ label, children, className = "" }: any) => (
  <div className={className}>
    <div className="text-sm text-text-muted">{label}</div>
    {children}
  </div>
);

function JourneyDetailsTab({ journey, journeyContacts, updateJourney, setJourneyContacts, employee, validJourneyStatuses }: { journey: any | null; journeyContacts: any[]; updateJourney: (updates: Record<string, any>) => void; setJourneyContacts: React.Dispatch<React.SetStateAction<any[]>>; employee: any; validJourneyStatuses: string[] }) {
  const [availableRsms, setAvailableRsms] = useState<Employee[]>([]);
  const api = useApi();

  const getValidRSM = (value: string) => {
    if (!value) return "";
    const normalized = availableRsms.find(rsm =>
      rsm.initials.toLowerCase() === value.toLowerCase()
    );
    return normalized ? normalized.initials : value;
  };

  const getRsmDisplayName = (value: string) => {
    if (!value) return "-";
    const rsm = availableRsms.find(r =>
      r.initials.toLowerCase() === value.toLowerCase()
    );
    return rsm ? `${rsm.name} (${rsm.initials})` : value;
  };

  const createDetailsFormData = (journey: any) => ({
    type: getValidJourneyType(journey?.Journey_Type ?? journey?.type),
    source: getValidLeadSource(journey?.Lead_Source ?? journey?.source),
    equipmentType: getValidEquipmentType(journey?.Equipment_Type),
    rsm: getValidRSM(journey?.RSM),
    rsmTerritory: journey?.RSM_Territory ?? "",
    rsmAssist: getValidRSM(journey?.RSM_Helped),
    value: journey?.Journey_Value ?? journey?.value ?? "",
    dealer: getValidDealer(journey?.Dealer ?? journey?.Dealer_Name ?? ""),
    dealerContact: getValidDealerContact(journey?.Dealer_Contact ?? ""),
    journeyStartDate: extractDateOnly(journey?.Journey_Start_Date),
    stage: journey?.Journey_Stage ?? journey?.stage ?? "",
    priority: journey?.Priority ?? journey?.priority ?? "",
    status: journey?.Journey_Status ?? journey?.status ?? "",
    presentationDate: extractDateOnly(journey?.Quote_Presentation_Date),
    expectedPoDate: extractDateOnly(journey?.Expected_Decision_Date),
    lastActionDate: extractDateOnly(journey?.Action_Date || journey?.updatedAt),
    confidence: journey?.Chance_To_Secure_order ?? "",
    reasonWon: journey?.Reason_Won ?? "",
    reasonLost: journey?.Reason_Lost ?? "",
    reasonWonLost: journey?.Reason_Won_Lost ?? "",
    competition: journey?.Competition ?? "",
    visitOutcome: journey?.Visit_Outcome ?? "",
    visitDate: extractDateOnly(journey?.Visit_Date),
    anticipatedVisitDate: extractDateOnly(journey?.Anticipated_Visit_Date),
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState(createDetailsFormData(journey));
  const [isEditingVisitLogging, setIsEditingVisitLogging] = useState(false);

  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    companyId: journey?.Company_ID || "",
    industry: getValidIndustry(journey?.Industry || ""),
    addressId: journey?.Address_ID || "",
  });
  const [companySearchMode, setCompanySearchMode] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const [companyName, setCompanyName] = useState(journey?.Target_Account || journey?.companyName || "");
  const lastFetchedCompanyId = useRef<string>("");
  const justSelectedCompany = useRef<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);

  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    Contact_Name: "",
    Contact_Position: "",
    Contact_Email: "",
    Contact_Office: "",
    Contact_Mobile: "",
    Contact_Note: "",
  });

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  const [journeyNotes, setJourneyNotes] = useState<any[]>([]);
  const [journeyNextSteps, setJourneyNextSteps] = useState<any[]>([]);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNextStepBody, setNewNextStepBody] = useState("");
  const [newNextStepDate, setNewNextStepDate] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingNextStep, setIsCreatingNextStep] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingNextSteps, setIsLoadingNextSteps] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [editingNextStepId, setEditingNextStepId] = useState<string | null>(null);
  const [editingNextStepBody, setEditingNextStepBody] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [nextStepToDelete, setNextStepToDelete] = useState<any>(null);
  const [quoteValue, setQuoteValue] = useState<number>(0);
  const [isLoadingQuoteValue, setIsLoadingQuoteValue] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!journey?.ID && !journey?.id) return;
      setIsLoadingNotes(true);
      try {
        const journeyId = journey.ID || journey.id;
        const noteData = await api.get('/core/notes', {
          filter: JSON.stringify({
            entityId: journeyId,
            entityType: "journey",
            type: "note"
          }),
          sort: 'createdAt',
          order: 'desc'
        });
        if (noteData?.success && Array.isArray(noteData.data)) {
          setJourneyNotes(noteData.data);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        setJourneyNotes([]);
      } finally {
        setIsLoadingNotes(false);
      }
    };
    fetchNotes();
  }, [journey?.ID, journey?.id]);

  useEffect(() => {
    const fetchNextSteps = async () => {
      if (!journey?.ID && !journey?.id) return;
      setIsLoadingNextSteps(true);
      try {
        const journeyId = journey.ID || journey.id;
        const nextStepData = await api.get('/core/notes', {
          filter: JSON.stringify({
            entityId: journeyId,
            entityType: "journey",
            type: "next_step"
          }),
          sort: 'createdAt',
          order: 'desc'
        });
        if (nextStepData?.success && Array.isArray(nextStepData.data)) {
          setJourneyNextSteps(nextStepData.data);
        }
      } catch (error) {
        console.error('Error fetching next steps:', error);
        setJourneyNextSteps([]);
      } finally {
        setIsLoadingNextSteps(false);
      }
    };
    fetchNextSteps();
  }, [journey?.ID, journey?.id]);

  useEffect(() => {
    const fetchLastActivity = async () => {
      if (!journey?.ID && !journey?.id) return;
      try {
        const journeyId = journey.ID || journey.id;
        const activityData = await api.get('/core/notes', {
          filter: JSON.stringify({
            entityId: journeyId,
            entityType: "journey",
            type: "LastActivity"
          }),
          sort: 'createdAt',
          order: 'desc',
          limit: 1
        });
        if (activityData?.success && Array.isArray(activityData.data) && activityData.data.length > 0) {
          setLastActivityDate(activityData.data[0].body);
        }
      } catch (error) {
        console.error('Error fetching last activity:', error);
      }
    };
    fetchLastActivity();
  }, [journey?.ID, journey?.id]);

  useEffect(() => {
    const fetchQuoteValue = async () => {
      if (!journey?.Quote_Key_Value) {
        setQuoteValue(0);
        return;
      }
      setIsLoadingQuoteValue(true);
      try {
        const result = await api.get('/legacy/quote-value', {
          quoteKeyValue: journey.Quote_Key_Value
        });
        if (result && typeof result.quoteValue === 'number') {
          setQuoteValue(result.quoteValue);
        } else {
          setQuoteValue(0);
        }
      } catch (error) {
        setQuoteValue(0);
      } finally {
        setIsLoadingQuoteValue(false);
      }
    };
    fetchQuoteValue();
  }, [journey?.Quote_Key_Value]);

  const handleCreateNote = async () => {
    if (!newNoteBody.trim() || !journey?.ID && !journey?.id) return;
    setIsCreatingNote(true);
    try {
      const journeyId = journey.ID || journey.id;
      const newNote = await api.post('/core/notes', {
        body: newNoteBody.trim(),
        entityId: journeyId,
        entityType: "journey",
        type: "note",
        createdBy: `${employee?.firstName} ${employee?.lastName}`
      });
      if (newNote?.success && newNote.data) {
        setJourneyNotes(prev => [newNote.data, ...prev]);
        setNewNoteBody("");
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleCreateNextStep = async () => {
    if (!newNextStepBody.trim() || !newNextStepDate || !journey?.ID && !journey?.id) return;
    setIsCreatingNextStep(true);
    try {
      const journeyId = journey.ID || journey.id;
      const [year, month, day] = newNextStepDate.split('-');
      const formattedDate = `${month}/${day}/${year}`;
      const bodyWithDate = `${formattedDate}: ${newNextStepBody.trim()}`;
      const newNextStep = await api.post('/core/notes', {
        body: bodyWithDate,
        entityId: journeyId,
        entityType: "journey",
        type: "next_step",
        createdBy: `${employee?.firstName} ${employee?.lastName}`
      });
      if (newNextStep?.success && newNextStep.data) {
        setJourneyNextSteps(prev => [newNextStep.data, ...prev]);
        setNewNextStepBody("");
        setNewNextStepDate("");
      }
    } catch (error) {
      console.error('Error creating next step:', error);
      alert('Failed to create next step. Please try again.');
    } finally {
      setIsCreatingNextStep(false);
    }
  };

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body || "");
  };

  const handleSaveNote = async () => {
    if (!editingNoteId || !editingNoteBody.trim()) return;
    setIsSaving(true);
    try {
      const result = await api.patch(`/core/notes/${editingNoteId}`, {
        body: editingNoteBody.trim()
      });
      if (result?.success && result.data) {
        setJourneyNotes(prev => prev.map(note =>
          note.id === editingNoteId ? result.data : note
        ));
        setEditingNoteId(null);
        setEditingNoteBody("");
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteBody("");
  };

  const handleDeleteNote = (note: any) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsSaving(true);
    try {
      const result = await api.delete(`/core/notes/${noteToDelete.id}`);
      if (result !== null) {
        setJourneyNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
        setNoteToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNextStep = (nextStep: any) => {
    setEditingNextStepId(nextStep.id);
    setEditingNextStepBody(nextStep.body || "");
  };

  const handleSaveNextStep = async () => {
    if (!editingNextStepId || !editingNextStepBody.trim()) return;
    setIsSaving(true);
    try {
      const result = await api.patch(`/core/notes/${editingNextStepId}`, {
        body: editingNextStepBody.trim()
      });
      if (result?.success && result.data) {
        setJourneyNextSteps(prev => prev.map(step =>
          step.id === editingNextStepId ? result.data : step
        ));
        setEditingNextStepId(null);
        setEditingNextStepBody("");
      }
    } catch (error) {
      console.error('Error updating next step:', error);
      alert('Failed to update next step. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditNextStep = () => {
    setEditingNextStepId(null);
    setEditingNextStepBody("");
  };

  const handleDeleteNextStep = (nextStep: any) => {
    setNextStepToDelete(nextStep);
  };

  const confirmDeleteNextStep = async () => {
    if (!nextStepToDelete) return;
    setIsSaving(true);
    try {
      const result = await api.delete(`/core/notes/${nextStepToDelete.id}`);
      if (result !== null) {
        setJourneyNextSteps(prev => prev.filter(step => step.id !== nextStepToDelete.id));
        setNextStepToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting next step:', error);
      alert('Failed to delete next step. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (journey) {
      if (!isEditingDetails) {
        setDetailsForm(createDetailsFormData(journey));
      }

      if (!isEditingCustomer) {
        setCustomerForm({
          companyId: journey?.Company_ID || "",
          industry: getValidIndustry(journey?.Industry || ""),
          addressId: journey?.Address_ID || "",
        });
        setCompanyName(journey?.Target_Account || journey?.companyName || "");
        lastFetchedCompanyId.current = journey?.Company_ID || "";
      }
    }
  }, [journey, isEditingDetails, isEditingCustomer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rsms = await fetchAvailableRsms(api);
      if (!cancelled) {
        setAvailableRsms(rsms);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!companySearchQuery.trim() || !companySearchMode || justSelectedCompany.current) {
      setCompanySearchResults([]);
      setShowCompanyResults(false);
      if (justSelectedCompany.current) {
        justSelectedCompany.current = false;
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await api.get('/legacy/std/Company/filter/custom', {
          CustDlrName: `%${companySearchQuery}%`,
          limit: 5
        });
        
        if (Array.isArray(searchResults)) {
          setCompanySearchResults(searchResults);
          setShowCompanyResults(true);
        }
      } catch (error) {
        console.error("Error searching companies:", error);
        setCompanySearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [companySearchQuery, companySearchMode]);

  useEffect(() => {
    if (!customerForm.companyId || companySearchMode) {
      return;
    }

    if (lastFetchedCompanyId.current === customerForm.companyId) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const companyData = await api.get(`/legacy/std/Company/${customerForm.companyId}`);
        if (companyData && companyData.CustDlrName) {
          setCompanyName(companyData.CustDlrName);
          lastFetchedCompanyId.current = customerForm.companyId;
          
          updateJourney({ Target_Account: companyData.CustDlrName });
        } else {
          setCompanyName("");
          lastFetchedCompanyId.current = customerForm.companyId;
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
        setCompanyName("");
        lastFetchedCompanyId.current = customerForm.companyId;
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerForm.companyId, companySearchMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-company-search]')) {
        setShowCompanyResults(false);
      }
    };

    if (showCompanyResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCompanyResults]);

  const navigate = useNavigate();

  const updateLastActivity = async () => {
    if (!journey?.ID && !journey?.id) return;
    try {
      const journeyId = journey.ID || journey.id;
      const now = new Date().toISOString();
      await api.post('/core/notes', {
        body: now,
        entityId: journeyId,
        entityType: "journey",
        type: "LastActivity",
        createdBy: `${employee?.firstName} ${employee?.lastName}`
      });
      setLastActivityDate(now);
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  };

  const handleSaveDetails = async () => {
    const baseUpdates = {
      Journey_Type: detailsForm.type, Lead_Source: detailsForm.source, Equipment_Type: detailsForm.equipmentType,
      RSM: detailsForm.rsm, RSM_Territory: detailsForm.rsmTerritory, RSM_Helped: detailsForm.rsmAssist,
      Journey_Value: detailsForm.value, Dealer: detailsForm.dealer, Dealer_Contact: detailsForm.dealerContact,
      Journey_Stage: detailsForm.stage, Priority: detailsForm.priority, Journey_Status: detailsForm.status,
      Chance_To_Secure_order: detailsForm.confidence, Reason_Won: detailsForm.reasonWon, Reason_Lost: detailsForm.reasonLost,
      Competition: detailsForm.competition, Visit_Outcome: detailsForm.visitOutcome
    };
    const originalUpdates = { ...baseUpdates, Journey_Start_Date: detailsForm.journeyStartDate, Quote_Presentation_Date: detailsForm.presentationDate, Expected_Decision_Date: detailsForm.expectedPoDate, Action_Date: detailsForm.lastActionDate, Visit_Date: detailsForm.visitDate, Anticipated_Visit_Date: detailsForm.anticipatedVisitDate, Reason_Won_Lost: detailsForm.reasonWon || detailsForm.reasonLost };
    const rawUpdates = { ...baseUpdates, Journey_Start_Date: formatDateForDatabase(detailsForm.journeyStartDate), Quote_Presentation_Date: formatDateForDatabase(detailsForm.presentationDate), Expected_Decision_Date: formatDateForDatabase(detailsForm.expectedPoDate), Action_Date: formatDateForDatabase(detailsForm.lastActionDate), Visit_Date: formatDateForDatabase(detailsForm.visitDate), Anticipated_Visit_Date: formatDateForDatabase(detailsForm.anticipatedVisitDate), Reason_Won_Lost: detailsForm.reasonWon || detailsForm.reasonLost };
    const updates = Object.fromEntries(Object.entries(rawUpdates).filter(([key, value]) => ['Reason_Won', 'Reason_Lost', 'Reason_Won_Lost', 'Competition'].includes(key) || value !== ""));
    const success = await saveJourneyUpdates(api, journey, updates, originalUpdates, employee, setIsSaving);
    if (success) {
      setIsEditingDetails(false);
      const stageId = STAGES.find(s => s.label === detailsForm.stage)?.id;
      updateJourney({ ...rawUpdates, stage: stageId });
      await updateLastActivity();
    }
  };

  const handleCancelDetails = () => {
    setIsEditingDetails(false);
  };

  const handleSaveVisitLogging = async () => {
    const originalUpdates = { Visit_Date: detailsForm.visitDate, Anticipated_Visit_Date: detailsForm.anticipatedVisitDate, Visit_Outcome: detailsForm.visitOutcome };
    const rawUpdates = { Visit_Date: formatDateForDatabase(detailsForm.visitDate), Anticipated_Visit_Date: formatDateForDatabase(detailsForm.anticipatedVisitDate), Visit_Outcome: detailsForm.visitOutcome };
    const success = await saveJourneyUpdates(api, journey, rawUpdates, originalUpdates, employee, setIsSaving);
    if (success) {
      setIsEditingVisitLogging(false);
      updateJourney(rawUpdates);
      await updateLastActivity();
    }
  };

  const handleCancelVisitLogging = () => {
    setIsEditingVisitLogging(false);
  };


  const handleSaveCustomer = async () => {
    const updates = { Company_ID: customerForm.companyId, Industry: customerForm.industry, Target_Account: companyName, Address_ID: customerForm.addressId };
    const success = await saveJourneyUpdates(api, journey, updates, updates, employee, setIsSaving);
    if (success) {
      setIsEditingCustomer(false);
      updateJourney(updates);
      await updateLastActivity();
    }
  };

  const handleCancelCustomer = () => {
    setIsEditingCustomer(false);
    setCompanySearchMode(false);
    setCompanySearchQuery("");
    setCompanySearchResults([]);
    setShowCompanyResults(false);
    setCompanyName(journey?.Target_Account || journey?.companyName || "");
    lastFetchedCompanyId.current = journey?.Company_ID || "";
  };

  const handleCompanySelect = (company: any) => {
    justSelectedCompany.current = true;
    
    setCustomerForm(s => ({ ...s, companyId: company.Company_ID }));
    setCompanySearchQuery(company.CustDlrName || "");
    setCompanyName(company.CustDlrName || "");
    lastFetchedCompanyId.current = company.Company_ID;
    
    setShowCompanyResults(false);
    setCompanySearchResults([]);
    
    if (company.CustDlrName) {
      updateJourney({ Target_Account: company.CustDlrName });
    }
  };

  const toggleSearchMode = () => {
    setCompanySearchMode(!companySearchMode);
    if (!companySearchMode) {
      setCompanySearchQuery("");
      setCompanySearchResults([]);
      setShowCompanyResults(false);
    }
  };

  const handleSetPrimaryContact = async (contactId: string, JourneyID: string) => {
    if (!journey?.ID && !journey?.id) return;

    const originalContacts = journeyContacts;
    const selectedContact = journeyContacts.find(c => c.ID === contactId);

    if (!selectedContact) {
      console.error('Could not find contact with ID:', contactId);
      return;
    }

    const isPrismaContact = selectedContact._isPrisma === true;

    setJourneyContacts(prevContacts =>
      prevContacts.map(contact => ({
        ...contact,
        IsPrimary: contact.ID === contactId ? 1 : 0
      }))
    );

    setIsSaving(true);
    try {
      if (isPrismaContact) {
        const result = await api.patch(`/sales/journey-contacts/${contactId}`, {
          isPrimary: true
        });

        if (!result) {
          setJourneyContacts(originalContacts);
        }
      } else {
        await Promise.all([
          api.patch(
            `/legacy/std/Journey_Contact/filter/custom?filterField=Jrn_ID&filterValue=${JourneyID}`,
            { IsPrimary: 0 }
          ).catch(err => {
            console.error('Error clearing legacy primaries:', err);
          }),
          api.get('/sales/journey-contacts', {
            filter: JSON.stringify({ journeyId: JourneyID, isPrimary: true })
          }).then(async (result) => {
            if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
              const updatePromises = result.data.map((jc: any) =>
                api.patch(`/sales/journey-contacts/${jc.id}`, { isPrimary: false })
                  .catch(err => {
                    console.error(`Failed to clear primary for journey contact ${jc.id}:`, err);
                    return null;
                  })
              );
              await Promise.all(updatePromises);
            }
          }).catch(err => {
            console.error('Error fetching Prisma contacts to clear:', err);
          })
        ]);

        const result = await api.patch(`/legacy/std/Journey_Contact/${contactId}`, {
          IsPrimary: 1
        });

        if (result === null) {
          setJourneyContacts(originalContacts);
        }
      }
    } catch (error) {
      console.error("Error updating primary contact:", error);
      setJourneyContacts(originalContacts);
    } finally {
      setIsSaving(false);
    }
  };


  const handleSaveContact = async () => {
    if (!editingContactId) return;
    
    setIsSaving(true);
    try {
      const result = await api.patch(
        `/legacy/std/Journey_Contact/${editingContactId}`,
        contactForm
      );
      
      if (result !== null) {
        setJourneyContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.ID === editingContactId 
              ? { ...contact, ...contactForm }
              : contact
          )
        );
        setEditingContactId(null);
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelContactEdit = () => {
    setEditingContactId(null);
    setContactForm({
      Contact_Name: "",
      Contact_Position: "",
      Contact_Email: "",
      Contact_Office: "",
      Contact_Mobile: "",
      Contact_Note: "",
    });
  };

  const handleEditContact = (contact: any) => {
    setEditingContactId(contact.ID);
    setContactForm({
      Contact_Name: contact.Contact_Name || "",
      Contact_Position: contact.Contact_Position || "",
      Contact_Email: contact.Contact_Email || "",
      Contact_Office: contact.Contact_Office || "",
      Contact_Mobile: contact.Contact_Mobile || "",
      Contact_Note: contact.Contact_Note || "",
    });
  };

  const handleDeleteContact = (contact: any) => {
    setContactToDelete(contact);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    if (!contactToDelete.ID) {
      console.error("Contact missing ID, cannot delete:", contactToDelete);
      alert("Cannot delete contact: Missing database ID. Please refresh the page and try again.");
      setContactToDelete(null);
      return;
    }

    const isPrismaContact = contactToDelete._isPrisma === true;

    setIsSaving(true);
    try {
      let result;

      if (isPrismaContact) {
        result = await api.delete(`/sales/journey-contacts/${contactToDelete.ID}`);
      } else {
        result = await api.delete(`/legacy/std/Journey_Contact/${contactToDelete.ID}`);
      }

      if (result !== null) {
        setJourneyContacts(prevContacts =>
          prevContacts.filter(contact => contact.ID !== contactToDelete.ID)
        );
        setContactToDelete(null);
      } else {
        console.error("Failed to delete contact - API returned null");
        alert("Failed to delete contact. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactAdded = async () => {
    if (!journey?.ID && !journey?.id) return;

    try {
      const journeyId = journey.ID || journey.id;

      const [legacyContacts, prismaContacts] = await Promise.all([
        api.get('/legacy/std/Journey_Contact/filter/custom', {
          filterField: 'Jrn_ID',
          filterValue: journeyId
        }).catch(err => {
          console.error('Error fetching legacy contacts:', err);
          return [];
        }),
        api.get('/sales/journey-contacts', {
          filter: JSON.stringify({ journeyId }),
          include: JSON.stringify({ contact: true })
        }).then(result => {
          const contacts = result?.success && Array.isArray(result.data) ? result.data : [];
          return contacts.map((jc: any) => ({
            ID: jc.id,
            Jrn_ID: jc.journeyId,
            Contact_ID: jc.contactId,
            Contact_Name: jc.contact ? `${jc.contact.firstName} ${jc.contact.lastName}`.trim() : '',
            Contact_Position: jc.contact?.title || '',
            Contact_Email: jc.contact?.email || '',
            Contact_Office: jc.contact?.phone || '',
            Contact_Mobile: jc.contact?.phoneExtension || '',
            Contact_Note: '',
            IsPrimary: jc.isPrimary ? 1 : 0,
            _isPrisma: true
          }));
        }).catch(err => {
          console.error('Error fetching prisma contacts:', err);
          return [];
        })
      ]);

      const legacyArray = Array.isArray(legacyContacts) ? legacyContacts : [];
      const mergedContacts = [...legacyArray, ...prismaContacts];

      setJourneyContacts(mergedContacts);
    } catch (error) {
      console.error("Error refreshing journey contacts:", error);
    }
  };

  if (!journey) return null;

  const customer = journey.customer;

  return (
    <div className="p-2 flex flex-1 flex-col">
      <div className="flex flex-col gap-2 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-2">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Customer Details</h2>
              <div className="flex gap-2">
                <EditButtons isEditing={isEditingCustomer} onSave={handleSaveCustomer} onCancel={handleCancelCustomer} onEdit={() => { setCustomerForm({ companyId: journey?.Company_ID || "", industry: getValidIndustry(journey?.Industry || ""), addressId: journey?.Address_ID || "" }); setIsEditingCustomer(true); }} isSaving={isSaving} />
                {!isEditingCustomer && <div title={customer?.id ? "Go to customer page" : "No associated customer"}><Button variant="secondary-outline" size="sm" onClick={customer?.id ? () => navigate(`/sales/companies/${customer?.id}`) : undefined} disabled={!customer?.id}><User size={16} /></Button></div>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2">
              <div>
                <div className="text-sm text-text-muted">Company</div>
                <div className="text-sm text-text">
                  {companyName || journey?.Target_Account || journey?.companyName || "-"}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-text-muted">Company ID</div>
                  {isEditingCustomer && (
                    <div title={companySearchMode ? "Switch to direct ID entry" : "Search by company name"}>
                      <Button
                        variant="secondary-outline"
                        size="sm"
                        onClick={toggleSearchMode}
                        className="!p-1 !h-6 !w-6"
                      >
                        <Search size={12} />
                      </Button>
                    </div>
                  )}
                </div>
                {isEditingCustomer ? (
                  <div className="relative" data-company-search>
                    {companySearchMode ? (
                      <>
                        <input
                          type="text"
                          className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                          value={companySearchQuery}
                          onChange={(e) => {
                            justSelectedCompany.current = false;
                            setCompanySearchQuery(e.target.value);
                          }}
                          placeholder="Search company by name..."
                        />
                        {isSearching && (
                          <div className="absolute right-2 top-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          </div>
                        )}
                        {showCompanyResults && companySearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-b shadow-lg max-h-60 overflow-y-auto">
                            {companySearchResults.map((company, index) => (
                              <div
                                key={company.Company_ID || index}
                                className="p-3 hover:bg-gray cursor-pointer border-b border-border last:border-b-0"
                                onClick={() => handleCompanySelect(company)}
                              >
                                <div className="font-medium text-sm text-text">
                                  {company.CustDlrName || "Unnamed Company"}
                                </div>
                                <div className="text-xs text-text-muted mt-1">
                                  ID: <span className="font-mono">{company.Company_ID}</span>
                                  {company.CreateDate && (
                                    <span className="ml-3">
                                      Created: {(() => {
                                        try {
                                          return formatDate(company.CreateDate);
                                        } catch {
                                          return company.CreateDate;
                                        }
                                      })()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-text-muted mt-1">
                          Selected ID: <span className="font-mono">{customerForm.companyId || "None"}</span>
                        </div>
                      </>
                    ) : (
                      <input
                        type="text"
                        className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text font-mono"
                        value={customerForm.companyId}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setCustomerForm(s => ({ ...s, companyId: value }));
                          }
                        }}
                        placeholder="Enter company ID directly..."
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-text font-mono">
                    {journey?.Company_ID || "-"}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-text-muted">Industry</div>
                {isEditingCustomer ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={customerForm.industry}
                    onChange={(e) => setCustomerForm(s => ({ ...s, industry: e.target.value }))}
                  >
                    <option value="">No Value Selected</option>
                    {VALID_INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {customer?.industry || journey?.Industry || "-"}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-text-muted">Address ID</div>
                {isEditingCustomer ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text font-mono"
                    value={customerForm.addressId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setCustomerForm(s => ({ ...s, addressId: value }));
                      }
                    }}
                    placeholder="Enter address ID..."
                  />
                ) : (
                  <div className="text-sm text-text font-mono">
                    {journey?.Address_ID || "-"}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-text-muted">Contacts ({journeyContacts.length})</div>
                  <Button
                    variant="secondary-outline"
                    size="sm"
                    onClick={() => setShowAddContactModal(true)}
                    disabled={isSaving}
                    className="flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </div>
                {journeyContacts.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {[...journeyContacts]
                      .sort((a, b) => Number(b.IsPrimary) - Number(a.IsPrimary))
                      .map((contact, index) => {
                        const isPrimary = Number(contact.IsPrimary) === 1;
                        return (
                      <div
                        key={contact.ID || `temp-${index}`}
                        className={`rounded border p-3 ${isPrimary ? 'bg-gray border-gray' : 'bg-surface'}`}
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-1">
                          <div className="flex-1 w-full sm:w-auto">
                            {editingContactId === contact.ID ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                                  value={contactForm.Contact_Name}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Name: e.target.value }))}
                                  placeholder="Contact Name"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveContact}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={handleCancelContactEdit}
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                <input
                                  type="text"
                                  className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-text"
                                  value={contactForm.Contact_Position}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Position: e.target.value }))}
                                  placeholder="Position"
                                />
                                <input
                                  type="email"
                                  className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-text"
                                  value={contactForm.Contact_Email}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Email: e.target.value }))}
                                  placeholder="Email"
                                />
                                <input
                                  type="text"
                                  className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-text"
                                  value={contactForm.Contact_Office}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Office: e.target.value }))}
                                  placeholder="Office Phone"
                                />
                                <input
                                  type="text"
                                  className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-text"
                                  value={contactForm.Contact_Mobile}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Mobile: e.target.value }))}
                                  placeholder="Mobile Phone"
                                />
                                <textarea
                                  className="w-full rounded border border-border px-2 py-1 text-xs bg-surface text-text resize-none"
                                  value={contactForm.Contact_Note}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Note: e.target.value }))}
                                  placeholder="Notes"
                                  rows={2}
                                />
                              </div>
                            ) : (
                              <>
                                <div className="text-sm text-text font-medium mb-1">
                                  {contact._isPrisma && contact.Contact_ID ? (
                                    <button
                                      onClick={() => navigate(`/sales/contacts/${contact.Contact_ID}`)}
                                      className="text-primary hover:underline cursor-pointer"
                                    >
                                      {contact.Contact_Name || "Unnamed Contact"}
                                    </button>
                                  ) : (
                                    <span>{contact.Contact_Name || "Unnamed Contact"}</span>
                                  )}
                                </div>
                                {contact.Contact_Position && (
                                  <div className="text-xs text-text-muted mb-1">
                                    {contact.Contact_Position}
                                  </div>
                                )}
                                {contact.Contact_Email && <div className="text-xs text-text-muted mb-1"><span className="font-bold">Email:</span> <a href={`mailto:${contact.Contact_Email}`} className="text-primary hover:underline">{contact.Contact_Email}</a></div>}
                                {contact.Contact_Office && <div className="text-xs text-text-muted mb-1"><span className="font-bold">Office:</span> {contact.Contact_Office}</div>}
                                {contact.Contact_Mobile && <div className="text-xs text-text-muted mb-1"><span className="font-bold">Mobile:</span> {contact.Contact_Mobile}</div>}
                                {contact.Contact_Note && (
                                  <div className="text-xs text-text-muted italic mt-2 p-2 bg-background rounded">
                                    {contact.Contact_Note}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {editingContactId !== contact.ID && (
                              <>
                                {isPrimary && <span className="text-xs bg-primary text-background px-2 py-1 rounded font-medium">Primary</span>}
                                {!contact.Contact_ID && !contact.Cont_Id && <span className="text-xs bg-primary text-background px-2 py-1 rounded font-medium" title="Some features will not function with this Contact as the legacy database needs to be updated">Legacy</span>}
                                <Button
                                  variant="secondary-outline"
                                  size="sm"
                                  onClick={() => handleEditContact(contact)}
                                  disabled={isSaving || editingContactId !== null}
                                  className="!p-1 !h-6 !w-6"
                                >
                                  <Edit size={12} />
                                </Button>
                                <Button
                                  variant="secondary-outline"
                                  size="sm"
                                  onClick={() => handleDeleteContact(contact)}
                                  disabled={isSaving || editingContactId !== null || !contact.ID}
                                  className="!p-1 !h-6 !w-6 border-red-300 hover:bg-red-50 hover:border-red-400"
                                >
                                  <Trash2 size={12} className="text-red-600" />
                                </Button>
                                <input
                                  type="radio"
                                  name="primaryContact"
                                  checked={isPrimary}
                                  onChange={() => handleSetPrimaryContact(contact.ID, contact.Jrn_ID)}
                                  disabled={isSaving || editingContactId !== null}
                                  className="text-primary focus:ring-primary"
                                  title="Make primary contact"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-sm text-text">No contacts found</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Journey Details</h2>
              <EditButtons isEditing={isEditingDetails} onSave={handleSaveDetails} onCancel={handleCancelDetails} onEdit={() => { setDetailsForm(createDetailsFormData(journey)); setIsEditingDetails(true); }} isSaving={isSaving} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
              <FormField label="Created"><div className="text-sm text-text">{formatDateSafe(journey?.CreateDT)}</div></FormField>

              <FormField label="Last Activity Date">
                <div className="text-sm text-text">
                  {lastActivityDate ? formatDateSafe(lastActivityDate) : "-"}
                </div>
              </FormField>

              <div>
                <div className="text-sm text-text-muted">Next Action Date</div>
                {isEditingDetails ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.lastActionDate || ""}
                    onChange={(e) =>
                      setDetailsForm((s) => ({
                        ...s,
                        lastActionDate: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {(() => {
                      try {
                        return journey?.Action_Date
                          ? formatDate(journey.Action_Date)
                          : journey?.updatedAt
                          ? formatDate(journey.updatedAt)
                          : "-";
                      } catch (error) {
                        return journey?.Action_Date || journey?.updatedAt || "-";
                      }
                    })()}
                  </div>
                )}
              </div>

              <FormField label="Journey Start Date">
                {isEditingDetails ? <input type="date" className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text" value={detailsForm.journeyStartDate} onChange={(e) => setDetailsForm((s) => ({ ...s, journeyStartDate: e.target.value }))} /> : <div className="text-sm text-text">{formatDateSafe(journey?.Journey_Start_Date)}</div>}
              </FormField>

              <FormField label="Quote Value">
                <div className="text-sm text-text">
                  {isLoadingQuoteValue ? "Loading..." : formatCurrency(quoteValue)}
                </div>
              </FormField>

              <div>
                <div className="text-sm text-text-muted">Journey Value</div>
                {isEditingDetails ? (
                  <input
                    type="number"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.value}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, value: e.target.value }))
                    }
                    min={0}
                  />
                ) : (
                  <div className="text-sm text-text">
                    {formatCurrency(
                      Number(journey?.Journey_Value ?? journey?.value ?? 0)
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Journey Type</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.type}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, type: e.target.value }))}
                  >
                    {VALID_JOURNEY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="Feature Upgrade">Feature Upgrade</option>
                    <option value="Retrofit">Retrofit</option>
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getValidJourneyType(journey?.Journey_Type || journey?.type)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Lead Source</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.source}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, source: e.target.value }))}
                  >
                    {VALID_LEAD_SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getValidLeadSource(journey?.Lead_Source || journey?.source)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Equipment Type</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.equipmentType}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, equipmentType: e.target.value }))
                    }
                  >
                    {VALID_EQUIPMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getValidEquipmentType(journey?.Equipment_Type)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">RSM</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.rsm}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, rsm: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {detailsForm.rsm && !availableRsms.find(r => r.initials === detailsForm.rsm) && (
                      <option key={detailsForm.rsm} value={detailsForm.rsm}>{detailsForm.rsm}</option>
                    )}
                    {availableRsms.map(rsm => (
                      <option key={rsm.initials} value={rsm.initials}>{rsm.name} ({rsm.initials})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">{getRsmDisplayName(journey?.RSM)}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">RSM Territory</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.rsmTerritory}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, rsmTerritory: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {/* Show current RSM Territory if it's not in the available list */}
                    {detailsForm.rsmTerritory && !availableRsms.find(r => r.initials === detailsForm.rsmTerritory) && (
                      <option key={detailsForm.rsmTerritory} value={detailsForm.rsmTerritory}>{detailsForm.rsmTerritory}</option>
                    )}
                    {availableRsms.map(rsm => (
                      <option key={rsm.initials} value={rsm.initials}>{rsm.name} ({rsm.initials})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">{getRsmDisplayName(journey?.RSM_Territory)}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">RSM Assist</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.rsmAssist}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, rsmAssist: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {detailsForm.rsmAssist && !availableRsms.find(r => r.initials === detailsForm.rsmAssist) && (
                      <option key={detailsForm.rsmAssist} value={detailsForm.rsmAssist}>{detailsForm.rsmAssist}</option>
                    )}
                    {availableRsms.map(rsm => (
                      <option key={rsm.initials} value={rsm.initials}>{rsm.name} ({rsm.initials})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">{getRsmDisplayName(journey?.RSM_Helped)}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Journey Stage</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.stage}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, stage: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {STAGES.map(stage => (
                      <option key={stage.id} value={stage.label}>{stage.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getStageLabel(journey)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Priority</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.priority}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, priority: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    <option value="A">A - Highest</option>
                    <option value="B">B - High</option>
                    <option value="C">C - Medium</option>
                    <option value="D">D - Lowest</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getPriorityColor(journey?.Priority || journey?.priority)} relative group cursor-help`}
                      title={`Priority: ${journey?.Priority || journey?.priority || 'None'} (${getPriorityLabel(journey?.Priority || journey?.priority)})`}
                    >
                      <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Priority: {journey?.Priority || journey?.priority || 'None'} ({getPriorityLabel(journey?.Priority || journey?.priority)})
                      </div>
                    </div>
                    <div className="text-sm text-text">
                      {journey?.Priority || journey?.priority || "-"} ({getPriorityLabel(journey?.Priority || journey?.priority)})
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Status</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.status}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, status: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {validJourneyStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Journey_Status || journey?.status || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Presentation Date</div>
                {isEditingDetails ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.presentationDate || ""}
                    onChange={(e) =>
                      setDetailsForm((s) => ({
                        ...s,
                        presentationDate: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {(() => {
                      try {
                        return detailsForm.presentationDate
                          ? formatDate(detailsForm.presentationDate)
                          : "-";
                      } catch (error) {
                        return detailsForm.presentationDate || "-";
                      }
                    })()}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Expected Decision Date</div>
                {isEditingDetails ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.expectedPoDate || ""}
                    onChange={(e) =>
                      setDetailsForm((s) => ({
                        ...s,
                        expectedPoDate: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {(() => {
                      try {
                        return detailsForm.expectedPoDate
                          ? formatDate(detailsForm.expectedPoDate)
                          : "-";
                      } catch (error) {
                        return detailsForm.expectedPoDate || "-";
                      }
                    })()}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Dealer</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.dealer}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, dealer: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {detailsForm.dealer && !VALID_DEALERS.includes(detailsForm.dealer) && (
                      <option key={detailsForm.dealer} value={detailsForm.dealer}>{detailsForm.dealer}</option>
                    )}
                    {VALID_DEALERS.map(dealer => (
                      <option key={dealer} value={dealer}>{dealer}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getValidDealer(journey?.Dealer ?? journey?.Dealer_Name ?? "") || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Dealer Contact</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.dealerContact}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, dealerContact: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {detailsForm.dealerContact && !VALID_DEALER_CONTACTS.includes(detailsForm.dealerContact) && (
                      <option key={detailsForm.dealerContact} value={detailsForm.dealerContact}>{detailsForm.dealerContact}</option>
                    )}
                    {VALID_DEALER_CONTACTS.map(contact => (
                      <option key={contact} value={contact}>{contact}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getValidDealerContact(journey?.Dealer_Contact ?? "") || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Confidence</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.confidence}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, confidence: e.target.value }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {VALID_CONFIDENCE_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Chance_To_Secure_order || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Reason Won</div>
                {isEditingDetails ? (
                  <select
                    className={`w-full rounded border border-border px-2 py-1 text-sm bg-background text-text ${
                      detailsForm.reasonLost ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    value={detailsForm.reasonWon}
                    disabled={!!detailsForm.reasonLost}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ 
                        ...s, 
                        reasonWon: e.target.value,
                        reasonLost: e.target.value ? "" : s.reasonLost
                      }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {VALID_REASON_WON.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Reason_Won || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Reason Lost</div>
                {isEditingDetails ? (
                  <select
                    className={`w-full rounded border border-border px-2 py-1 text-sm bg-background text-text ${
                      detailsForm.reasonWon ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    value={detailsForm.reasonLost}
                    disabled={!!detailsForm.reasonWon}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ 
                        ...s, 
                        reasonLost: e.target.value,
                        reasonWon: e.target.value ? "" : s.reasonWon
                      }))
                    }
                  >
                    <option value="">No Value Selected</option>
                    {VALID_REASON_LOST.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Reason_Lost || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Competition</div>
                {isEditingDetails ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.competition || ""}
                    onChange={(e) => {
                      setDetailsForm((s) => ({ ...s, competition: e.target.value }));
                    }}
                  >
                    <option value="">No Value Selected</option>
                    {COMPETITION_OPTIONS.filter(option => option !== "No Value Selected").map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Competition || "-"}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col max-h-[400px] md:max-h-[500px]">
            <h2 className="font-semibold text-text-muted text-sm mb-2">Notes</h2>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <textarea
                className="flex-1 p-2 bg-surface rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Enter a new note..."
                rows={2}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNote}
                disabled={isCreatingNote || !newNoteBody.trim()}
              >
                {isCreatingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
              {isLoadingNotes ? (
                <div className="text-sm text-text-muted text-center py-4">Loading notes...</div>
              ) : journeyNotes.length === 0 ? (
                <div className="text-sm text-text-muted text-center py-4">No notes yet</div>
              ) : (
                journeyNotes.map((note) => (
                  <div key={note.id} className="p-2 bg-surface rounded border border-border">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-2 bg-background rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editingNoteBody}
                          onChange={(e) => setEditingNoteBody(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveNote}
                            disabled={isSaving || !editingNoteBody.trim()}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={handleCancelEditNote}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-text">
                              {note.createdBy || "Unknown"}
                            </span>
                            <span className="text-xs text-text-muted">
                              Created: {note.createdAt ? new Date(note.createdAt).toLocaleString() : "N/A"}
                            </span>
                            {note.updatedAt && note.updatedAt !== note.createdAt && (
                              <span className="text-xs text-text-muted">
                                Updated: {new Date(note.updatedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary-outline"
                              size="sm"
                              onClick={() => handleEditNote(note)}
                              disabled={isSaving || editingNoteId !== null}
                              className="!p-1 !h-6 !w-6"
                            >
                              <Edit size={12} />
                            </Button>
                            <Button
                              variant="secondary-outline"
                              size="sm"
                              onClick={() => handleDeleteNote(note)}
                              disabled={isSaving || editingNoteId !== null}
                              className="!p-1 !h-6 !w-6 border-red-300 hover:bg-red-50 hover:border-red-400"
                            >
                              <Trash2 size={12} className="text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-text whitespace-pre-wrap">
                          {note.body || ""}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col max-h-[400px] md:max-h-[500px]">
            <h2 className="font-semibold text-text-muted text-sm mb-2">Next Steps</h2>

            <div className="flex flex-col gap-2 mb-3">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-muted">Next Action Date *</label>
                  <input
                    type="date"
                    className="rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={newNextStepDate}
                    onChange={(e) => setNewNextStepDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  className="flex-1 p-2 bg-surface rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  value={newNextStepBody}
                  onChange={(e) => setNewNextStepBody(e.target.value)}
                  placeholder="Enter a new next step..."
                  rows={2}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateNextStep}
                  disabled={isCreatingNextStep || !newNextStepBody.trim() || !newNextStepDate}
                  className="w-full sm:w-auto"
                >
                  {isCreatingNextStep ? "Adding..." : "Add Next Step"}
                </Button>
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
              {isLoadingNextSteps ? (
                <div className="text-sm text-text-muted text-center py-4">Loading next steps...</div>
              ) : journeyNextSteps.length === 0 ? (
                <div className="text-sm text-text-muted text-center py-4">No next steps yet</div>
              ) : (
                journeyNextSteps.map((nextStep) => (
                  <div key={nextStep.id} className="p-2 bg-surface rounded border border-border">
                    {editingNextStepId === nextStep.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-2 bg-background rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editingNextStepBody}
                          onChange={(e) => setEditingNextStepBody(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveNextStep}
                            disabled={isSaving || !editingNextStepBody.trim()}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={handleCancelEditNextStep}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-text">
                              {nextStep.createdBy || "Unknown"}
                            </span>
                            <span className="text-xs text-text-muted">
                              Created: {nextStep.createdAt ? new Date(nextStep.createdAt).toLocaleString() : "N/A"}
                            </span>
                            {nextStep.updatedAt && nextStep.updatedAt !== nextStep.createdAt && (
                              <span className="text-xs text-text-muted">
                                Updated: {new Date(nextStep.updatedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary-outline"
                              size="sm"
                              onClick={() => handleEditNextStep(nextStep)}
                              disabled={isSaving || editingNextStepId !== null}
                              className="!p-1 !h-6 !w-6"
                            >
                              <Edit size={12} />
                            </Button>
                            <Button
                              variant="secondary-outline"
                              size="sm"
                              onClick={() => handleDeleteNextStep(nextStep)}
                              disabled={isSaving || editingNextStepId !== null}
                              className="!p-1 !h-6 !w-6 border-red-300 hover:bg-red-50 hover:border-red-400"
                            >
                              <Trash2 size={12} className="text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-text whitespace-pre-wrap">
                          {nextStep.body || ""}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Visit Logging</h2>
              <div className="flex gap-2">
                {isEditingVisitLogging ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveVisitLogging}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleCancelVisitLogging}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary-outline"
                    size="sm"
                    onClick={() => {
                      setDetailsForm(createDetailsFormData(journey));
                      setIsEditingVisitLogging(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-text-muted mb-2">Visit Date</div>
                {isEditingVisitLogging ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.visitDate || ""}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, visitDate: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text p-2 bg-background rounded border">
                    {(() => {
                      try {
                        return journey?.Visit_Date ? formatDate(journey.Visit_Date) : "No visit date recorded";
                      } catch (error) {
                        return journey?.Visit_Date || "No visit date recorded";
                      }
                    })()}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted mb-2">Anticipated Visit Date</div>
                {isEditingVisitLogging ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.anticipatedVisitDate || ""}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, anticipatedVisitDate: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text p-2 bg-background rounded border">
                    {(() => {
                      try {
                        return journey?.Anticipated_Visit_Date ? formatDate(journey.Anticipated_Visit_Date) : "No anticipated visit date";
                      } catch (error) {
                        return journey?.Anticipated_Visit_Date || "No anticipated visit date";
                      }
                    })()}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted mb-2">Visit Outcome</div>
                {isEditingVisitLogging ? (
                  <textarea
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text resize-none"
                    value={detailsForm.visitOutcome || ""}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, visitOutcome: e.target.value }))
                    }
                    rows={4}
                    placeholder="Enter visit outcome details..."
                  />
                ) : (
                  <div className="text-sm text-text p-2 bg-background rounded border min-h-[80px] whitespace-pre-wrap">
                    {journey?.Visit_Outcome || "No visit outcome recorded"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onContactAdded={handleContactAdded}
        companyId={journey?.Company_ID}
        addressId={journey?.Address_ID}
        journeyId={journey?.ID || journey?.id}
        showPrimaryOption={true}
      />

      <Modal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        title={contactToDelete?._isPrisma ? "Remove Contact" : "Delete Contact"}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text">
            {contactToDelete?._isPrisma ? (
              <>Are you sure you want to remove the contact "{contactToDelete?.Contact_Name || 'Unnamed Contact'}" from this journey?</>
            ) : (
              <>Are you sure you want to delete the legacy contact "{contactToDelete?.Contact_Name || 'Unnamed Contact'}"?</>
            )}
          </p>
          <p className="text-text-muted text-sm">
            {contactToDelete?._isPrisma ? (
              <>This will unlink the contact from this journey. The contact itself will remain in the system.</>
            ) : (
              <>This is a legacy contact and will be permanently deleted due to no way of unlinking. This action cannot be undone.</>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={() => setContactToDelete(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmDeleteContact}
              disabled={isSaving}
              className="!bg-red-400 !border-red-400 hover:!bg-red-500 hover:!border-red-500"
            >
              {isSaving
                ? (contactToDelete?._isPrisma ? "Removing..." : "Deleting...")
                : (contactToDelete?._isPrisma ? "Remove Contact" : "Delete Contact")
              }
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        title="Delete Note"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text">
            Are you sure you want to delete this note?
          </p>
          <p className="text-text-muted text-sm">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={() => setNoteToDelete(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmDeleteNote}
              disabled={isSaving}
              className="!bg-red-400 !border-red-400 hover:!bg-red-500 hover:!border-red-500"
            >
              {isSaving ? "Deleting..." : "Delete Note"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!nextStepToDelete}
        onClose={() => setNextStepToDelete(null)}
        title="Delete Next Step"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text">
            Are you sure you want to delete this next step?
          </p>
          <p className="text-text-muted text-sm">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={() => setNextStepToDelete(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmDeleteNextStep}
              disabled={isSaving}
              className="!bg-red-400 !border-red-400 hover:!bg-red-500 hover:!border-red-500"
            >
              {isSaving ? "Deleting..." : "Delete Next Step"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function JourneyQuotesTab({ journey, updateJourney, employee }: { journey: any | null; updateJourney: (updates: Record<string, any>) => void; employee: any }) {
  const [isEditingQuotes, setIsEditingQuotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quoteValue, setQuoteValue] = useState<number>(0);
  const [quoteLineItems, setQuoteLineItems] = useState<Array<{ lineItem: string; description: string; price: number }>>([]);
  const [isLoadingQuoteValue, setIsLoadingQuoteValue] = useState(false);
  const api = useApi();

  const createQuoteFormData = (journey: any) => ({
    quoteNumber: journey?.Quote_Number?.trim() || "",
    quoteType: journey?.Quote_Type || "Standard more than 6 months",
    presentationMethod: journey?.Presentation_Method || "",
    presentationDate: extractDateOnly(journey?.Quote_Presentation_Date),
    expectedDecisionDate: extractDateOnly(journey?.Expected_Decision_Date),
  });

  const [quoteForm, setQuoteForm] = useState(createQuoteFormData(journey));

  useEffect(() => {
    if (journey && !isEditingQuotes) {
      setQuoteForm(createQuoteFormData(journey));
    }
  }, [journey, isEditingQuotes]);

  useEffect(() => {
    const fetchQuoteValue = async () => {
      if (!journey?.Quote_Key_Value) {
        setQuoteValue(0);
        setQuoteLineItems([]);
        return;
      }
      setIsLoadingQuoteValue(true);
      try {
        const result = await api.get('/legacy/quote-value', {
          quoteKeyValue: journey.Quote_Key_Value
        });
        if (result && typeof result.quoteValue === 'number') {
          setQuoteValue(result.quoteValue);
          setQuoteLineItems(result.lineItems || []);
        } else {
          setQuoteValue(0);
          setQuoteLineItems([]);
        }
      } catch (error) {
        setQuoteValue(0);
        setQuoteLineItems([]);
      } finally {
        setIsLoadingQuoteValue(false);
      }
    };
    fetchQuoteValue();
  }, [journey?.Quote_Key_Value]);


  const handleSaveQuotes = async () => {
    const originalUpdates = { Quote_Number: quoteForm.quoteNumber, Quote_Type: quoteForm.quoteType, Presentation_Method: quoteForm.presentationMethod, Quote_Presentation_Date: quoteForm.presentationDate, Expected_Decision_Date: quoteForm.expectedDecisionDate };
    const rawUpdates = { Quote_Number: quoteForm.quoteNumber, Quote_Type: quoteForm.quoteType, Presentation_Method: quoteForm.presentationMethod, Quote_Presentation_Date: formatDateForDatabase(quoteForm.presentationDate), Expected_Decision_Date: formatDateForDatabase(quoteForm.expectedDecisionDate) };
    const updates = Object.fromEntries(Object.entries(rawUpdates).filter(([_, value]) => value !== ""));
    const success = await saveJourneyUpdates(api, journey, updates, originalUpdates, employee, setIsSaving);
    if (success) { setIsEditingQuotes(false); updateJourney(rawUpdates); }
  };

  const handleCancelQuotes = () => {
    setQuoteForm(createQuoteFormData(journey));
    setIsEditingQuotes(false);
  };

  if (!journey) return null;

  return (
    <div className="flex flex-1 flex-col p-2 md:p-4 gap-4 md:gap-6">
      {/* Quote Overview */}
      <div className="bg-foreground rounded shadow-sm border p-2 md:p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Quote Overview</h3>
          <EditButtons isEditing={isEditingQuotes} onSave={handleSaveQuotes} onCancel={handleCancelQuotes} onEdit={() => { setQuoteForm(createQuoteFormData(journey)); setIsEditingQuotes(true); }} isSaving={isSaving} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Quote Number</div>
            {isEditingQuotes ? (
              <input
                type="text"
                className="w-full rounded border border-border px-2 py-1 text-lg font-semibold text-text font-mono bg-background"
                value={quoteForm.quoteNumber}
                onChange={(e) => setQuoteForm(s => ({ ...s, quoteNumber: e.target.value }))}
                placeholder="Enter quote number"
              />
            ) : (
              <div className="text-lg font-semibold text-text font-mono">
                {journey?.Quote_Number?.trim() || "No Quote Number"}
              </div>
            )}
          </div>
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Quote Value</div>
            <div className="text-lg font-semibold text-primary">
              {isLoadingQuoteValue ? "Loading..." : formatCurrency(quoteValue)}
            </div>
            <div className="text-xs text-text-muted mt-1">From quote system</div>
          </div>
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Success Probability</div>
            <div className="text-lg font-semibold text-text">
              {journey?.Chance_To_Secure_order ? `${journey.Chance_To_Secure_order}` : "Not specified"}
            </div>
            <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
          </div>
        </div>

        {quoteLineItems.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm md:text-md font-semibold text-text mb-3">Line Items</h4>
            <div className="bg-background rounded border overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-semibold text-text">Line Item</th>
                    <th className="text-left px-4 py-2 text-sm font-semibold text-text">Description</th>
                    <th className="text-right px-4 py-2 text-sm font-semibold text-text">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteLineItems.map((item, index) => (
                    <tr key={index} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2 text-sm text-text">{item.lineItem}</td>
                      <td className="px-4 py-2 text-sm text-text">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-text text-right font-mono">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface font-semibold">
                    <td className="px-4 py-3 text-sm text-text" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-sm text-primary text-right font-mono">{formatCurrency(quoteValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-foreground rounded shadow-sm border p-2 md:p-4">
          <h3 className="text-base md:text-lg font-semibold text-text mb-4">Quote Details</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-muted mb-1">Quote Type</div>
              {isEditingQuotes ? (
                <select
                  className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                  value={quoteForm.quoteType}
                  onChange={(e) => setQuoteForm(s => ({ ...s, quoteType: e.target.value }))}
                >
                  {VALID_QUOTE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="Custom">Custom</option>
                  <option value="Retrofit">Retrofit</option>
                  <option value="Service">Service</option>
                </select>
              ) : (
                <div className="text-sm text-text">{journey?.Quote_Type || "Standard more than 6 months"}</div>
              )}
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">Quote Delivery Method</div>
              {isEditingQuotes ? (
                <select
                  className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                  value={quoteForm.presentationMethod}
                  onChange={(e) => setQuoteForm(s => ({ ...s, presentationMethod: e.target.value }))}
                >
                  <option value="">Select delivery method</option>
                  {VALID_PRESENTATION_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                  <option value="Mail">Mail</option>
                </select>
              ) : (
                <div className="text-sm text-text">{journey?.Presentation_Method || "Not specified"}</div>
              )}
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">Equipment Type</div>
              <div className="text-sm text-text">{journey?.Equipment_Type?.trim() || "Standard"}</div>
              <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">Quantity of Items</div>
              <div className="text-sm text-text">
                {journey?.Qty_of_Items != null && journey?.Qty_of_Items !== "" ? journey.Qty_of_Items : "Not specified"}
              </div>
              <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">RSM</div>
              <div className="text-sm text-text">{journey?.RSM?.trim() || "Not assigned"}</div>
              <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">Territory</div>
              <div className="text-sm text-text">{journey?.RSM_Territory?.trim() || "Not specified"}</div>
              <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
            </div>
          </div>
        </div>

        <div className="bg-foreground rounded shadow-sm border p-2 md:p-4">
          <h3 className="text-base md:text-lg font-semibold text-text mb-4">Timeline & Dates</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm text-text-muted">Quote Presentation Date</div>
              </div>
              {isEditingQuotes ? <input type="date" className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text ml-5" value={quoteForm.presentationDate || ""} onChange={(e) => setQuoteForm(s => ({ ...s, presentationDate: e.target.value }))} /> : <div className="text-text ml-5">{journey?.Quote_Presentation_Date ? formatDate(journey.Quote_Presentation_Date) : "Not scheduled"}</div>}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm text-text-muted">Expected Decision Date</div>
              </div>
              {isEditingQuotes ? (
                <input
                  type="date"
                  className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text ml-5"
                  value={quoteForm.expectedDecisionDate || ""}
                  onChange={(e) => setQuoteForm(s => ({ ...s, expectedDecisionDate: e.target.value }))}
                />
              ) : (
                <div className="text-text ml-5">
                  {journey?.Expected_Decision_Date ? formatDate(journey.Expected_Decision_Date) : "Not specified"}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm text-text-muted">Journey Created</div>
              </div>
              <div className="text-text ml-5">
                {journey?.CreateDT ? formatDate(journey.CreateDT) : "Not available"}
              </div>
              <div className="text-xs text-text-muted ml-5 mt-1">Read-only system field</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm text-text-muted">Action Date</div>
              </div>
              <div className="text-text ml-5">
                {formatDateSafe(journey?.Action_Date) !== "-" ? formatDateSafe(journey?.Action_Date) : "Not available"}
              </div>
              <div className="text-xs text-text-muted ml-5 mt-1">Edit in Details tab</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Quote Information */}
      <div className="bg-foreground rounded shadow-sm border p-2 md:p-4">
        <h3 className="text-base md:text-lg font-semibold text-text mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-text-muted mb-2">Industry</div>
            <div className="text-text">{journey?.Industry || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Lead Source</div>
            <div className="text-text">{journey?.Lead_Source || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Journey Type</div>
            <div className="text-text">{journey?.Journey_Type || journey?.type || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Current Stage</div>
            <div className="text-text">{getStageLabel(journey)}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Dealer</div>
            <div className="text-text">{journey?.Dealer?.trim() || journey?.Dealer_Name?.trim() || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Competition</div>
            <div className="text-text">{journey?.Competition || "Not specified"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyHistoryTab({ journey }: { journey: any | null }) {
  const [logRecords, setLogRecords] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { get } = useApi();

  useEffect(() => {
    const fetchLogRecords = async () => {
      const journeyId = journey?.ID || journey?.id;
      if (!journeyId) return;
      
      setLoadingLogs(true);
      try {
        const logData = await get(`/legacy/std/Journey_Log/filter/custom`, {
          filterField: 'Jrn_ID',
          filterValue: journeyId,
          sort: 'CreateDtTm',
          order: 'desc'
        });
        
        if (Array.isArray(logData)) {
          setLogRecords(logData);
        }
      } catch (error) {
        console.error("Error fetching journey log records:", error);
        setLogRecords([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogRecords();
  }, [journey?.ID, journey?.id]);

  const formatLogData = (logs: any[]) => {
    return logs.map(log => ({
      id: log.ID,
      created: log.CreateDtTm,
      user: log.CreateInit || '-',
      action: log.Action || '-'
    }));
  };

  return (
    <div className="flex flex-1 flex-col p-2 md:p-4">
      <div className="bg-foreground rounded shadow-sm border p-2 flex-1 overflow-x-auto">
        <div className="text-xs font-bold text-text-muted mb-1">
          Log Records {loadingLogs && <span className="text-text-muted">(Loading...)</span>}
        </div>
        <Table
          columns={[
            { 
              key: "created", 
              header: "Created", 
              className: "text-xs",
              render: (value: string) => (
                <div className="text-xs text-text">
                  {value ? formatDate(value) : '-'}
                </div>
              )
            },
            { 
              key: "user", 
              header: "User", 
              className: "text-xs",
              render: (value: string) => (
                <div className="text-xs text-text">{value}</div>
              )
            },
            { 
              key: "action", 
              header: "Action", 
              className: "text-xs",
              render: (value: string) => (
                <div className="text-xs text-text leading-tight">
                  <div className="whitespace-pre-wrap">{value}</div>
                </div>
              )
            },
          ]}
          data={formatLogData(logRecords)}
          total={logRecords.length}
          idField="id"
        />
      </div>
    </div>
  );
}

function JourneyTagsTab({ journey, employee }: { journey: any | null; employee: any }) {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const api = useApi();

  useEffect(() => {
    const fetchTags = async () => {
      if (!journey?.ID && !journey?.id) return;
      
      setIsLoading(true);
      try {
        const journeyId = journey.ID || journey.id;
        const tagData = await api.get('/core/tags', {
          filter: JSON.stringify({
            parentTable: 'journeys',
            parentId: journeyId
          })
        });
        
        if (tagData?.success && Array.isArray(tagData.data)) {
          setTags(tagData.data);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
        setTags([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [journey?.ID, journey?.id]);

  const handleAddTag = async () => {
    if (!newTagInput.trim() || !journey?.ID && !journey?.id) return;
    
    setIsSaving(true);
    try {
      const journeyId = journey.ID || journey.id;
      const tagDescription = newTagInput.trim().toUpperCase();
      
      const newTag = await api.post('/core/tags', {
        description: tagDescription,
        parentTable: 'journeys',
        parentId: journeyId,
        createdBy: `${employee?.firstName} ${employee?.lastName}`
      });
      
      if (newTag?.success && newTag.data) {
        setTags(prev => [...prev, newTag.data]);
        setNewTagInput("");
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setIsSaving(true);
    try {
      const result = await api.delete(`/core/tags/${tagId}`);
      
      if (result !== null) {
        setTags(prev => prev.filter(tag => tag.id !== tagId));
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  if (!journey) return null;

  return (
    <div className="flex flex-1 flex-col p-2 md:p-4">
      <div className="bg-foreground rounded shadow-sm border p-2 md:p-4">
        <h3 className="text-base md:text-lg font-semibold text-text mb-4">Journey Tags</h3>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="flex-1 rounded border border-border px-3 py-2 text-sm bg-background text-text w-full"
              placeholder="Enter tag name..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSaving}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddTag}
              disabled={!newTagInput.trim() || isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? "Adding..." : "Add Tag"}
            </Button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-text-muted">Loading tags...</div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm"
                  >
                    <span>{tag.description}</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={isSaving}
                      className="hover:bg-red-600 rounded-full p-1 transition-colors"
                      title="Remove tag"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-muted">No tags added to this journey yet.</div>
            )}
          </div>

          <div className="text-xs text-text-muted mt-4">
            Tags are automatically converted to uppercase and help categorize and organize journeys.
          </div>
        </div>
      </div>
    </div>
  );
}

const JourneyDetailsPage = () => {
  const [activeTab, setActiveTab] = useState("details");
  const { id: journeyId } = useParams<{ id: string }>();

  const [journeyData, setJourneyData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [journeyContacts, setJourneyContacts] = useState<any[]>([]);
  const [validJourneyStatuses, setValidJourneyStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedJourneyId, setCopiedJourneyId] = useState(false);
  const api = useApi();
  const { employee } = useAuth();

  const adaptLegacyJourney = (raw: any) => {
    const normalizeDate = (d: any) => {
      if (!d) return undefined;
      const s = String(d);

      if (s.startsWith("0000-00-00") || s === "0000-00-00") return undefined;

      let normalized = s;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        normalized = `${s}T00:00:00`;
      } else if (s.includes(" ")) {
        normalized = s.replace(" ", "T");
      }

      const testDate = new Date(normalized);
      if (isNaN(testDate.getTime())) return undefined;

      return normalized;
    };
    const normalizePriority = (v: any): string => {
      const s = String(v ?? "").toUpperCase().trim();
      if (["A", "B", "C", "D"].includes(s)) return s;
      if (s.startsWith("H")) return "A";
      if (s.startsWith("L")) return "D";
      return "C";
    };
    return {
      id: raw.ID,
      name: raw.Project_Name?.trim() || raw.Target_Account || `Journey ${raw.ID}`,
      stage: mapLegacyStageToId(raw.Journey_Stage),
      value: Number(raw.Journey_Value ?? 0),
      priority: normalizePriority(raw.Priority),
      expectedDecisionDate: normalizeDate(raw.Expected_Decision_Date) ?? normalizeDate(raw.Quote_Presentation_Date) ?? normalizeDate(raw.Date_PO_Received) ?? normalizeDate(raw.Journey_Start_Date) ?? normalizeDate(raw.CreateDT) ?? new Date().toISOString(),
      updatedAt: normalizeDate(raw.Action_Date) ?? normalizeDate(raw.CreateDT) ?? undefined,
      customerId: String(raw.Company_ID ?? ""),
      companyName: raw.Target_Account,
      ...raw
    };
  };

  const fetchJourneyData = async () => {
    if (!journeyId) return;
    setLoading(true);
    setError(null);
    try {
      const rawJourney = await api.get(`/legacy/base/Journey/${journeyId}`);
      if (rawJourney !== null) {
        const adaptedJourney = adaptLegacyJourney(rawJourney);
        setJourneyData(adaptedJourney);
        if (rawJourney.Company_ID) {
          try {
            const customerRaw = await api.get(`/legacy/base/Company/${rawJourney.Company_ID}`);
            if (customerRaw !== null) {
              setCustomerData({ id: customerRaw.Company_ID, name: customerRaw.Company_Name || adaptedJourney.companyName, industry: customerRaw.Industry, contact: customerRaw.Contact_Name, email: customerRaw.Email, phone: customerRaw.Phone });
            }
          } catch (customerError) {
            console.warn("Could not fetch customer data:", customerError);
            setCustomerData({ id: rawJourney.Company_ID, name: adaptedJourney.companyName });
          }
        }
        try {
          const [legacyContacts, prismaContacts] = await Promise.all([
            api.get('/legacy/std/Journey_Contact/filter/custom', {
              filterField: 'Jrn_ID',
              filterValue: journeyId
            }).catch(err => {
              console.error('Error fetching legacy contacts:', err);
              return [];
            }),
            api.get('/sales/journey-contacts', {
              filter: JSON.stringify({ journeyId }),
              include: JSON.stringify({ contact: true })
            }).then(result => {
              const contacts = result?.success && Array.isArray(result.data) ? result.data : [];
              return contacts.map((jc: any) => ({
                ID: jc.id,
                Jrn_ID: jc.journeyId,
                Contact_ID: jc.contactId,
                Contact_Name: jc.contact ? `${jc.contact.firstName} ${jc.contact.lastName}`.trim() : '',
                Contact_Position: jc.contact?.title || '',
                Contact_Email: jc.contact?.email || '',
                Contact_Office: jc.contact?.phone || '',
                Contact_Mobile: jc.contact?.phoneExtension || '',
                Contact_Note: '',
                IsPrimary: jc.isPrimary ? 1 : 0,
                _isPrisma: true
              }));
            }).catch(err => {
              console.error('Error fetching prisma contacts:', err);
              return [];
            })
          ]);

          const legacyArray = Array.isArray(legacyContacts) ? legacyContacts : [];
          const mergedContacts = [...legacyArray, ...prismaContacts];

          setJourneyContacts(mergedContacts);
        } catch (contactError) {
          console.warn("Could not fetch journey contacts:", contactError);
          setJourneyContacts([]);
        }
      } else {
        setError('Failed to load journey data');
      }
    } catch (err) {
      setError(`Error loading journey: ${err}`);
    } finally {
      setLoading(false);
    }
  };


  const updateJourney = (updates: Record<string, any>) => setJourneyData((prev: any) => ({ ...prev, ...updates }));

  const handleCopyJourneyId = () => {
    const id = journeyData?.ID || journeyData?.id;
    if (id) {
      navigator.clipboard.writeText(String(id));
      setCopiedJourneyId(true);
      setTimeout(() => setCopiedJourneyId(false), 2000);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, [journeyId]);

  useEffect(() => {
    (async () => {
      const statuses = await fetchDemographicCategory(api, 'Journey_status');
      if (statuses.length > 0) {
        setValidJourneyStatuses(statuses);
      }
    })();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64">Loading journey details...</div>;
  if (error) return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  if (!journeyId) return <div className="w-full flex flex-1 flex-col"><PageHeader title="Invalid Journey" description="No journey ID provided in the URL." goBack /></div>;
  if (!journeyData) return <div className="w-full flex flex-1 flex-col"><PageHeader title="Journey not found" description="This journey may have been removed or is unavailable." goBack /></div>;

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={journeyData?.name || journeyData?.Project_Name || journeyData?.Target_Account || "Coe Press Equipment"}
        description="View and manage journey details"
        goBack
      />
      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Details", value: "details" },
          { label: "Quote Info", value: "quotes" },
          { label: "History", value: "history" },
          { label: "Tags", value: "tags" },
        ]}
      />
      {activeTab === "details" && <JourneyDetailsTab journey={journeyData ? { ...journeyData, customer: customerData } : null} journeyContacts={journeyContacts} updateJourney={updateJourney} setJourneyContacts={setJourneyContacts} employee={employee} validJourneyStatuses={validJourneyStatuses} />}
      {activeTab === "quotes" && <JourneyQuotesTab journey={journeyData} updateJourney={updateJourney} employee={employee} />}
      {activeTab === "history" && <JourneyHistoryTab journey={journeyData} />}
      {activeTab === "tags" && <JourneyTagsTab journey={journeyData} employee={employee} />}

      <div className="px-2 md:px-4 py-2 border-t border-border bg-foreground">
        <div className="text-xs text-text-muted flex flex-wrap items-center gap-1">
          <span>Journey ID:</span>
          <span
            onClick={handleCopyJourneyId}
            className="font-mono text-text bg-surface px-2 py-1 rounded border border-border cursor-pointer hover:bg-gray transition-colors"
            title="Click to copy"
          >
            {journeyData?.ID || journeyData?.id}
          </span>
          <span className="text-text-muted italic">
            {copiedJourneyId ? "Copied!" : "(click to copy)"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetailsPage;