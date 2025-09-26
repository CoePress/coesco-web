import { useState, useEffect, useRef } from "react";
import { PageHeader, Tabs, Table, Button, Modal } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { STAGES, VALID_JOURNEY_STATUS } from "./journeys/constants";
import { formatDateForDatabase, getValidEquipmentType, getValidLeadSource, getValidJourneyType, getValidDealer, getValidDealerContact, getValidIndustry } from "./journeys/utils";
import { COMPETITION_OPTIONS } from "./journeys/types";

type StageId = (typeof STAGES)[number]["id"];

const mapLegacyStageToId = (stage: any): StageId => {
  const s = String(stage ?? "").toLowerCase();
  if (!s) return 1;
  if (s.includes("qualify") || s.includes("pain") || s.includes("discover")) return 2;
  if (s.includes("present") || s.includes("demo") || s.includes("proposal") || s.includes("quote")) return 3;
  if (s.includes("negot")) return 4;
  if (s.includes("po") || s.includes("won") || s.includes("closedwon") || s.includes("closed won") || s.includes("order")) return 5;
  if (s.includes("lost") || s.includes("closedlost") || s.includes("closed lost") || s.includes("declin")) return 6;
  if (s.includes("lead") || s.includes("open") || s.includes("new")) return 1;
  return 1;
};

const stageLabel = (id?: number) =>
  STAGES.find(s => s.id === Number(id))?.label ?? `Stage ${id ?? ""}`;

const getStageLabel = (journey: any) => {
  if (typeof journey?.stage === 'number') {
    return stageLabel(journey.stage);
  }
  
  if (journey?.Journey_Stage) {
    const mappedStageId = mapLegacyStageToId(journey.Journey_Stage);
    return stageLabel(mappedStageId);
  }
  
  if (journey?.stage) {
    const mappedStageId = mapLegacyStageToId(journey.stage);
    return stageLabel(mappedStageId);
  }
  
  return "-";
};

const getPriorityLabel = (priority: string) => {
  const p = String(priority ?? "").toUpperCase();
  switch (p) {
    case "A":
      return "Highest";
    case "B":
      return "High";
    case "C":
      return "Medium";
    case "D":
      return "Lowest";
    default:
      return "Medium";
  }
};

const getPriorityColor = (priority: string) => {
  const p = String(priority ?? "").toUpperCase();
  switch (p) {
    case "A":
      return "bg-red-500"; // Highest priority - red
    case "B":
      return "bg-orange-500"; // High priority - orange
    case "C":
      return "bg-yellow-500"; // Medium priority - yellow
    case "D":
      return "bg-green-500"; // Lowest priority - green
    default:
      return "bg-gray-400"; // No priority - gray
  }
};
import { Edit, Plus, User, Trash2, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { DeleteJourneyModal } from "@/components/modals/delete-journey-modal";
import { AddJourneyContactModal } from "@/components";

function JourneyDetailsTab({ journey, journeyContacts, updateJourney, setJourneyContacts, employee }: { journey: any | null; journeyContacts: any[]; updateJourney: (updates: Record<string, any>) => void; setJourneyContacts: React.Dispatch<React.SetStateAction<any[]>>; employee: any }) {
  const [availableRsms, setAvailableRsms] = useState<string[]>([]);
  const rsmApi = useApi(); // Separate API instance for RSM fetching

  const getValidRSM = (value: string) => {
    if (!value) return "";
    const normalized = availableRsms.find(rsm => 
      rsm.toLowerCase() === value.toLowerCase()
    );
    return normalized || value; // Keep original value if not found in list
  };

  const createDetailsFormData = (journey: any) => ({
    type: getValidJourneyType(journey?.Journey_Type ?? journey?.type),
    source: getValidLeadSource(journey?.Lead_Source ?? journey?.source),
    equipmentType: getValidEquipmentType(journey?.Equipment_Type),
    rsm: getValidRSM(journey?.RSM),
    rsmTerritory: journey?.RSM_Territory ?? "",
    qtyItems: journey?.Qty_of_Items ?? "",
    value: journey?.Journey_Value ?? journey?.value ?? "",
    dealer: getValidDealer(journey?.Dealer ?? journey?.Dealer_Name ?? ""),
    dealerContact: getValidDealerContact(journey?.Dealer_Contact ?? ""),
    journeyStartDate: journey?.Journey_Start_Date ? journey.Journey_Start_Date.split(' ')[0] : "",
    stage: journey?.Journey_Stage ?? journey?.stage ?? "",
    priority: journey?.Priority ?? journey?.priority ?? "",
    status: journey?.Journey_Status ?? journey?.status ?? "",
    presentationDate: journey?.Quote_Presentation_Date ? journey.Quote_Presentation_Date.split(' ')[0] : "",
    expectedPoDate: journey?.Expected_Decision_Date ? journey.Expected_Decision_Date.split(' ')[0] : "",
    lastActionDate: journey?.Action_Date ? journey.Action_Date.split(' ')[0] : (journey?.updatedAt ? journey.updatedAt.split(' ')[0] : ""),
    confidence: journey?.Chance_To_Secure_order ?? "",
    reasonWon: journey?.Reason_Won ?? "",
    reasonLost: journey?.Reason_Lost ?? "",
    reasonWonLost: journey?.Reason_Won_Lost ?? "",
    competition: journey?.Competition ?? "",
    visitOutcome: journey?.Visit_Outcome ?? "",
    visitDate: journey?.Visit_Date ? journey.Visit_Date.split(' ')[0] : "",
    anticipatedVisitDate: journey?.Anticipated_Visit_Date ? journey.Anticipated_Visit_Date.split(' ')[0] : "",
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState(createDetailsFormData(journey));

  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    companyId: journey?.Company_ID || "",
    industry: getValidIndustry(journey?.Industry || ""),
  });
  const [companySearchMode, setCompanySearchMode] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const [companyName, setCompanyName] = useState(journey?.Target_Account || journey?.companyName || "");
  const lastFetchedCompanyId = useRef<string>("");
  const justSelectedCompany = useRef<boolean>(false);

  const [notes, setNotes] = useState(journey?.Notes ?? journey?.notes ?? "");
  const [nextSteps, setNextSteps] = useState(journey?.Next_Steps ?? "");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showNextStepsSavePrompt, setShowNextStepsSavePrompt] = useState(false);
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

  const [showAddJourneyContactModal, setShowAddJourneyContactModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  const api = useApi();

  useEffect(() => {
    if (journey) {
      if (!isEditingDetails) {
        setDetailsForm(createDetailsFormData(journey));
      }
      
      if (!isEditingCustomer) {
        setCustomerForm({
          companyId: journey?.Company_ID || "",
          industry: getValidIndustry(journey?.Industry || ""),
        });
        setCompanyName(journey?.Target_Account || journey?.companyName || "");
        lastFetchedCompanyId.current = journey?.Company_ID || "";
      }
      
      if (!showSavePrompt) {
        setNotes(journey?.Notes ?? journey?.notes ?? "");
      }
      
      if (!showNextStepsSavePrompt) {
        setNextSteps(journey?.Next_Steps ?? "");
      }
    }
  }, [journey, isEditingDetails, isEditingCustomer, showSavePrompt, showNextStepsSavePrompt]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rsmData = await rsmApi.get('/legacy/std/Demographic/filter/custom', {
          filterField: 'Category',
          filterValue: 'RSM'
        });
        
        if (!cancelled && Array.isArray(rsmData)) {
          const rsmValues = rsmData.map(item => item.Name || item.Value || item.Description).filter(Boolean);
          setAvailableRsms(rsmValues);
        }
      } catch (error) {
        console.error("Error fetching RSM data:", error);
        setAvailableRsms([]);
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

  const logJourneyChanges = async (journeyId: string, oldData: any, newData: Record<string, any>, originalUpdates: Record<string, any>) => {
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
          if (toValue.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(toValue)) {
            toValue = toValue;
          }
        }
        
        const changeEntry = `${field}: FROM ${fromValue} TO ${toValue}`;
        changes.push(changeEntry);
      }
    }

    if (changes.length > 0) {
      const actionText = changes.join('; ');
      
      try {
        await api.post('/legacy/std/Journey_Log', {
          Jrn_ID: journeyId,
          Action: actionText,
          CreateDtTm: new Date().toISOString().replace('T', ' ').substring(0, 23),
          CreateInit: employee.initials
        });
      } catch (error) {
        console.error('Error logging journey changes:', error);
      }
    }
  };

  const saveJourneyUpdates = async (updates: Record<string, any>, originalUpdates?: Record<string, any>) => {
    if (!journey?.ID && !journey?.id) return false;
    
    setIsSaving(true);
    try {
      const journeyId = journey.ID || journey.id;
      
      await logJourneyChanges(journeyId, journey, updates, originalUpdates || updates);
      
      const result = await api.patch(`/legacy/base/Journey/${journeyId}`, updates);
      
      return result !== null;
    } catch (error) {
      console.error("Error updating journey:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetails = async () => {
    const originalUpdates = {
      Journey_Type: detailsForm.type,
      Lead_Source: detailsForm.source,
      Equipment_Type: detailsForm.equipmentType,
      RSM: detailsForm.rsm,
      RSM_Territory: detailsForm.rsmTerritory,
      Qty_of_Items: detailsForm.qtyItems,
      Journey_Value: detailsForm.value,
      Dealer: detailsForm.dealer,
      Dealer_Contact: detailsForm.dealerContact,
      Journey_Start_Date: detailsForm.journeyStartDate,
      Journey_Stage: detailsForm.stage,
      Priority: detailsForm.priority,
      Journey_Status: detailsForm.status,
      Quote_Presentation_Date: detailsForm.presentationDate,
      Expected_Decision_Date: detailsForm.expectedPoDate,
      Action_Date: detailsForm.lastActionDate,
      Chance_To_Secure_order: detailsForm.confidence,
      Reason_Won: detailsForm.reasonWon,
      Reason_Lost: detailsForm.reasonLost,
      Reason_Won_Lost: detailsForm.reasonWon || detailsForm.reasonLost,
      Competition: detailsForm.competition,
      Visit_Outcome: detailsForm.visitOutcome,
      Visit_Date: detailsForm.visitDate,
      Anticipated_Visit_Date: detailsForm.anticipatedVisitDate,
    };

    const rawUpdates = {
      Journey_Type: detailsForm.type,
      Lead_Source: detailsForm.source,
      Equipment_Type: detailsForm.equipmentType,
      RSM: detailsForm.rsm,
      RSM_Territory: detailsForm.rsmTerritory,
      Qty_of_Items: detailsForm.qtyItems,
      Journey_Value: detailsForm.value,
      Dealer: detailsForm.dealer,
      Dealer_Contact: detailsForm.dealerContact,
      Journey_Start_Date: formatDateForDatabase(detailsForm.journeyStartDate),
      Journey_Stage: detailsForm.stage,
      Priority: detailsForm.priority,
      Journey_Status: detailsForm.status,
      Quote_Presentation_Date: formatDateForDatabase(detailsForm.presentationDate),
      Expected_Decision_Date: formatDateForDatabase(detailsForm.expectedPoDate),
      Action_Date: formatDateForDatabase(detailsForm.lastActionDate),
      Chance_To_Secure_order: detailsForm.confidence,
      Reason_Won: detailsForm.reasonWon,
      Reason_Lost: detailsForm.reasonLost,
      Reason_Won_Lost: detailsForm.reasonWon || detailsForm.reasonLost,
      Competition: detailsForm.competition,
      Visit_Outcome: detailsForm.visitOutcome,
      Visit_Date: formatDateForDatabase(detailsForm.visitDate),
      Anticipated_Visit_Date: formatDateForDatabase(detailsForm.anticipatedVisitDate),
    };

    const updates = Object.fromEntries(
      Object.entries(rawUpdates).filter(([key, value]) => {
        if (key === 'Reason_Won' || key === 'Reason_Lost' || key === 'Reason_Won_Lost' || key === 'Competition') {
          return true;
        }
        return value !== "";
      })
    );

    const success = await saveJourneyUpdates(updates, originalUpdates);
    if (success) {
      setIsEditingDetails(false);
      const stageId = STAGES.find(s => s.label === detailsForm.stage)?.id;
      const localUpdates = {
        ...rawUpdates,
        stage: stageId // Add numeric stage ID for local state
      };
      updateJourney(localUpdates);
    }
  };

  const handleCancelDetails = () => {
    setIsEditingDetails(false);
  };


  const handleSaveCustomer = async () => {
    const updates = {
      Company_ID: customerForm.companyId,
      Industry: customerForm.industry,
      Target_Account: companyName, // Save the company name as Target_Account
    };

    const success = await saveJourneyUpdates(updates);
    if (success) {
      setIsEditingCustomer(false);
      updateJourney(updates);
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

  const handleSaveNotes = async () => {
    const updates = {
      Notes: notes,
    };

    const success = await saveJourneyUpdates(updates);
    if (success) {
      setShowSavePrompt(false);
      updateJourney(updates);
    } else {
      setNotes(journey?.Notes ?? journey?.notes ?? "");
      setShowSavePrompt(false);
    }
  };

  const handleCancelNotes = () => {
    setNotes(journey?.Notes ?? journey?.notes ?? "");
    setShowSavePrompt(false);
  };

  const handleSaveNextSteps = async () => {
    const updates = {
      Next_Steps: nextSteps,
    };

    const success = await saveJourneyUpdates(updates);
    setIsSaving(false);
    setShowNextStepsSavePrompt(false);
    if (success) {
      updateJourney(updates);
    } else {
      setNextSteps(journey?.Next_Steps ?? "");
      setShowNextStepsSavePrompt(false);
    }
  };

  const handleCancelNextSteps = () => {
    setNextSteps(journey?.Next_Steps ?? "");
    setShowNextStepsSavePrompt(false);
  };

  const handleSetPrimaryContact = async (contactId: string, JourneyID: string) => {
    if (!journey?.ID && !journey?.id) return;
    
    const originalContacts = journeyContacts;
    
    setJourneyContacts(prevContacts => 
      prevContacts.map(contact => ({
        ...contact,
        IsPrimary: contact.ID === contactId ? 1 : 0
      }))
    );
    
    setIsSaving(true);
    try {
      const bulkUpdateResult = await api.patch(
        `/legacy/std/Journey_Contact/filter/custom?filterField=Jrn_ID&filterValue=${JourneyID}`,
        { IsPrimary: 0 }
      );
      
      if (bulkUpdateResult !== null) {
        const primaryUpdateResult = await api.patch(
          `/legacy/std/Journey_Contact/${contactId}`,
          { IsPrimary: 1 }
        );
        
        if (primaryUpdateResult === null) {
          setJourneyContacts(originalContacts);
        }
      } else {
        setJourneyContacts(originalContacts);
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

    setIsSaving(true);
    try {
      const result = await api.delete(`/legacy/std/Journey_Contact/${contactToDelete.ID}`);
      
      if (result !== null) {
        setJourneyContacts(prevContacts => 
          prevContacts.filter(contact => contact.ID !== contactToDelete.ID)
        );
        setContactToDelete(null);
      } else {
        console.error("Failed to delete contact");
        alert("Failed to delete contact. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactAdded = async (newContact: any) => {
    if (newContact.Jrn_ID || newContact.Contact_Name || (newContact.ID && !newContact.Cont_Id)) {
      setJourneyContacts(prev => {
        if (newContact.IsPrimary === 1) {
          const updatedContacts = prev.map(contact => ({
            ...contact,
            IsPrimary: 0
          }));
          return [...updatedContacts, newContact];
        }
        return [...prev, newContact];
      });
      return;
    }

    if (journey?.ID || journey?.id) {
      try {
        const journeyId = journey.ID || journey.id;
        const journeyContactData = {
          Jrn_ID: journeyId,
          Contact_ID: newContact.Cont_Id,
          Contact_Name: `${newContact.FirstName} ${newContact.LastName}`.trim(),
          Contact_Position: "",
          Contact_Email: newContact.Email || "",
          Contact_Office: newContact.PhoneNumber || "",
          Contact_Mobile: "",
          Contact_Note: newContact.Notes || "",
          IsPrimary: journeyContacts.length === 0 ? 1 : 0, // Make first contact primary
        };

        const journeyContact = await api.post("/legacy/std/Journey_Contact", journeyContactData);

        if (journeyContact !== null) {
          setJourneyContacts(prev => [...prev, journeyContact]);
        }
      } catch (error) {
        console.error("Error creating journey contact link:", error);
      }
    }
  };

  if (!journey) return null;

  const customer = journey.customer;

  return (
    <div className="p-2 flex flex-1 flex-col">
      <div className="flex flex-col gap-2 flex-1">
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Customer Details</h2>
              <div className="flex gap-2">
                {isEditingCustomer ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveCustomer}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleCancelCustomer}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={() => {
                        setCustomerForm({
                          companyId: journey?.Company_ID || "",
                          industry: getValidIndustry(journey?.Industry || ""),
                        });
                        setIsEditingCustomer(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <div title={customer?.id ? "Go to customer page" : "No associated customer"}>
                      <Button
                        variant="secondary-outline"
                        size="sm"
                        onClick={customer?.id ? () => navigate(`/sales/companies/${customer?.id}`) : undefined}
                        disabled={!customer?.id}
                      >
                        <User size={16} />
                      </Button>
                    </div>
                  </>
                )}
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
                            justSelectedCompany.current = false; // Reset flag when user types
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
                    <option value="Contract Stamping">Contract Stamping</option>
                    <option value="Press OEM">Press OEM</option>
                    <option value="Construction">Construction</option>
                    <option value="Energy / Motors / Transformers">Energy / Motors / Transformers</option>
                    <option value="Integrator">Integrator</option>
                    <option value="Auto Tier 1 & 2">Auto Tier 1 & 2</option>
                    <option value="Auto OEM">Auto OEM</option>
                    <option value="Marine">Marine</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Lawn Equipment">Lawn Equipment</option>
                    <option value="Contract Rollforming">Contract Rollforming</option>
                    <option value="HVAC / Air Handling">HVAC / Air Handling</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Mobile Heavy Equipment / Locomotive">Mobile Heavy Equipment / Locomotive</option>
                    <option value="Other">Other</option>
                    <option value="Storage / Lockers / Hardware">Storage / Lockers / Hardware</option>
                    <option value="Contract Fabricating">Contract Fabricating</option>
                    <option value="Furniture & Components">Furniture & Components</option>
                    <option value="Electrical Components / Lighting">Electrical Components / Lighting</option>
                    <option value="RV / Trailers">RV / Trailers</option>
                    <option value="Military / Defense">Military / Defense</option>
                    <option value="Medical">Medical</option>
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {customer?.industry || journey?.Industry || "-"}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-text-muted">Contacts ({journeyContacts.length})</div>
                  <Button
                    variant="secondary-outline"
                    size="sm"
                    onClick={() => setShowAddJourneyContactModal(true)}
                    disabled={isSaving}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                {journeyContacts.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {[...journeyContacts]
                      .sort((a, b) => {
                        const aIsPrimary = Number(a.IsPrimary) === 1;
                        const bIsPrimary = Number(b.IsPrimary) === 1;
                        return (bIsPrimary ? 1 : 0) - (aIsPrimary ? 1 : 0);
                      })
                      .map((contact, index) => {
                        const isPrimary = Number(contact.IsPrimary) === 1;
                        return (
                      <div 
                        key={contact.ID || index} 
                        className={`rounded border p-3 ${isPrimary ? 'bg-gray border-gray' : 'bg-surface'}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            {editingContactId === contact.ID ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                                  value={contactForm.Contact_Name}
                                  onChange={(e) => setContactForm(prev => ({ ...prev, Contact_Name: e.target.value }))}
                                  placeholder="Contact Name"
                                />
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
                              </div>
                            ) : (
                              <>
                                <div className="text-sm text-text font-medium mb-1">
                                  {contact.Contact_Name || "Unnamed Contact"}
                                </div>
                                {contact.Contact_Position && (
                                  <div className="text-xs text-text-muted mb-1">
                                    {contact.Contact_Position}
                                  </div>
                                )}
                                {contact.Contact_Email && (
                                  <div className="text-xs text-text-muted mb-1">
                                    <span className="font-bold">Email:</span> <a href={`mailto:${contact.Contact_Email}`} className="text-primary hover:underline">{contact.Contact_Email}</a>
                                  </div>
                                )}
                                {contact.Contact_Office && (
                                  <div className="text-xs text-text-muted mb-1">
                                    <span className="font-bold">Office:</span> {contact.Contact_Office}
                                  </div>
                                )}
                                {contact.Contact_Mobile && (
                                  <div className="text-xs text-text-muted mb-1">
                                    <span className="font-bold">Mobile:</span> {contact.Contact_Mobile}
                                  </div>
                                )}
                                {contact.Contact_Note && (
                                  <div className="text-xs text-text-muted italic mt-2 p-2 bg-background rounded">
                                    {contact.Contact_Note}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {editingContactId !== contact.ID && (
                              <>
                                {isPrimary && <span className="text-xs bg-gray text-white px-2 py-1 rounded">Primary</span>}
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
                                  disabled={isSaving || editingContactId !== null}
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
              <div className="flex gap-2">
                {isEditingDetails ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleCancelDetails}
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
                      setIsEditingDetails(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-x-6 gap-y-4">
              <div>
                <div className="text-sm text-text-muted">Created</div>
                <div className="text-sm text-text">
                  {(() => {
                    try {
                      return journey?.CreateDT ? formatDate(journey.CreateDT) : "-";
                    } catch (error) {
                      return journey?.CreateDT || "-";
                    }
                  })()}
                </div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Journey Start Date</div>
                {isEditingDetails ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.journeyStartDate}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, journeyStartDate: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {(() => {
                      try {
                        return journey?.Journey_Start_Date ? formatDate(journey.Journey_Start_Date) : "-";
                      } catch (error) {
                        return journey?.Journey_Start_Date || "-";
                      }
                    })()}
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
                    <option value="Stamping">Stamping</option>
                    <option value="CTL">CTL</option>
                    <option value="Parts">Parts</option>
                    <option value="Rollforming">Rollforming</option>
                    <option value="Service">Service</option>
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
                    <option value="Dealer Lead">Dealer Lead</option>
                    <option value="Phone In - Existing Customer">Phone In - Existing Customer</option>
                    <option value="Coe Website (contact form)">Coe Website (contact form)</option>
                    <option value="Cold Call - New Customer">Cold Call - New Customer</option>
                    <option value="Other">Other</option>
                    <option value="Coe Website (Email Inquiry)">Coe Website (Email Inquiry)</option>
                    <option value="Email - Existing Customer">Email - Existing Customer</option>
                    <option value="TopSpot">TopSpot</option>
                    <option value="OEM Lead">OEM Lead</option>
                    <option value="Coe Service">Coe Service</option>
                    <option value="Email - New Customer">Email - New Customer</option>
                    <option value="Phone In - New Customer">Phone In - New Customer</option>
                    <option value="Event - Fabtech">Event - Fabtech</option>
                    <option value="Cold Call - Prior Customer">Cold Call - Prior Customer</option>
                    <option value="Cold Call - Existing Customer">Cold Call - Existing Customer</option>
                    <option value="Customer Visit (prior customer)">Customer Visit (prior customer)</option>
                    <option value="Customer Visit (current customer)">Customer Visit (current customer)</option>
                    <option value="Email - Dealer">Email - Dealer</option>
                    <option value="Event - NATM">Event - NATM</option>
                    <option value="Event - PMA">Event - PMA</option>
                    <option value="Phone In - Dealer">Phone In - Dealer</option>
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
                    <option value="Standard">Standard</option>
                    <option value="Custom">Custom</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                ) : (
                  <div className="text-sm text-text">
                    {getValidEquipmentType(journey?.Equipment_Type)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Qty of Items</div>
                {isEditingDetails ? (
                  <input
                    type="number"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.qtyItems}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, qtyItems: e.target.value }))
                    }
                    min={0}
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Qty_of_Items != null && journey?.Qty_of_Items !== "" ? journey.Qty_of_Items : "-"}
                  </div>
                )}
              </div>

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
                    {/* Show current RSM if it's not in the available list */}
                    {detailsForm.rsm && !availableRsms.includes(detailsForm.rsm) && (
                      <option key={detailsForm.rsm} value={detailsForm.rsm}>{detailsForm.rsm}</option>
                    )}
                    {availableRsms.map(rsm => (
                      <option key={rsm} value={rsm}>{rsm}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">{getValidRSM(journey?.RSM) || "-"}</div>
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
                    {detailsForm.rsmTerritory && !availableRsms.includes(detailsForm.rsmTerritory) && (
                      <option key={detailsForm.rsmTerritory} value={detailsForm.rsmTerritory}>{detailsForm.rsmTerritory}</option>
                    )}
                    {availableRsms.map(rsm => (
                      <option key={rsm} value={rsm}>{rsm}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-text">{journey?.RSM_Territory?.trim() || "-"}</div>
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
                    {VALID_JOURNEY_STATUS.map(status => (
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
                <div className="text-sm text-text-muted">Last Action Date</div>
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
                    {/* Show current dealer if it's not in the available list */}
                    {detailsForm.dealer && ![
                      "H & O Die Supply, Inc.",
                      "Mid Atlantic Machinery", 
                      "Visionary Manufacturing Solutions",
                      "Sterling Fabrication Technology",
                      "Coe Press Equipment Corp.",
                      "Metal Forming Equipment Systems, LLC",
                      "Sanson Northwest Inc.",
                      "Press Automation, Inc.",
                      "TCR Inc.",
                      "Production Resources Inc.",
                      "Liakos Industrial Sales, LLC",
                      "Other",
                      "Promotores Tecnicos, S.A. De C.V.",
                      "C.J. Smith Machinery",
                      "Southern States Machinery Inc.",
                      "Stafford Machinery Company",
                      "CNI - Consultamex LLC"
                    ].includes(detailsForm.dealer) && (
                      <option key={detailsForm.dealer} value={detailsForm.dealer}>{detailsForm.dealer}</option>
                    )}
                    <option value="H & O Die Supply, Inc.">H & O Die Supply, Inc.</option>
                    <option value="Mid Atlantic Machinery">Mid Atlantic Machinery</option>
                    <option value="Visionary Manufacturing Solutions">Visionary Manufacturing Solutions</option>
                    <option value="Sterling Fabrication Technology">Sterling Fabrication Technology</option>
                    <option value="Coe Press Equipment Corp.">Coe Press Equipment Corp.</option>
                    <option value="Metal Forming Equipment Systems, LLC">Metal Forming Equipment Systems, LLC</option>
                    <option value="Sanson Northwest Inc.">Sanson Northwest Inc.</option>
                    <option value="Press Automation, Inc.">Press Automation, Inc.</option>
                    <option value="TCR Inc.">TCR Inc.</option>
                    <option value="Production Resources Inc.">Production Resources Inc.</option>
                    <option value="Liakos Industrial Sales, LLC">Liakos Industrial Sales, LLC</option>
                    <option value="Other">Other</option>
                    <option value="Promotores Tecnicos, S.A. De C.V.">Promotores Tecnicos, S.A. De C.V.</option>
                    <option value="C.J. Smith Machinery">C.J. Smith Machinery</option>
                    <option value="Southern States Machinery Inc.">Southern States Machinery Inc.</option>
                    <option value="Stafford Machinery Company">Stafford Machinery Company</option>
                    <option value="CNI - Consultamex LLC">CNI - Consultamex LLC</option>
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
                    {/* Show current dealer contact if it's not in the available list */}
                    {detailsForm.dealerContact && ![
                      "Greg Liakos",
                      "Ryan Bowman",
                      "Al Kosir",
                      "Dave Smith",
                      "Scott Bradt",
                      "Josh Kowal",
                      "Dave DeFrees",
                      "Brian Stafford",
                      "Arthur Anderson",
                      "Hunter Coe",
                      "Todd Wenzel",
                      "Greg Chmielewski",
                      "Jim Meyer",
                      "Brian Landry",
                      "Clint Ponton",
                      "Francisco Oranday",
                      "Juan Carlos Estrada",
                      "Kevin Houston"
                    ].includes(detailsForm.dealerContact) && (
                      <option key={detailsForm.dealerContact} value={detailsForm.dealerContact}>{detailsForm.dealerContact}</option>
                    )}
                    <option value="Greg Liakos">Greg Liakos</option>
                    <option value="Ryan Bowman">Ryan Bowman</option>
                    <option value="Al Kosir">Al Kosir</option>
                    <option value="Dave Smith">Dave Smith</option>
                    <option value="Scott Bradt">Scott Bradt</option>
                    <option value="Josh Kowal">Josh Kowal</option>
                    <option value="Dave DeFrees">Dave DeFrees</option>
                    <option value="Brian Stafford">Brian Stafford</option>
                    <option value="Arthur Anderson">Arthur Anderson</option>
                    <option value="Hunter Coe">Hunter Coe</option>
                    <option value="Todd Wenzel">Todd Wenzel</option>
                    <option value="Greg Chmielewski">Greg Chmielewski</option>
                    <option value="Jim Meyer">Jim Meyer</option>
                    <option value="Brian Landry">Brian Landry</option>
                    <option value="Clint Ponton">Clint Ponton</option>
                    <option value="Francisco Oranday">Francisco Oranday</option>
                    <option value="Juan Carlos Estrada">Juan Carlos Estrada</option>
                    <option value="Kevin Houston">Kevin Houston</option>
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
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                    <option value="90%">90%</option>
                    <option value="75%">75%</option>
                    <option value="50%">50%</option>
                    <option value="25%">25%</option>
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
                    <option value="Coe Quality">Coe Quality</option>
                    <option value="Customer Relationship">Customer Relationship</option>
                    <option value="Pricing">Pricing</option>
                    <option value="Coe Controls">Coe Controls</option>
                    <option value="Lead Time">Lead Time</option>
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
                    <option value="Competitor Price">Competitor Price</option>
                    <option value="Project Dropped">Project Dropped</option>
                    <option value="Outside of Budget">Outside of Budget</option>
                    <option value="Bought Used">Bought Used</option>
                    <option value="Spam">Spam</option>
                    <option value="No Response">No Response</option>
                    <option value="Work not awarded">Work not awarded</option>
                    <option value="Project Outsourced">Project Outsourced</option>
                    <option value="Lead Time">Lead Time</option>
                    <option value="Competitor Relationship">Competitor Relationship</option>
                    <option value="Not a fit">Not a fit</option>
                    <option value="Other">Other</option>
                    <option value="Different COE Equipment Selected">Different COE Equipment Selected</option>
                    <option value="Coe Controls">Coe Controls</option>
                    <option value="Parts/Svc Opportunity">Parts/Svc Opportunity</option>
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

        <div className="grid grid-cols-3 gap-2 flex-1">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-text-muted text-sm mb-1">Notes</h2>
            </div>
            <textarea
              className="flex-1 w-full p-2 bg-surface rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (journey?.Notes ?? journey?.notes ?? "")) {
                  setShowSavePrompt(true);
                }
              }}
            />
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-text-muted text-sm mb-1">Next Steps</h2>
            </div>
            <textarea
              className="flex-1 w-full p-2 bg-surface rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              onBlur={() => {
                if (nextSteps !== (journey?.Next_Steps ?? "")) {
                  setShowNextStepsSavePrompt(true);
                }
              }}
              placeholder="Enter next steps..."
            />
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Visit Logging</h2>
              <div className="flex gap-2">
                {isEditingDetails ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleCancelDetails}
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
                      setIsEditingDetails(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-sm text-text-muted mb-2">Visit Date</div>
                    {isEditingDetails ? (
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
                    {isEditingDetails ? (
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
                    {isEditingDetails ? (
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
        </div>
      </div>


      <Modal
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        title="Save Changes?"
        size="sm"
      >
        <p className="mb-4">Do you want to save your changes to Notes?</p>
        <div className="flex justify-end gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleSaveNotes}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={handleCancelNotes}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showNextStepsSavePrompt}
        onClose={() => setShowNextStepsSavePrompt(false)}
        title="Save Changes?"
        size="sm"
      >
        <p className="mb-4">Do you want to save your changes to Next Steps?</p>
        <div className="flex justify-end gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleSaveNextSteps}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={handleCancelNextSteps}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      <AddJourneyContactModal
        isOpen={showAddJourneyContactModal}
        onClose={() => setShowAddJourneyContactModal(false)}
        onContactAdded={handleContactAdded}
        journeyId={journey?.ID}
      />

      <Modal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        title="Delete Contact"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text">
            Are you sure you want to delete the contact "{contactToDelete?.Contact_Name || 'Unnamed Contact'}"?
          </p>
          <p className="text-text-muted text-sm">
            This action cannot be undone.
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
              className="!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700"
            >
              {isSaving ? "Deleting..." : "Delete Contact"}
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
  const api = useApi();

  const createQuoteFormData = (journey: any) => ({
    quoteNumber: journey?.Quote_Number?.trim() || "",
    quoteType: journey?.Quote_Type || "Standard more than 6 months",
    presentationMethod: journey?.Presentation_Method || "",
    presentationDate: journey?.Quote_Presentation_Date ? journey.Quote_Presentation_Date.split(' ')[0] : "",
    expectedDecisionDate: journey?.Expected_Decision_Date ? journey.Expected_Decision_Date.split(' ')[0] : "",
  });

  const [quoteForm, setQuoteForm] = useState(createQuoteFormData(journey));

  useEffect(() => {
    if (journey && !isEditingQuotes) {
      setQuoteForm(createQuoteFormData(journey));
    }
  }, [journey, isEditingQuotes]);

  const logJourneyChanges = async (journeyId: string, oldData: any, newData: Record<string, any>, originalUpdates: Record<string, any>) => {
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
          if (toValue.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(toValue)) {
            toValue = toValue;
          }
        }
        
        const changeEntry = `${field}: FROM ${fromValue} TO ${toValue}`;
        changes.push(changeEntry);
      }
    }

    if (changes.length > 0) {
      const actionText = changes.join('; ');
      
      try {
        await api.post('/legacy/std/Journey_Log', {
          Jrn_ID: journeyId,
          Action: actionText,
          CreateDtTm: new Date().toISOString().replace('T', ' ').substring(0, 23),
          CreateInit: employee.initials
        });
      } catch (error) {
        console.error('Error logging journey changes:', error);
      }
    }
  };

  const saveQuoteUpdates = async (updates: Record<string, any>, originalUpdates?: Record<string, any>) => {
    if (!journey?.ID && !journey?.id) return false;
    
    setIsSaving(true);
    try {
      const journeyId = journey.ID || journey.id;
      
      await logJourneyChanges(journeyId, journey, updates, originalUpdates || updates);
      
      const result = await api.patch(`/legacy/base/Journey/${journeyId}`, updates);
      
      return result !== null;
    } catch (error) {
      console.error("Error updating journey:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuotes = async () => {
    const originalUpdates = {
      Quote_Number: quoteForm.quoteNumber,
      Quote_Type: quoteForm.quoteType,
      Presentation_Method: quoteForm.presentationMethod,
      Quote_Presentation_Date: quoteForm.presentationDate,
      Expected_Decision_Date: quoteForm.expectedDecisionDate,
    };

    const rawUpdates = {
      Quote_Number: quoteForm.quoteNumber,
      Quote_Type: quoteForm.quoteType,
      Presentation_Method: quoteForm.presentationMethod,
      Quote_Presentation_Date: formatDateForDatabase(quoteForm.presentationDate),
      Expected_Decision_Date: formatDateForDatabase(quoteForm.expectedDecisionDate),
    };

    const updates = Object.fromEntries(
      Object.entries(rawUpdates).filter(([_, value]) => value !== "")
    );

    const success = await saveQuoteUpdates(updates, originalUpdates);
    if (success) {
      setIsEditingQuotes(false);
      updateJourney(rawUpdates);
    }
  };

  const handleCancelQuotes = () => {
    setQuoteForm(createQuoteFormData(journey));
    setIsEditingQuotes(false);
  };

  if (!journey) return null;

  return (
    <div className="flex flex-1 flex-col p-4 gap-6">
      {/* Quote Overview */}
      <div className="bg-foreground rounded shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Quote Overview</h3>
          <div className="flex gap-2">
            {isEditingQuotes ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveQuotes}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={handleCancelQuotes}
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
                  setQuoteForm(createQuoteFormData(journey));
                  setIsEditingQuotes(true);
                }}
              >
                <Edit size={16} />
              </Button>
            )}
          </div>
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
              {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
            </div>
            <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
          </div>
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Success Probability</div>
            <div className="text-lg font-semibold text-text">
              {journey?.Chance_To_Secure_order ? `${journey.Chance_To_Secure_order}%` : "Not specified"}
            </div>
            <div className="text-xs text-text-muted mt-1">Edit in Details tab</div>
          </div>
        </div>
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Quote Details</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-muted mb-1">Quote Type</div>
              {isEditingQuotes ? (
                <select
                  className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                  value={quoteForm.quoteType}
                  onChange={(e) => setQuoteForm(s => ({ ...s, quoteType: e.target.value }))}
                >
                  <option value="Standard more than 6 months">Standard more than 6 months</option>
                  <option value="Standard less than 6 months">Standard less than 6 months</option>
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
                  <option value="Email">Email</option>
                  <option value="In-Person Presentation">In-Person Presentation</option>
                  <option value="Virtual Presentation">Virtual Presentation</option>
                  <option value="Phone Call">Phone Call</option>
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

        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Timeline & Dates</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm text-text-muted">Quote Presentation Date</div>
              </div>
              {isEditingQuotes ? (
                <input
                  type="date"
                  className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text ml-5"
                  value={quoteForm.presentationDate || ""}
                  onChange={(e) => setQuoteForm(s => ({ ...s, presentationDate: e.target.value }))}
                />
              ) : (
                <div className="text-text ml-5">
                  {journey?.Quote_Presentation_Date ? formatDate(journey.Quote_Presentation_Date) : "Not scheduled"}
                </div>
              )}
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
                <div className="text-sm text-text-muted">Last Action Date</div>
              </div>
              <div className="text-text ml-5">
                {journey?.Action_Date ? formatDate(journey.Action_Date) : "Not available"}
              </div>
              <div className="text-xs text-text-muted ml-5 mt-1">Edit in Details tab</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Status Card */}
      {journey?.Quote_Number && (
        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Quote Status</h3>
          <div className="bg-background rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-text">Quote #{journey.Quote_Number}</div>
                <div className="text-sm text-text-muted mt-1">
                  {journey?.Equipment_Type?.trim() || "Standard"} • {journey?.Quote_Type || "Standard more than 6 months"}
                </div>
                {journey?.Qty_of_Items && journey.Qty_of_Items !== "" && (
                  <div className="text-sm text-text-muted">
                    Quantity: {journey.Qty_of_Items} items
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
                </div>
                {journey?.Chance_To_Secure_order && (
                  <div className="text-sm text-text-muted">
                    {journey.Chance_To_Secure_order}% probability
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Quote Information */}
      <div className="bg-foreground rounded shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-text mb-4">Additional Information</h3>
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
  }, [journey?.ID, journey?.id]); // Only depend on the actual ID values, not the get function

  const formatLogData = (logs: any[]) => {
    return logs.map(log => ({
      id: log.ID,
      created: log.CreateDtTm,
      user: log.CreateInit || '-',
      action: log.Action || '-'
    }));
  };

  return (
    <div className="flex flex-1 flex-col p-2 gap-2">
      <div className="bg-foreground rounded shadow-sm border p-2 flex-1">
        <div className="text-xs font-bold text-text-muted mb-1">Note History</div>
        <Table
          columns={[
            { key: "created", header: "Created", className: "text-xs" },
            { key: "user", header: "User", className: "text-xs" },
            { key: "activity", header: "Activity", className: "text-xs" },
            { key: "note", header: "Note", className: "text-xs" },
          ]}
          data={[]}
          total={0}
          idField="created"
        />
      </div>
      <div className="bg-foreground rounded shadow-sm border p-2 flex-1">
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

function JourneyActionsTab({ journey }: { journey: any | null }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { delete: deleteApi } = useApi();

  const handleDeleteJourney = async () => {
    if (!journey?.ID && !journey?.id) return;
    
    setIsDeleting(true);
    try {
      const journeyId = journey.ID || journey.id;
      const result = await deleteApi(`/legacy/std/Journey/${journeyId}`);
      
      if (result !== null) {
        navigate('/sales/pipeline');
      } else {
        console.error('Failed to delete journey');
      }
    } catch (error) {
      console.error('Error deleting journey:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!journey) return null;

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="bg-foreground rounded shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-text mb-4">Journey Actions</h3>
        
        <div className="space-y-4">
          <div className="border border-red-200 bg-red-50 rounded p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="text-red-600 mt-1" size={20} />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-2">Delete Journey</h4>
                <p className="text-sm text-red-700 mb-3">
                  Permanently delete this journey and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-500 !text-gray-900 hover:bg-red-100 hover:!text-black"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteJourneyModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => handleDeleteJourney()}
        journey={journey}
        isDeleting={isDeleting}
      />
    </div>
  );
}

const JourneyDetailsPage = () => {
  const [activeTab, setActiveTab] = useState("details");
  const { id: journeyId } = useParams<{ id: string }>();

  const [journeyData, setJourneyData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [journeyContacts, setJourneyContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const { employee } = useAuth();

  const adaptLegacyJourney = (raw: any) => {
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

    const normalizeDate = (d: any) => {
      if (!d) return undefined;
      const s = String(d);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
      return s.includes(" ") ? s.replace(" ", "T") : s;
    };

    const normalizePriority = (v: any): string => {
      const s = String(v ?? "").toUpperCase().trim();
      if (s === "A" || s === "B" || s === "C" || s === "D") return s;
      if (s.startsWith("H")) return "A";
      if (s.startsWith("L")) return "D";
      if (s.startsWith("M")) return "C";
      return "C";
    };

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
      ...raw // Keep all original fields including Dealer, Dealer_Name, Dealer_ID
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
              setCustomerData({
                id: customerRaw.Company_ID,
                name: customerRaw.Company_Name || adaptedJourney.companyName,
                industry: customerRaw.Industry,
                contact: customerRaw.Contact_Name,
                email: customerRaw.Email,
                phone: customerRaw.Phone
              });
            }
          } catch (customerError) {
            console.warn("Could not fetch customer data:", customerError);
            setCustomerData({
              id: rawJourney.Company_ID,
              name: adaptedJourney.companyName
            });
          }
        }

        try {
          const contactsData = await api.get('/legacy/std/Journey_Contact/filter/custom', {
            filterField: 'Jrn_ID',
            filterValue: journeyId
          });
          
          if (contactsData !== null) {
            setJourneyContacts(Array.isArray(contactsData) ? contactsData : []);
          }
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


  const updateJourney = (updates: Record<string, any>) => {
    setJourneyData((prev: any) => ({
      ...prev,
      ...updates
    }));
  };

  useEffect(() => {
    fetchJourneyData();
  }, [journeyId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading journey details...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }


  if (!journeyId) {
    return (
      <div className="w-full flex flex-1 flex-col">
        <PageHeader
          title="Invalid Journey"
          description="No journey ID provided in the URL."
          goBack
        />
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="w-full flex flex-1 flex-col">
        <PageHeader
          title="Journey not found"
          description="This journey may have been removed or is unavailable."
          goBack
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={
          journeyData?.name ||
          journeyData?.Project_Name ||
          journeyData?.Target_Account ||
          "Coe Press Equipment"
        }
        description={`Started ${
          (() => {
            try {
              return journeyData?.CreateDT ? formatDate(journeyData.CreateDT) : "Unknown Date";
            } catch (error) {
              return journeyData?.CreateDT || "Unknown Date";
            }
          })()
        } • ${journeyData?.Journey_Type || "Standard"} • ${formatCurrency(
          Number(journeyData?.Journey_Value ?? journeyData?.value ?? 0)
        )}`}
        goBack
      />
      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Details", value: "details" },
          { label: "Quote Info", value: "quotes" },
          { label: "History", value: "history" },
          { label: "Journey Actions", value: "actions" },
        ]}
      />
      <>
        {activeTab === "details" && (
          <JourneyDetailsTab
            journey={
              journeyData
                ? { ...journeyData, customer: customerData }
                : null
            }
            journeyContacts={journeyContacts}
            updateJourney={updateJourney}
            setJourneyContacts={setJourneyContacts}
            employee={employee}
          />
        )}
        {activeTab === "quotes" && <JourneyQuotesTab journey={journeyData} updateJourney={updateJourney} employee={employee} />}
        {activeTab === "history" && <JourneyHistoryTab journey={journeyData} />}
        {activeTab === "actions" && <JourneyActionsTab journey={journeyData} />}
      </>
    </div>
  );
};

export default JourneyDetailsPage;