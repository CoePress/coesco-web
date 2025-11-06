import {
  Edit,
  Lock,
  Trash2,
  UserX,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Modal from "@/components/ui/modal";
import { Button, Input, Select } from "@/components";
import DatePicker from "@/components/ui/date-picker";
import { AddAddressModal } from "@/components/modals/add-address-modal";
import { DeleteContactModal } from "@/components/modals/delete-contact-modal";
import { formatCurrency, formatDate } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { ContactType } from "@/types/enums";
import { fetchAvailableRsms, fetchEmployeeByNumber, Employee } from "./journeys/utils";

const CREDIT_STATUS_OPTIONS = [
  { value: 'A', label: 'Call Accouting' },
  { value: 'C', label: 'COD Only' },
  { value: 'I', label: 'International' },
  { value: 'N', label: 'No Shipment' },
  { value: 'O', label: 'Overlimit' },
  { value: 'S', label: 'OK to Ship' }
];

// TODO: what the fuck do these codes mean
const TERMS_CODE_OPTIONS = ['30', '45', '01', '60', '90', '40', '50', '70'];

const getContactTypeName = (type: ContactType | string | null | undefined): string => {
  switch (type) {
    case ContactType.Accounting: return 'Accounting';
    case ContactType.Engineering: return 'Engineering';
    case ContactType.Inactive: return 'Inactive';
    case ContactType.Left_Company: return 'Left Company';
    case ContactType.Parts_Service: return 'Parts/Service';
    case ContactType.Sales: return 'Sales';
    default: return type || 'Unknown';
  }
};

const getContactTypeColor = (type: ContactType | string | null | undefined): string => {
  switch (type) {
    case ContactType.Accounting: return 'bg-blue-100 text-blue-800 border-blue-200';
    case ContactType.Engineering: return 'bg-green-100 text-green-800 border-green-200';
    case ContactType.Inactive: return 'bg-gray-100 text-gray-800 border-gray-200';
    case ContactType.Left_Company: return 'bg-red-100 text-red-800 border-red-200';
    case ContactType.Parts_Service: return 'bg-purple-100 text-purple-800 border-purple-200';
    case ContactType.Sales: return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const [company, setCompany] = useState<any>(null);
  const [companyContacts, setCompanyContacts] = useState<any[]>([]);
  const [companyJourneys, setCompanyJourneys] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [navigationModal, setNavigationModal] = useState<{ isOpen: boolean; journeyName: string; journeyId: string }>({ isOpen: false, journeyName: '', journeyId: '' });

  const [isEditingAll, setIsEditingAll] = useState(false);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'credit' | 'interactions' | 'purchase-history' | 'notes' | 'relationships'>('overview');
  
  const [editingCallId, setEditingCallId] = useState<number | null>(null);
  const [editingCallData, setEditingCallData] = useState<any>({});
  
  const [isAddingCall, setIsAddingCall] = useState(false);
  const [newCallData, setNewCallData] = useState<any>({});
  
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [editingContactData, setEditingContactData] = useState<any>({});
  
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactData, setNewContactData] = useState<any>({});
  
  const [showInactiveContacts, setShowInactiveContacts] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [markInactiveContact, setMarkInactiveContact] = useState<any | null>(null);
  const [isMarkingInactive, setIsMarkingInactive] = useState(false);

  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [editingAddressData, setEditingAddressData] = useState<any>({});
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  
  const [editZipLookupResults, setEditZipLookupResults] = useState<{city: string[], stateProv: string[], country: string[]}>({city: [], stateProv: [], country: []});
  const [isEditLookingUpZip, setIsEditLookingUpZip] = useState(false);

  const [coeRsmEmployee, setCoeRsmEmployee] = useState<{name: string, empNum: number} | null>(null);
  const [availableRsms, setAvailableRsms] = useState<Employee[]>([]);
  const [isCustomRsmInput, setIsCustomRsmInput] = useState(false);

  const [companyAddresses, setCompanyAddresses] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [companyRelationships, setCompanyRelationships] = useState<any[]>([]);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [newRelationshipData, setNewRelationshipData] = useState<any>({});
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);

  const getContactName = (contact: any) => `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
  const getContactInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'C';
  
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

    const expectedDecisionDate =
      normalizeDate(raw.Expected_Decision_Date) ??
      null;
    const updatedAt =
      normalizeDate(raw.Action_Date) ??
      normalizeDate(raw.CreateDT) ??
      undefined;

    const customerId = String(raw.Company_ID ?? "");
    const companyName = raw.Target_Account || undefined;
    const confidence = parseConfidence(raw.Chance_To_Secure_order);

    return {
      id,
      name,
      stage,
      value,
      priority,
      expectedDecisionDate,
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

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      setIsInitialLoading(false);
      return;
    }
    
    let cancelled = false;
    const fetchCompanyData = async () => {
      try {
        setIsInitialLoading(true);
        const [companyData, contactsData, journeysData, callHistoryData, addressesData, jobsData] = await Promise.all([
          api.get(`/legacy/std/Company/filter/custom`, {
            filterField: 'Company_ID',
            filterValue: id,
            limit: 1
          }),
          api.get(`/sales/contacts`, {
            filter: JSON.stringify({
              legacyCompanyId: id
            }),
            limit: 100
          }),
          api.get(`/legacy/std/Journey/filter/custom`, {
            filterField: 'Company_ID',
            filterValue: id,
            limit: 100
          }),
          api.get(`/legacy/std/CallHistory/filter/custom`, {
            filterField: 'Company_ID',
            filterValue: id,
            limit: 200
          }),
          api.get(`/legacy/std/Address/filter/custom`, {
            filterField: 'Company_ID',
            filterValue: id,
            limit: 100
          }),
          api.get(`/legacy/job/JobOrder/filter/custom`, {
            filterField: 'BillToNum',
            filterValue: id,
            limit: 200
          })
        ]);

        if (!cancelled) {
          const processedContacts = Array.isArray(contactsData) ? contactsData : (contactsData?.data || []);
          setCompanyContacts(processedContacts);

          const processedJourneys = Array.isArray(journeysData) ? journeysData.map(adaptLegacyJourney) : [];
          setCompanyJourneys(processedJourneys);

          const processedCallHistory = Array.isArray(callHistoryData) ? callHistoryData : [];
          setCallHistory(processedCallHistory);

          const processedAddresses = Array.isArray(addressesData) ? addressesData : [];
          setCompanyAddresses(processedAddresses);

          const processedJobs = Array.isArray(jobsData) ? jobsData : [];

          if (processedJobs.length > 0) {
            try {
              const jobNumbers = processedJobs.map((job: any) => job.JobNumber);

              const allSuffixData = await api.get(`/legacy/job/JobSuffix`, {
                filter: JSON.stringify({
                  filters: [
                    { field: 'JobNumber', operator: 'in', values: jobNumbers }
                  ]
                }),
                limit: 1000
              });

              const suffixesByJobNumber = new Map<string, any[]>();
              const suffixArray = Array.isArray(allSuffixData) ? allSuffixData : (allSuffixData?.data || []);

              suffixArray.forEach((suffix: any) => {
                const jobNum = suffix.JobNumber;
                if (!suffixesByJobNumber.has(jobNum)) {
                  suffixesByJobNumber.set(jobNum, []);
                }
                suffixesByJobNumber.get(jobNum)?.push(suffix);
              });

              const jobsWithDetails = processedJobs.map((job: any) => ({
                jobNumber: job.JobNumber,
                jobStatus: job.JobStatus,
                suffixes: (suffixesByJobNumber.get(job.JobNumber) || []).map((suffix: any) => ({
                  description: suffix.ShortDescr,
                  cost: suffix.QuoteCost
                }))
              }));

              if (!cancelled) {
                setPurchaseHistory(jobsWithDetails);
              }
            } catch (error) {
              console.error('Error fetching suffix data:', error);
              if (!cancelled) {
                setPurchaseHistory([]);
              }
            }
          } else {
            setPurchaseHistory([]);
          }

          const processedCompanyData = Array.isArray(companyData) ? companyData[0] : companyData;

          if (processedCompanyData) {
            const primaryContact = processedContacts.find((contact: any) => contact.type === ContactType.Accounting) || processedContacts[0];
            setCompany({
              ...processedCompanyData,
              id: processedCompanyData.Company_ID,
              name: processedCompanyData.CustDlrName || `Company ${processedCompanyData.Company_ID}`,
              phone: primaryContact?.phone || processedCompanyData.BillToPhone || "",
              email: primaryContact?.email || "",
              website: "",
              active: Number(processedCompanyData.Active) === 1,
              isDealer: Number(processedCompanyData.IsDealer) || 0,
              creditStatus: processedCompanyData.CreditStatus,
              creditLimit: processedCompanyData.CreditLimit,
              acctBalance: processedCompanyData.AcctBalance,
              termsCode: processedCompanyData.TermsCode,
              coeRSM: processedCompanyData.CoeRSM,
              balanceDate: processedCompanyData.BalanceDate,
              creditNote: processedCompanyData.CreditNote,
              notes: processedCompanyData.Notes
            });
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        setCallHistory([]);
        setCompanyAddresses([]);
        setPurchaseHistory([]);
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchCompanyData();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      return;
    }

    let cancelled = false;
    const fetchRelationships = async () => {
      try {
        const [asParent, asChild] = await Promise.all([
          api.get(`/sales/company-relationships`, {
            filter: JSON.stringify({
              parentId: String(id)
            }),
            limit: 100
          }),
          api.get(`/sales/company-relationships`, {
            filter: JSON.stringify({
              childId: String(id)
            }),
            limit: 100
          })
        ]);

        if (!cancelled) {
          const parentRelationships = Array.isArray(asParent) ? asParent : (asParent?.data || []);
          const childRelationships = Array.isArray(asChild) ? asChild : (asChild?.data || []);

          const allRelationships = [
            ...parentRelationships.map((rel: any) => ({ ...rel, direction: 'parent' })),
            ...childRelationships.map((rel: any) => ({ ...rel, direction: 'child' }))
          ];

          // Fetch company names for all related companies
          const relatedCompanyIds = allRelationships.map((rel: any) =>
            rel.direction === 'parent' ? rel.childId : rel.parentId
          );

          const uniqueCompanyIds = [...new Set(relatedCompanyIds)];

          const companyNamePromises = uniqueCompanyIds.map(async (companyId: string) => {
            try {
              const companyData = await api.get(`/legacy/std/Company/filter/custom`, {
                filterField: 'Company_ID',
                filterValue: companyId,
                limit: 1,
                fields: 'CustDlrName'
              });
              const company = Array.isArray(companyData) ? companyData[0] : companyData;
              return { id: companyId, name: company?.CustDlrName || `Company ${companyId}` };
            } catch (error) {
              console.error(`Error fetching company ${companyId}:`, error);
              return { id: companyId, name: `Company ${companyId}` };
            }
          });

          const companyNames = await Promise.all(companyNamePromises);
          const companyNameMap = Object.fromEntries(companyNames.map(c => [c.id, c.name]));

          // Add company names to relationships
          const relationshipsWithNames = allRelationships.map((rel: any) => {
            const relatedCompanyId = rel.direction === 'parent' ? rel.childId : rel.parentId;
            return {
              ...rel,
              relatedCompanyName: companyNameMap[relatedCompanyId]
            };
          });

          setCompanyRelationships(relationshipsWithNames);
        }
      } catch (error) {
        console.error('Error fetching company relationships:', error);
        if (!cancelled) {
          setCompanyRelationships([]);
        }
      }
    };

    fetchRelationships();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!company?.coeRSM) {
        setCoeRsmEmployee(null);
        return;
      }

      const employee = await fetchEmployeeByNumber(api, company.coeRSM);
      if (!cancelled) {
        setCoeRsmEmployee(employee);
      }
    })();
    return () => { cancelled = true; };
  }, [company?.coeRSM]);

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

  const handleStartEditing = () => {
    setIsEditingAll(true);
    setIsCustomRsmInput(false);
    setTempValues({
      active: company.active,
      isDealer: company.isDealer,
      creditStatus: company.creditStatus,
      creditLimit: company.creditLimit,
      acctBalance: company.acctBalance,
      termsCode: company.termsCode,
      coeRSM: company.coeRSM,
      balanceDate: company.balanceDate,
      creditNote: company.creditNote,
      notes: company.notes
    });
  };

  const handleSaveAll = async () => {
    if (!company || !id) return;
    
    try {
      const updateData: Record<string, any> = {
        Active: tempValues.active ? 1 : 0,
        IsDealer: parseInt(tempValues.isDealer) || 0,
        CreditStatus: tempValues.creditStatus,
        CreditLimit: parseFloat(tempValues.creditLimit) || 0,
        AcctBalance: parseFloat(tempValues.acctBalance) || 0,
        TermsCode: tempValues.termsCode,
        CoeRSM: parseInt(tempValues.coeRSM) || 0,
        BalanceDate: tempValues.balanceDate || null,
        CreditNote: tempValues.creditNote || null,
        Notes: tempValues.notes || null
      };
      
      const result = await api.patch(`/legacy/std/Company/${id}`, updateData);

      if (result) {
        setCompany({
          ...company,
          active: tempValues.active,
          isDealer: parseInt(tempValues.isDealer) || 0,
          creditStatus: tempValues.creditStatus,
          creditLimit: tempValues.creditLimit,
          acctBalance: tempValues.acctBalance,
          termsCode: tempValues.termsCode,
          coeRSM: tempValues.coeRSM,
          balanceDate: tempValues.balanceDate,
          creditNote: tempValues.creditNote,
          notes: tempValues.notes
        });
        setIsEditingAll(false);
        setIsCustomRsmInput(false);
        setTempValues({});
      }
    } catch (error) {
    }
  };

  const handleCancelAll = () => {
    setIsEditingAll(false);
    setIsCustomRsmInput(false);
    setTempValues({});
  };

  const handleTempValueChange = (fieldName: string, value: any) => {
    setTempValues({ ...tempValues, [fieldName]: value });
  };

  const handleStartEditingNotes = () => {
    setIsEditingNotes(true);
    setTempNotes(company.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!company || !id) return;

    try {
      const updateData = {
        Notes: tempNotes || null
      };

      const result = await api.patch(`/legacy/std/Company/${id}`, updateData);

      if (result) {
        setCompany({
          ...company,
          notes: tempNotes
        });
        setIsEditingNotes(false);
        setTempNotes('');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleCancelNotesEdit = () => {
    setIsEditingNotes(false);
    setTempNotes('');
  };

  const handleEditCall = (call: any) => {
    setEditingCallId(call.CallRefNum);
    setEditingCallData({ ...call });
  };

  const handleCallDataChange = (fieldName: string, value: any) => {
    setEditingCallData({ ...editingCallData, [fieldName]: value });
  };

  const handleSaveCall = async () => {
    if (!editingCallId) return;
    
    try {
      const updateData = {
        Contactname: editingCallData.Contactname || '',
        CallStatus: editingCallData.CallStatus || '',
        PhoneNumber: editingCallData.PhoneNumber || '',
        CallType: editingCallData.CallType || '',
        CallOwner: editingCallData.CallOwner || '',
        CustEmail: editingCallData.CustEmail || '',
        CustComments: editingCallData.CustComments || '',
        OurComments: editingCallData.OurComments || '',
        Resolution: editingCallData.Resolution || '',
        Issues: editingCallData.Issues || '',
        ServiceCodes: editingCallData.ServiceCodes || '',
        RefEquipment: editingCallData.RefEquipment || ''
      };
      
      console.log('Sending call history update:', updateData);
      
      const result = await api.patch(`/legacy/std/CallHistory/filter/custom?filterField=CallRefNum&filterValue=${editingCallId}`, updateData);
      
      if (result) {
        const updatedCallHistory = callHistory.map(call => 
          call.CallRefNum === editingCallId ? { ...call, ...updateData } : call
        );
        setCallHistory(updatedCallHistory);
        setEditingCallId(null);
        setEditingCallData({});
      }
    } catch (error) {
      console.error('Error saving call history:', error);
    }
  };

  const handleCancelCallEdit = () => {
    setEditingCallId(null);
    setEditingCallData({});
  };

  const handleAddCall = async () => {
    const currentDateTime = new Date();
    const currentDate = currentDateTime.toISOString().split('T')[0];
    const currentTime = currentDateTime.getHours() * 10000 + currentDateTime.getMinutes() * 100 + currentDateTime.getSeconds();
    
    try {
      const maxCallRefNum = await api.get('/legacy/std/CallHistory/CallRefNum/max');
      const nextCallRefNum = (maxCallRefNum?.maxValue || 0) + 1;
      
      setNewCallData({
        CallRefNum: nextCallRefNum,
        CallStatus: 'O',
        CallDate: currentDate,
        CallTime: currentTime,
        CallType: 'T',
        FollowupDate: null,
        FollowupTime: 0,
        CallOwner: '',
        Contactname: '',
        PhoneNumber: '',
        CustComments: '',
        OurComments: '',
        CustEmail: '',
        Company_ID: parseInt(id || '0'),
        Address_ID: 16,
        FaxNumber: '',
        Resolution: '',
        StdEffected: null,
        StdUpdated: null,
        ServiceCodes: '',
        RefEquipment: '',
        'RefSerial#': '',
        CloseDate: null,
        CloseTime: 0,
        Issues: ''
      });
      setIsAddingCall(true);
    } catch (error) {
      console.error('Error getting next CallRefNum:', error);
      const fallbackCallRefNum = Date.now();
      setNewCallData({
        CallRefNum: fallbackCallRefNum,
        CallStatus: 'O',
        CallDate: currentDate,
        CallTime: currentTime,
        CallType: 'T',
        FollowupDate: null,
        FollowupTime: 0,
        CallOwner: '',
        Contactname: '',
        PhoneNumber: '',
        CustComments: '',
        OurComments: '',
        CustEmail: '',
        Company_ID: parseInt(id || '0'),
        Address_ID: 16,
        FaxNumber: '',
        Resolution: '',
        StdEffected: null,
        StdUpdated: null,
        ServiceCodes: '',
        RefEquipment: '',
        'RefSerial#': '',
        CloseDate: null,
        CloseTime: 0,
        Issues: ''
      });
      setIsAddingCall(true);
    }
  };

  const handleNewCallDataChange = (fieldName: string, value: any) => {
    setNewCallData({ ...newCallData, [fieldName]: value });
  };

  const handleSaveNewCall = async () => {
    try {
      console.log('Creating new call with data:', newCallData);
      console.log('API loading state:', api.loading);
      console.log('API error state:', api.error);
      
      let result = null;
      let success = false;
      
      console.log('Trying standard POST...');
      result = await api.post('/legacy/std/CallHistory', newCallData);
      console.log('Standard POST result:', result);
      console.log('Standard POST API success:', api.success);
      console.log('Standard POST API error:', api.error);
      
      if (api.success && !api.error) {
        success = true;
      }
      
      if (success || result) {
        console.log('Call creation appears successful, refreshing data...');
        await refreshCallHistory();
        setIsAddingCall(false);
        setNewCallData({});
      } else {
        console.log('Call creation failed');
        console.log('Final API error details:', api.error);
        alert('Failed to create call record. Check console for details.');
      }
    } catch (error) {
      console.error('Error creating new call:', error);
      console.log('Current API state - error:', api.error, 'loading:', api.loading, 'success:', api.success);
    }
  };

  const handleCancelNewCall = () => {
    setIsAddingCall(false);
    setNewCallData({});
  };

  const refreshCallHistory = async () => {
    try {
      console.log('Refreshing call history data...');
      const callHistoryData = await api.get(`/legacy/std/CallHistory/filter/custom`, { 
        filterField: 'Company_ID', 
        filterValue: id,
        limit: 200
      });
      
      if (callHistoryData) {
        const processedCallHistory = Array.isArray(callHistoryData) ? callHistoryData : [];
        setCallHistory(processedCallHistory);
        console.log('Call history refreshed:', processedCallHistory.length, 'records');
      }
    } catch (error) {
      console.error('Error refreshing call history:', error);
    }
  };

  const handleDeleteCall = async (call: any) => {
    if (!call.CallRefNum) {
      console.error('Cannot delete call: missing CallRefNum');
      return;
    }
    
    const confirmDelete = window.confirm(`Are you sure you want to delete call #${call.CallRefNum}?`);
    if (!confirmDelete) return;
    
    try {
      console.log('Deleting call with CallRefNum:', call.CallRefNum, 'and Company_ID:', id);
      
      const result = await api.delete(`/legacy/std/CallHistory/filter/custom`, {
        params: {
          CallRefNum: call.CallRefNum,
          Company_ID: id
        }
      });
      
      if (result !== null) {
        const updatedCallHistory = callHistory.filter(c => c.CallRefNum !== call.CallRefNum);
        setCallHistory(updatedCallHistory);
        console.log('Call deleted successfully');
      } else {
        console.error('Failed to delete call record');
        alert('Failed to delete call record. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting call:', error);
      alert('Error deleting call record. Please try again.');
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContactId(contact.id);
    setEditingContactData({ ...contact });
  };

  const handleContactDataChange = (fieldName: string, value: any) => {
    if (fieldName === 'firstName' || fieldName === 'lastName') {
      value = value.trimStart();
    }
    setEditingContactData({ ...editingContactData, [fieldName]: value });
  };

  const handleSaveContact = async () => {
    if (!editingContactId) return;

    try {
      const contactBeingEdited = companyContacts.find(c => c.id === editingContactId);
      if (!contactBeingEdited) return;

      const updateData = {
        firstName: editingContactData.firstName || '',
        lastName: editingContactData.lastName || '',
        email: editingContactData.email || '',
        phone: editingContactData.phone || '',
        phoneExtension: editingContactData.phoneExtension || '',
        title: editingContactData.title || '',
        type: editingContactData.type || ''
      };

      const result = await api.patch(`/sales/contacts/${editingContactId}`, updateData);

      if (result !== null) {
        const updatedContacts = companyContacts.map(contact =>
          contact.id === editingContactId ? { ...contact, ...updateData } : contact
        );
        setCompanyContacts(updatedContacts);
        setEditingContactId(null);
        setEditingContactData({});
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error saving contact. Please try again.');
    }
  };

  const handleCancelContactEdit = () => {
    setEditingContactId(null);
    setEditingContactData({});
  };

  const handleMarkContactAs = async (newType: ContactType) => {
    if (!markInactiveContact) return;

    try {
      setIsMarkingInactive(true);
      const updateData = {
        type: newType
      };

      const result = await api.patch(`/sales/contacts/${markInactiveContact.id}`, updateData);

      if (result !== null) {
        const updatedContacts = companyContacts.map(c =>
          c.id === markInactiveContact.id ? { ...c, type: newType } : c
        );
        setCompanyContacts(updatedContacts);
        setMarkInactiveContact(null);
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Error updating contact status. Please try again.');
    } finally {
      setIsMarkingInactive(false);
    }
  };

  const handleAddContact = () => {
    console.log('Add Contact button clicked');

    setNewContactData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneExtension: '',
      title: '',
      type: ContactType.Sales
    });
    setIsAddingContact(true);
  };

  const handleNewContactDataChange = (fieldName: string, value: any) => {
    if (fieldName === 'firstName' || fieldName === 'lastName') {
      value = value.trimStart();
    }
    setNewContactData({ ...newContactData, [fieldName]: value });
  };

  const handleSaveNewContact = async () => {
    try {
      console.log('Creating new contact with data:', newContactData);

      // Get companyId from the current page
      const companyIdFromUrl = id;
      if (!companyIdFromUrl) {
        alert('Cannot create contact: Company ID not found');
        return;
      }

      const DUMMY_LEGACY_COMPANY_UUID = '00000000-0000-0000-0000-000000000000';

      const result = await api.post('/sales/contacts', {
        ...newContactData,
        companyId: DUMMY_LEGACY_COMPANY_UUID,
        legacyCompanyId: companyIdFromUrl,
        isPrimary: false
      });

      if (result) {
        console.log('Contact creation successful');
        const updatedContacts = [...companyContacts, result];
        setCompanyContacts(updatedContacts);
        setIsAddingContact(false);
        setNewContactData({});
      } else {
        alert('Failed to create contact record.');
      }
    } catch (error) {
      console.error('Error creating new contact:', error);
      alert('Error creating new contact. Please try again.');
    }
  };

  const handleCancelNewContact = () => {
    setIsAddingContact(false);
    setNewContactData({});
  };

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.Address_ID);
    setEditingAddressData({ ...address });
    setEditZipLookupResults({city: [], stateProv: [], country: []});
    if (address.ZipCode) {
      lookupZipCode(address.ZipCode);
    }
  };

  const handleAddressDataChange = (fieldName: string, value: any) => {
    console.log(`Updating ${fieldName} to:`, value, 'Current state:', editingAddressData);
    setEditingAddressData((prev: any) => ({ ...prev, [fieldName]: value }));
    
    if (fieldName === 'ZipCode') {
      lookupZipCode(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSaveAddress = async () => {
    if (!editingAddressId) return;
    
    try {
      const addressBeingEdited = companyAddresses.find(a => a.Address_ID === editingAddressId);
      if (!addressBeingEdited) return;

      const updateData = {
        AddressName: editingAddressData.AddressName || '',
        Address1: editingAddressData.Address1 || '',
        Address2: editingAddressData.Address2 || '',
        Address3: editingAddressData.Address3 || '',
        City: editingAddressData.City || '',
        State: editingAddressData.State || '',
        Country: editingAddressData.Country || 'USA',
        ZipCode: editingAddressData.ZipCode || '',
        PhoneNumber: editingAddressData.PhoneNumber || '',
        FaxPhoneNum: editingAddressData.FaxPhoneNum || '',
        CanShip: (editingAddressData.CanShip === 1 || editingAddressData.CanShip === true) ? 1 : 0,
        CanBill: (editingAddressData.CanBill === 1 || editingAddressData.CanBill === true) ? 1 : 0,
        Notes: editingAddressData.Notes || '',
        BillToNum: parseInt(editingAddressData.BillToNum) || 0,
        BillToId: parseInt(editingAddressData.BillToId) || 0,
        ShipInstr: editingAddressData.ShipInstr || '',
        Directions: editingAddressData.Directions || '',
        OriginalVia: editingAddressData.OriginalVia || '',
        EmailInvoiceTo: editingAddressData.EmailInvoiceTo || '',
        SystemNotes: editingAddressData.SystemNotes || ''
      };
      
      const result = await api.patch(`/legacy/std/Address/filter/custom?Company_ID=${addressBeingEdited.Company_ID}&Address_ID=${editingAddressId}`, updateData);
      
      if (result !== null) {
        const updatedAddresses = companyAddresses.map(address => 
          address.Address_ID === editingAddressId ? { ...address, ...updateData } : address
        );
        setCompanyAddresses(updatedAddresses);
        setEditingAddressId(null);
        setEditingAddressData({});
        setEditZipLookupResults({city: [], stateProv: [], country: []});
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error saving address. Please try again.');
    }
  };

  const handleCancelAddressEdit = () => {
    setEditingAddressId(null);
    setEditingAddressData({});
    // Reset zip lookup results
    setEditZipLookupResults({city: [], stateProv: [], country: []});
  };

  const handleAddAddress = () => {
    setIsAddingAddress(true);
  };

  const lookupZipCode = async (zipCode: string) => {
    if (!zipCode || zipCode.length < 5) {
      setEditZipLookupResults({city: [], stateProv: [], country: []});
      return;
    }
    
    try {
      setIsEditLookingUpZip(true);
      
      const zipData = await api.get(`/legacy/std/ZipCode/filter/custom`, {
        filterField: 'ZipCode',
        filterValue: zipCode,
        limit: 100
      });
      
      if (zipData && Array.isArray(zipData) && zipData.length > 0) {
        // Extract unique values for each field
        const cities = [...new Set(zipData.map(item => item.City).filter(Boolean))];
        const stateProvs = [...new Set(zipData.map(item => item.StateProv).filter(Boolean))];
        const countries = [...new Set(zipData.map(item => item.Country).filter(Boolean))];
        
        const results = {
          city: cities,
          stateProv: stateProvs,
          country: countries
        };
        
        setEditZipLookupResults(results);
        
        // Auto-populate fields - single option locks field, multiple options default to first
        setEditingAddressData((prev: any) => ({
          ...prev,
          City: cities.length >= 1 ? cities[0] : prev.City,
          State: stateProvs.length >= 1 ? stateProvs[0] : prev.State,
          Country: countries.length >= 1 ? countries[0] : prev.Country
        }));
      } else {
        setEditZipLookupResults({city: [], stateProv: [], country: []});
      }
    } catch (error) {
      console.error('Error looking up zip code:', error);
      setEditZipLookupResults({city: [], stateProv: [], country: []});
    } finally {
      setIsEditLookingUpZip(false);
    }
  };



  const handleCancelNewAddress = () => {
    setIsAddingAddress(false);
  };

  const handleAddressAdded = (_address: any) => {
    // Refresh addresses after adding
    refreshAddresses();
  };

  const refreshAddresses = async () => {
    try {
      console.log('Refreshing address data...');
      const addressesData = await api.get(`/legacy/std/Address/filter/custom`, {
        filterField: 'Company_ID',
        filterValue: id,
        limit: 100
      });

      if (addressesData) {
        const processedAddresses = Array.isArray(addressesData) ? addressesData : [];
        setCompanyAddresses(processedAddresses);
        console.log('Addresses refreshed:', processedAddresses.length, 'records');
      }
    } catch (error) {
      console.error('Error refreshing addresses:', error);
    }
  };

  const handleSearchCompanies = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setCompanySearchResults([]);
      return;
    }

    try {
      setIsSearchingCompanies(true);

      const params: any = {
        page: 1,
        limit: 5,
        fields: "Company_ID,CustDlrName,Active",
        filter: JSON.stringify({
          filters: [
            {
              operator: "contains",
              field: "CustDlrName",
              value: searchTerm
            }
          ]
        })
      };

      const response = await api.get(`/legacy/base/Company`, params);

      const isApiResponse = response && typeof response === 'object' && 'data' in response;
      const rawResults = isApiResponse ? (Array.isArray(response.data) ? response.data : []) : (Array.isArray(response) ? response : []);

      setCompanySearchResults(rawResults.filter((c: any) => String(c.Company_ID) !== String(id)));
    } catch (error) {
      console.error('Error searching companies:', error);
      setCompanySearchResults([]);
    } finally {
      setIsSearchingCompanies(false);
    }
  };

  const handleAddRelationship = () => {
    setNewRelationshipData({
      relatedCompanyId: '',
      relatedCompanyName: '',
      relationshipType: '',
      direction: 'parent'
    });
    setCompanySearchTerm('');
    setCompanySearchResults([]);
    setIsAddingRelationship(true);
  };

  const handleSelectCompanyForRelationship = (selectedCompany: any) => {
    setNewRelationshipData({
      ...newRelationshipData,
      relatedCompanyId: selectedCompany.Company_ID,
      relatedCompanyName: selectedCompany.CustDlrName
    });
    setCompanySearchTerm('');
    setCompanySearchResults([]);
  };

  const handleSaveRelationship = async () => {
    if (!newRelationshipData.relatedCompanyId || !newRelationshipData.relationshipType) {
      alert('Please select a company and enter a relationship type');
      return;
    }

    try {
      const relationshipData = newRelationshipData.direction === 'parent'
        ? {
            parentId: String(id),
            childId: String(newRelationshipData.relatedCompanyId),
            relationshipType: newRelationshipData.relationshipType
          }
        : {
            parentId: String(newRelationshipData.relatedCompanyId),
            childId: String(id),
            relationshipType: newRelationshipData.relationshipType
          };

      const result = await api.post('/sales/company-relationships', relationshipData);

      if (result) {
        await refreshRelationships();
        setIsAddingRelationship(false);
        setNewRelationshipData({});
        setCompanySearchTerm('');
        setCompanySearchResults([]);
      }
    } catch (error) {
      console.error('Error creating relationship:', error);
      alert('Error creating relationship. Please try again.');
    }
  };

  const handleCancelRelationship = () => {
    setIsAddingRelationship(false);
    setNewRelationshipData({});
    setCompanySearchTerm('');
    setCompanySearchResults([]);
  };

  const handleDeleteRelationship = async (relationship: any) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this relationship?`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/sales/company-relationships/${relationship.id}`);
      await refreshRelationships();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      alert('Error deleting relationship. Please try again.');
    }
  };

  const refreshRelationships = async () => {
    try {
      const [asParent, asChild] = await Promise.all([
        api.get(`/sales/company-relationships`, {
          filter: JSON.stringify({
            parentId: String(id)
          }),
          limit: 100
        }),
        api.get(`/sales/company-relationships`, {
          filter: JSON.stringify({
            childId: String(id)
          }),
          limit: 100
        })
      ]);

      const parentRelationships = Array.isArray(asParent) ? asParent : (asParent?.data || []);
      const childRelationships = Array.isArray(asChild) ? asChild : (asChild?.data || []);

      const allRelationships = [
        ...parentRelationships.map((rel: any) => ({ ...rel, direction: 'parent' })),
        ...childRelationships.map((rel: any) => ({ ...rel, direction: 'child' }))
      ];

      // Fetch company names for all related companies
      const relatedCompanyIds = allRelationships.map((rel: any) =>
        rel.direction === 'parent' ? rel.childId : rel.parentId
      );

      const uniqueCompanyIds = [...new Set(relatedCompanyIds)];

      const companyNamePromises = uniqueCompanyIds.map(async (companyId: string) => {
        try {
          const companyData = await api.get(`/legacy/std/Company/filter/custom`, {
            filterField: 'Company_ID',
            filterValue: companyId,
            limit: 1,
            fields: 'CustDlrName'
          });
          const company = Array.isArray(companyData) ? companyData[0] : companyData;
          return { id: companyId, name: company?.CustDlrName || `Company ${companyId}` };
        } catch (error) {
          console.error(`Error fetching company ${companyId}:`, error);
          return { id: companyId, name: `Company ${companyId}` };
        }
      });

      const companyNames = await Promise.all(companyNamePromises);
      const companyNameMap = Object.fromEntries(companyNames.map(c => [c.id, c.name]));

      // Add company names to relationships
      const relationshipsWithNames = allRelationships.map((rel: any) => {
        const relatedCompanyId = rel.direction === 'parent' ? rel.childId : rel.parentId;
        return {
          ...rel,
          relatedCompanyName: companyNameMap[relatedCompanyId]
        };
      });

      setCompanyRelationships(relationshipsWithNames);
    } catch (error) {
      console.error('Error refreshing relationships:', error);
    }
  };


  if (isInitialLoading) {
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
      <aside className="w-80 bg-foreground flex flex-col border-r border-border">
        <div className="flex flex-col items-center py-4 border-b border-border">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-2 border border-border">
            <span className="text-primary text-2xl font-bold">{companyInitial}</span>
          </div>
          <h2 className="text-xl font-bold text-text px-2 text-center break-words max-w-full">{company.name}</h2>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted text-sm hover:underline mb-2">
              {company.website}
            </a>
          )}

        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-text">Company Details</h3>
            {isEditingAll ? (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAll}
                >
                  Save
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={handleCancelAll}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={handleStartEditing}
              >
                <Edit size={16} />
              </Button>
            )}
          </div>
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
              <span className="text-text-muted">Active Status</span>
              {isEditingAll ? (
                <select
                  value={tempValues.active ? 'true' : 'false'}
                  onChange={(e) => handleTempValueChange('active', e.target.value === 'true')}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={company.active ? "Active" : "Inactive"}
                  readOnly
                  className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Is Dealer</span>
              {isEditingAll ? (
                <select
                  value={tempValues.isDealer || 0}
                  onChange={(e) => handleTempValueChange('isDealer', parseInt(e.target.value))}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={company.isDealer ? "Yes" : "No"}
                  readOnly
                  className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Credit Status</span>
              {isEditingAll ? (
                <select
                  value={tempValues.creditStatus || ''}
                  onChange={(e) => handleTempValueChange('creditStatus', e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                >
                  <option value="">Select status...</option>
                  {CREDIT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={company.creditStatus ? CREDIT_STATUS_OPTIONS.find(opt => opt.value === company.creditStatus)?.label || company.creditStatus : "-"}
                  readOnly
                  className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Account Balance</span>
              {isEditingAll ? (
                <input
                  type="number"
                  step="0.01"
                  value={tempValues.acctBalance || ''}
                  onChange={(e) => handleTempValueChange('acctBalance', e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
              ) : (
                <input
                  type="text"
                  value={company.acctBalance !== null && company.acctBalance !== undefined ? formatCurrency(company.acctBalance) : "-"}
                  readOnly
                  className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">Balance Date</span>
              {isEditingAll ? (
                <input
                  type="date"
                  value={tempValues.balanceDate ? new Date(tempValues.balanceDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleTempValueChange('balanceDate', e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                />
              ) : (
                <input
                  type="text"
                  value={company.balanceDate ? formatDate(company.balanceDate) : "-"}
                  readOnly
                  className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted">COE RSM</span>
              {isEditingAll ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomRsmInput(false)}
                      className={`px-3 py-1 text-xs rounded ${
                        !isCustomRsmInput 
                          ? 'bg-primary text-white' 
                          : 'bg-surface text-text border border-border'
                      }`}
                    >
                      Select RSM
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomRsmInput(true)}
                      className={`px-3 py-1 text-xs rounded ${
                        isCustomRsmInput 
                          ? 'bg-primary text-white' 
                          : 'bg-surface text-text border border-border'
                      }`}
                    >
                      Custom Employee #
                    </button>
                  </div>
                  {isCustomRsmInput ? (
                    <input
                      type="number"
                      value={tempValues.coeRSM || ''}
                      onChange={(e) => handleTempValueChange('coeRSM', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                      placeholder="Enter Employee Number"
                    />
                  ) : (
                    <select
                      value={tempValues.coeRSM || ''}
                      onChange={(e) => handleTempValueChange('coeRSM', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                    >
                      <option value="">Select RSM...</option>
                      {availableRsms.map(rsm => (
                        <option key={rsm.empNum} value={rsm.empNum}>
                          {rsm.name} (#{rsm.empNum})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={coeRsmEmployee ? coeRsmEmployee.name : (company.coeRSM ? company.coeRSM : "-")}
                  readOnly
                  className="w-full bg-foreground text-text focus:outline-none px-2 py-1 placeholder:text-text-muted/50"
                />
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-2">
        <div className="bg-foreground px-4 pt-2 rounded-lg border border-border">
          <div className="flex space-x-8 text-sm">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'overview' 
                  ? 'border-primary/50 text-primary' 
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'addresses' 
                  ? 'border-primary/50 text-primary' 
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Addresses
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'interactions'
                  ? 'border-primary/50 text-primary'
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Interaction History
            </button>
            <button
              onClick={() => setActiveTab('purchase-history')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'purchase-history'
                  ? 'border-primary/50 text-primary'
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Purchase History
            </button>
            <button
              onClick={() => setActiveTab('credit')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'credit'
                  ? 'border-primary/50 text-primary'
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Credit Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-primary/50 text-primary'
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Notes
            </button>
            <button
              onClick={() => setActiveTab('relationships')}
              className={`pb-2 border-b-2 font-semibold cursor-pointer ${
                activeTab === 'relationships'
                  ? 'border-primary/50 text-primary'
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}>
              Relationships
            </button>
          </div>
        </div>
        <div className="flex-1 flex mt-2 space-x-2 overflow-auto">
          {activeTab === 'overview' ? (
            <section className="flex-1 space-y-2">
            {/* Contacts Table */}
            <div
              className="bg-foreground rounded-lg border border-border p-4"
              style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text">
                  Contacts ({(() => {
                    let filteredContacts = showInactiveContacts
                      ? companyContacts
                      : companyContacts.filter(contact =>
                          contact.type !== ContactType.Inactive &&
                          contact.type !== ContactType.Left_Company
                        );

                    // Apply search filter for count
                    if (contactSearchTerm.trim()) {
                      const searchTerm = contactSearchTerm.toLowerCase().trim();
                      filteredContacts = filteredContacts.filter(contact => {
                        const fullName = getContactName(contact).toLowerCase();
                        const email = (contact.email || "").toLowerCase();
                        const phone = (contact.phone || "").toLowerCase();
                        const title = (contact.title || "").toLowerCase();
                        const type = getContactTypeName(contact.type).toLowerCase();
                        
                        return fullName.includes(searchTerm) ||
                               email.includes(searchTerm) ||
                               phone.includes(searchTerm) ||
                               title.includes(searchTerm) ||
                               type.includes(searchTerm);
                      });
                    }
                    
                    return filteredContacts.length;
                  })()})
                </h4>
                <button 
                  type="button"
                  onClick={handleAddContact}
                  className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
                  + Add Contact
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Search contacts"
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                  className="border border-border bg-background text-text rounded px-3 py-1 text-sm w-64 placeholder:text-text-muted"
                />
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactiveContacts}
                    onChange={(e) => setShowInactiveContacts(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Show inactive contacts</span>
                </label>
              </div>
              
              {/* New Contact Form */}
              {isAddingContact && (
                <div className="bg-surface p-3 rounded border border-primary mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">First Name</label>
                        <input
                          type="text"
                          value={newContactData.firstName || ''}
                          onChange={(e) => handleNewContactDataChange('firstName', e.target.value)}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Last Name</label>
                        <input
                          type="text"
                          value={newContactData.lastName || ''}
                          onChange={(e) => handleNewContactDataChange('lastName', e.target.value)}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
                        <input
                          type="text"
                          value={newContactData.title || ''}
                          onChange={(e) => handleNewContactDataChange('title', e.target.value)}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          placeholder="Job title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
                        <input
                          type="email"
                          value={newContactData.email || ''}
                          onChange={(e) => handleNewContactDataChange('email', e.target.value)}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={newContactData.phone || ''}
                          onChange={(e) => handleNewContactDataChange('phone', e.target.value)}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Extension</label>
                        <input
                          type="text"
                          value={newContactData.phoneExtension || ''}
                          onChange={(e) => handleNewContactDataChange('phoneExtension', e.target.value)}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          placeholder="Ext"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-xs text-text-muted">
                        New Contact
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveNewContact}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary-outline"
                          size="sm"
                          onClick={handleCancelNewContact}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-foreground z-10">
                    <tr className="text-text-muted border-b border-border">
                      <th className="text-left py-2">NAME</th>
                      <th className="text-left py-2">TYPE</th>
                      <th className="text-left py-2">EMAIL</th>
                      <th className="text-left py-2">PHONE NUMBER</th>
                      <th className="text-left py-2 w-24">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let filteredContacts = showInactiveContacts
                        ? companyContacts
                        : companyContacts.filter(contact =>
                            contact.type !== ContactType.Inactive &&
                            contact.type !== ContactType.Left_Company
                          );

                      // Apply search filter
                      if (contactSearchTerm.trim()) {
                        const searchTerm = contactSearchTerm.toLowerCase().trim();
                        filteredContacts = filteredContacts.filter(contact => {
                          const fullName = getContactName(contact).toLowerCase();
                          const email = (contact.email || "").toLowerCase();
                          const phone = (contact.phone || "").toLowerCase();
                          const title = (contact.title || "").toLowerCase();
                          const type = getContactTypeName(contact.type).toLowerCase();

                          return fullName.includes(searchTerm) ||
                                 email.includes(searchTerm) ||
                                 phone.includes(searchTerm) ||
                                 title.includes(searchTerm) ||
                                 type.includes(searchTerm);
                        });
                      }

                      return filteredContacts.length > 0 ? (
                        filteredContacts.map((contact, index) => {
                        const fullName = getContactName(contact);
                        const contactInitial = getContactInitial(fullName);
                        const uniqueKey = `contact-${contact.id}-${index}`;
                        const isEditing = editingContactId === contact.id;
                        const displayData = isEditing ? editingContactData : contact;
                        
                        return (
                          <tr key={uniqueKey} className="border-b border-border">
                            <td className="py-2">
                              <div className="flex items-center">
                                <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-primary text-xs font-bold">{contactInitial}</span>
                                </span>
                                <div className="flex flex-col flex-1">
                                  {isEditing ? (
                                    <>
                                      <input
                                        type="text"
                                        value={editingContactData.firstName || ''}
                                        onChange={(e) => handleContactDataChange('firstName', e.target.value)}
                                        className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary mb-1"
                                        placeholder="First name"
                                      />
                                      <input
                                        type="text"
                                        value={editingContactData.lastName || ''}
                                        onChange={(e) => handleContactDataChange('lastName', e.target.value)}
                                        className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary mb-1"
                                        placeholder="Last name"
                                      />
                                      <input
                                        type="text"
                                        value={editingContactData.title || ''}
                                        onChange={(e) => handleContactDataChange('title', e.target.value)}
                                        className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                        placeholder="Title"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <Link
                                        to={`/sales/contacts/${contact.id}`}
                                        className="text-primary hover:underline"
                                      >
                                        {fullName || "Unnamed Contact"}
                                      </Link>
                                      {contact.title && (
                                        <span className="text-xs text-text-muted">
                                          {contact.title}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <select
                                  value={editingContactData.type || ''}
                                  onChange={(e) => handleContactDataChange('type', e.target.value)}
                                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
                                >
                                  <option value="">Select Type</option>
                                  <option value={ContactType.Accounting}>Accounting</option>
                                  <option value={ContactType.Engineering}>Engineering</option>
                                  <option value={ContactType.Inactive}>Inactive</option>
                                  <option value={ContactType.Left_Company}>Left Company</option>
                                  <option value={ContactType.Parts_Service}>Parts/Service</option>
                                  <option value={ContactType.Sales}>Sales</option>
                                </select>
                              ) : (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getContactTypeColor(displayData.type)}`}>
                                  {getContactTypeName(displayData.type)}
                                </span>
                              )}
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editingContactData.email || ''}
                                  onChange={(e) => handleContactDataChange('email', e.target.value)}
                                  className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-full"
                                  placeholder="email@example.com"
                                />
                              ) : (
                                displayData.email ? (
                                  <a href={`mailto:${displayData.email}`} className="text-info hover:underline">
                                    {displayData.email}
                                  </a>
                                ) : (
                                  <span className="text-text">--</span>
                                )
                              )}
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <input
                                    type="tel"
                                    value={editingContactData.phone || ''}
                                    onChange={(e) => handleContactDataChange('phone', e.target.value)}
                                    className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary flex-1"
                                    placeholder="Phone number"
                                  />
                                  <input
                                    type="text"
                                    value={editingContactData.phoneExtension || ''}
                                    onChange={(e) => handleContactDataChange('phoneExtension', e.target.value)}
                                    className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-16"
                                    placeholder="Ext"
                                  />
                                </div>
                              ) : (
                                displayData.phone ? (
                                  <a href={`tel:${displayData.phone}`} className="text-text hover:underline">
                                    {displayData.phone}
                                    {displayData.phoneExtension && ` ext. ${displayData.phoneExtension}`}
                                  </a>
                                ) : (
                                  <span className="text-text">--</span>
                                )
                              )}
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveContact}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={handleCancelContactEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={() => handleEditContact(contact)}
                                  >
                                    <Edit size={12} />
                                  </Button>
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={() => setMarkInactiveContact(contact)}
                                    className="border-red-300 hover:bg-red-50 hover:border-red-400"
                                  >
                                    <UserX size={12} className="text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-text-muted">
                            {contactSearchTerm.trim()
                              ? `No contacts found matching "${contactSearchTerm}"`
                              : companyContacts.length > 0 && !showInactiveContacts
                              ? "No active contacts found. Check 'Show inactive contacts' to see all contacts."
                              : "No contacts found for this company"
                            }
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Journeys */}
            <div
              className="bg-foreground rounded-lg border border-border p-4"
              style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text">Journeys ({companyJourneys.length})</h4>
                <button 
                  type="button"
                  onClick={() => setIsJourneyModalOpen(true)}
                  className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
                  + Add Journey
                </button>
              </div>
              {companyJourneys.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {companyJourneys.map((journey, index) => {
                    const uniqueKey = `journey-${journey.id || journey.customerId}-${index}`;
                    return (
                      <div 
                        key={uniqueKey} 
                        className="bg-surface p-3 rounded border cursor-pointer hover:bg-surface/80 transition-colors"
                        onClick={() => navigate(`/sales/pipeline/${journey.id}`)}
                      >
                        <div className="font-semibold text-sm text-text mb-1">{journey.name}</div>
                        <div className="text-xs text-text-muted mb-1">
                          Amount: {formatCurrency(journey.value)}
                        </div>
                        {journey.expectedDecisionDate && (
                          <div className="text-xs text-text-muted mb-1">
                            Expected decision: {formatDate(journey.expectedDecisionDate)}
                          </div>
                        )}
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
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-text-muted">
                  No journeys found for this company
                </div>
              )}
              {companyJourneys.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border">
                  <div className="text-xs text-text-muted">
                    Total Pipeline Value: {formatCurrency(companyJourneys.reduce((sum, j) => sum + (j.value || 0), 0))}
                  </div>
                </div>
              )}
            </div>
          </section>
          ) : activeTab === 'addresses' ? (
            <section className="flex-1 space-y-2">
              {/* Addresses */}
              <div
                className="bg-foreground rounded-lg border border-border p-4"
                style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text">Company Addresses ({companyAddresses.length})</h4>
                  <button 
                    type="button"
                    onClick={handleAddAddress}
                    className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
                    + Add Address
                  </button>
                </div>
                
                
                {companyAddresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyAddresses.map((address, index) => {
                      const isEditing = editingAddressId === address.Address_ID;
                      const displayData = isEditing ? editingAddressData : address;
                      
                      return (
                        <div key={`address-${address.Address_ID || index}`} className="bg-surface p-4 rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingAddressData.AddressName || ''}
                                  onChange={(e) => handleAddressDataChange('AddressName', e.target.value)}
                                  className="text-sm font-semibold bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-full mb-2"
                                  placeholder="Address name"
                                />
                              ) : (
                                displayData.AddressName && (
                                  <div className="text-sm font-semibold text-text mb-2">{displayData.AddressName}</div>
                                )
                              )}
                              
                              <div className="text-sm text-text space-y-1">
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={editingAddressData.Address1 || ''}
                                      onChange={(e) => handleAddressDataChange('Address1', e.target.value)}
                                      className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary mb-1"
                                      placeholder="Address line 1"
                                    />
                                    <input
                                      type="text"
                                      value={editingAddressData.Address2 || ''}
                                      onChange={(e) => handleAddressDataChange('Address2', e.target.value)}
                                      className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary mb-1"
                                      placeholder="Address line 2"
                                    />
                                    <input
                                      type="text"
                                      value={editingAddressData.Address3 || ''}
                                      onChange={(e) => handleAddressDataChange('Address3', e.target.value)}
                                      className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary mb-1"
                                      placeholder="Address line 3"
                                    />
                                    <div className="mb-1">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={editingAddressData.ZipCode || ''}
                                          onChange={(e) => handleAddressDataChange('ZipCode', e.target.value)}
                                          onKeyDown={handleKeyDown}
                                          className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-full pr-8"
                                          placeholder="ZIP code"
                                        />
                                        {isEditLookingUpZip && (
                                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {editZipLookupResults.city.length > 1 ? (
                                        <select
                                          value={editingAddressData.City || ''}
                                          onChange={(e) => handleAddressDataChange('City', e.target.value)}
                                          className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                        >
                                          {editZipLookupResults.city.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="relative w-full">
                                          <input
                                            type="text"
                                            value={editingAddressData.City || ''}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-sm bg-surface border border-border rounded px-2 py-1 pr-7 text-text-muted focus:outline-none cursor-not-allowed"
                                            placeholder="City"
                                            readOnly
                                            title="City is automatically populated from ZIP code"
                                          />
                                          <Lock size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                      )}
                                      {editZipLookupResults.stateProv.length > 1 ? (
                                        <select
                                          value={editingAddressData.State || ''}
                                          onChange={(e) => handleAddressDataChange('State', e.target.value)}
                                          className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                        >
                                          {editZipLookupResults.stateProv.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="relative w-full">
                                          <input
                                            type="text"
                                            value={editingAddressData.State || ''}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-sm bg-surface border border-border rounded px-2 py-1 pr-7 text-text-muted focus:outline-none cursor-not-allowed"
                                            placeholder="State"
                                            readOnly
                                            title="State is automatically populated from ZIP code"
                                          />
                                          <Lock size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1">
                                      {editZipLookupResults.country.length > 1 ? (
                                        <select
                                          value={editingAddressData.Country || ''}
                                          onChange={(e) => handleAddressDataChange('Country', e.target.value)}
                                          className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-full"
                                        >
                                          {editZipLookupResults.country.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="relative w-full">
                                          <input
                                            type="text"
                                            value={editingAddressData.Country || ''}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-sm bg-surface border border-border rounded px-2 py-1 pr-7 text-text-muted focus:outline-none cursor-not-allowed"
                                            placeholder="Country"
                                            readOnly
                                            title="Country is automatically populated from ZIP code"
                                          />
                                          <Lock size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {displayData.Address1 && <div>{displayData.Address1}</div>}
                                    {displayData.Address2 && <div>{displayData.Address2}</div>}
                                    {displayData.Address3 && <div>{displayData.Address3}</div>}
                                    {(displayData.City || displayData.State || displayData.ZipCode) && (
                                      <div className="font-medium">
                                        {[displayData.City, displayData.State, displayData.ZipCode].filter(Boolean).join(', ')}
                                      </div>
                                    )}
                                    {displayData.Country && displayData.Country !== 'USA' && (
                                      <div className="font-medium">{displayData.Country}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <div className="text-xs text-text-muted">ID: {address.Address_ID}</div>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveAddress}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={handleCancelAddressEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="secondary-outline"
                                  size="sm"
                                  onClick={() => handleEditAddress(address)}
                                >
                                  <Edit size={12} />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-3 mb-3">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="tel"
                                  value={editingAddressData.PhoneNumber || ''}
                                  onChange={(e) => handleAddressDataChange('PhoneNumber', e.target.value)}
                                  className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                  placeholder="Phone number"
                                />
                                <input
                                  type="tel"
                                  value={editingAddressData.FaxPhoneNum || ''}
                                  onChange={(e) => handleAddressDataChange('FaxPhoneNum', e.target.value)}
                                  className="text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                  placeholder="Fax number"
                                />
                              </div>
                              <input
                                type="email"
                                value={editingAddressData.EmailInvoiceTo || ''}
                                onChange={(e) => handleAddressDataChange('EmailInvoiceTo', e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                placeholder="Invoice email"
                              />
                              <input
                                type="number"
                                value={editingAddressData.BillToNum || ''}
                                onChange={(e) => handleAddressDataChange('BillToNum', e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                placeholder="Bill to number"
                              />
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingAddressData.CanShip == 1 || editingAddressData.CanShip === true}
                                    onChange={(e) => {
                                      const newValue = e.target.checked ? 1 : 0;
                                      console.log('Edit CanShip checkbox changed to:', newValue);
                                      handleAddressDataChange('CanShip', newValue);
                                    }}
                                    className="rounded border-border text-primary focus:ring-primary"
                                  />
                                  <span>Can Ship</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingAddressData.CanBill == 1 || editingAddressData.CanBill === true}
                                    onChange={(e) => {
                                      const newValue = e.target.checked ? 1 : 0;
                                      console.log('Edit CanBill checkbox changed to:', newValue);
                                      handleAddressDataChange('CanBill', newValue);
                                    }}
                                    className="rounded border-border text-primary focus:ring-primary"
                                  />
                                  <span>Can Bill</span>
                                </label>
                              </div>
                              <textarea
                                value={editingAddressData.Notes || ''}
                                onChange={(e) => handleAddressDataChange('Notes', e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary resize-none"
                                rows={2}
                                placeholder="Notes"
                              />
                              <textarea
                                value={editingAddressData.ShipInstr || ''}
                                onChange={(e) => handleAddressDataChange('ShipInstr', e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary resize-none"
                                rows={2}
                                placeholder="Shipping instructions"
                              />
                              <textarea
                                value={editingAddressData.Directions || ''}
                                onChange={(e) => handleAddressDataChange('Directions', e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary resize-none"
                                rows={2}
                                placeholder="Directions"
                              />
                            </div>
                          ) : (
                            <>
                              {(displayData.PhoneNumber || displayData.FaxPhoneNum) && (
                                <div className="text-sm text-text-muted space-y-1 mb-3 py-2 border-y border-border">
                                  {displayData.PhoneNumber && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">📞</span>
                                      <a href={`tel:${displayData.PhoneNumber}`} className="text-info hover:underline">
                                        {displayData.PhoneNumber}
                                      </a>
                                    </div>
                                  )}
                                  {displayData.FaxPhoneNum && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">📠</span>
                                      <span>{displayData.FaxPhoneNum}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {((displayData.CanShip == 1 || displayData.CanShip === true) || (displayData.CanBill == 1 || displayData.CanBill === true) || (displayData.BillToNum != null && displayData.BillToNum !== 0)) && (
                                <div className="space-y-2 mb-3">
                                  <div className="flex flex-wrap gap-2">
                                    {(displayData.CanShip == 1 || displayData.CanShip === true) && (
                                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                        ✅ Can Ship
                                      </span>
                                    )}
                                    {(displayData.CanBill == 1 || displayData.CanBill === true) && (
                                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        💳 Can Bill
                                      </span>
                                    )}
                                  </div>
                                  {displayData.BillToNum != null && displayData.BillToNum !== 0 && (
                                    <div className="text-xs text-text-muted">
                                      <span className="font-medium">Bill To #:</span> {displayData.BillToNum}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {displayData.EmailInvoiceTo && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-text-muted mb-1">Invoice Email:</div>
                                  <div className="text-sm space-y-1">
                                    {displayData.EmailInvoiceTo.split(']').filter((part: string) => part.trim()).map((part: string, idx: number) => {
                                      const cleanedPart = part.replace(/[^a-zA-Z0-9@._\-+\[\] ]/g, '').trim();
                                      const match = cleanedPart.match(/^(.*?)\[([^\]]+)$/);
                                      if (match) {
                                        const description = match[1].trim();
                                        const email = match[2].trim();
                                        return (
                                          <div key={idx} className="break-all">
                                            {description && <span className="text-text">{description}: </span>}
                                            <a href={`mailto:${email}`} className="text-info hover:underline">
                                              {email}
                                            </a>
                                          </div>
                                        );
                                      } else {
                                        const displayText = cleanedPart.replace(/[\[\]]/g, '').trim();
                                        return displayText ? (
                                          <div key={idx} className="text-text break-all">
                                            {displayText}
                                          </div>
                                        ) : null;
                                      }
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {displayData.Notes && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-text-muted mb-1">Notes:</div>
                                  <div className="text-sm text-text bg-background p-2 rounded border">
                                    {displayData.Notes}
                                  </div>
                                </div>
                              )}
                              
                              {displayData.ShipInstr && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-text-muted mb-1">Shipping Instructions:</div>
                                  <div className="text-sm text-text bg-background p-2 rounded border">
                                    {displayData.ShipInstr}
                                  </div>
                                </div>
                              )}
                              
                              {displayData.Directions && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-text-muted mb-1">Directions:</div>
                                  <div className="text-sm text-text bg-background p-2 rounded border">
                                    {displayData.Directions}
                                  </div>
                                </div>
                              )}
                              
                              {displayData.SystemNotes && (
                                <div>
                                  <div className="text-xs font-medium text-text-muted mb-1">System Notes:</div>
                                  <div className="text-xs text-text-muted bg-background p-2 rounded border">
                                    {displayData.SystemNotes}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl text-text-muted/50 mb-4">🏢</div>
                    <div className="text-text-muted">No addresses found for this company</div>
                  </div>
                )}
              </div>
            </section>
          ) : activeTab === 'interactions' ? (
            <section className="flex-1 space-y-2">
              {/* Interaction History - Call History */}
              <div
                className="bg-foreground rounded-lg border border-border p-4"
                style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text">Call History ({callHistory.length})</h4>
                  <button 
                    type="button"
                    onClick={handleAddCall}
                    className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
                    + Add Call
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search call history"
                  className="border border-border bg-background text-text rounded px-3 py-1 text-sm mb-4 w-64 placeholder:text-text-muted"
                />
                
                {/* New Call Form */}
                {isAddingCall && (
                  <div className="bg-surface p-3 rounded border border-primary mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={newCallData.Contactname || ''}
                            onChange={(e) => handleNewCallDataChange('Contactname', e.target.value)}
                            className="text-sm font-medium bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                            placeholder="Contact name"
                          />
                          
                          <select
                            value={newCallData.CallStatus || 'O'}
                            onChange={(e) => handleNewCallDataChange('CallStatus', e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-border bg-background text-text focus:outline-none focus:border-primary"
                          >
                            <option value="O">Open</option>
                            <option value="C">Closed</option>
                            <option value="F">Follow-up</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="text-xs text-text-muted">
                            <span className="font-medium">Date:</span> {formatDate(newCallData.CallDate)}
                          </div>
                          
                          <input
                            type="tel"
                            value={newCallData.PhoneNumber || ''}
                            onChange={(e) => handleNewCallDataChange('PhoneNumber', e.target.value)}
                            className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                            placeholder="Phone number"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <select
                            value={newCallData.CallType || 'T'}
                            onChange={(e) => handleNewCallDataChange('CallType', e.target.value)}
                            className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                          >
                            <option value="T">Technical</option>
                            <option value="S">Sales</option>
                            <option value="G">General</option>
                          </select>
                          
                          <input
                            type="text"
                            value={newCallData.CallOwner || ''}
                            onChange={(e) => handleNewCallDataChange('CallOwner', e.target.value)}
                            className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                            placeholder="Call owner"
                          />
                        </div>

                        <input
                          type="email"
                          value={newCallData.CustEmail || ''}
                          onChange={(e) => handleNewCallDataChange('CustEmail', e.target.value)}
                          className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-full mb-2"
                          placeholder="Customer email"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-text-muted">
                          New Call
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveNewCall}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={handleCancelNewCall}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-xs font-medium text-text-muted mb-1">Customer Comments:</div>
                      <textarea
                        value={newCallData.CustComments || ''}
                        onChange={(e) => handleNewCallDataChange('CustComments', e.target.value)}
                        className="w-full text-xs bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none"
                        rows={3}
                        placeholder="Customer comments..."
                      />
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-xs font-medium text-text-muted mb-1">Our Comments:</div>
                      <textarea
                        value={newCallData.OurComments || ''}
                        onChange={(e) => handleNewCallDataChange('OurComments', e.target.value)}
                        className="w-full text-xs bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none"
                        rows={3}
                        placeholder="Our comments..."
                      />
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-xs font-medium text-text-muted mb-1">Resolution:</div>
                      <textarea
                        value={newCallData.Resolution || ''}
                        onChange={(e) => handleNewCallDataChange('Resolution', e.target.value)}
                        className="w-full text-xs bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none"
                        rows={2}
                        placeholder="Resolution..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        value={newCallData.Issues || ''}
                        onChange={(e) => handleNewCallDataChange('Issues', e.target.value)}
                        className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                        placeholder="Issues"
                      />
                      <input
                        type="text"
                        value={newCallData.ServiceCodes || ''}
                        onChange={(e) => handleNewCallDataChange('ServiceCodes', e.target.value)}
                        className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                        placeholder="Service codes"
                      />
                      <input
                        type="text"
                        value={newCallData.RefEquipment || ''}
                        onChange={(e) => handleNewCallDataChange('RefEquipment', e.target.value)}
                        className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                        placeholder="Equipment"
                      />
                    </div>
                  </div>
                )}
                
                {callHistory.length > 0 ? (
                  <div className="space-y-3 max-h-120 overflow-y-auto">
                    {callHistory.map((call, index) => {
                      const isEditing = editingCallId === call.CallRefNum;
                      const displayData = isEditing ? editingCallData : call;
                      const callDate = displayData.CallDate ? formatDate(displayData.CallDate) : 'Unknown Date';
                      const callTime = displayData.CallTime && displayData.CallTime !== 0 ? String(displayData.CallTime).padStart(6, '0').replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') : '';
                      const followupDate = displayData.FollowupDate ? formatDate(displayData.FollowupDate) : null;
                      const uniqueKey = `call-${call.CallRefNum || index}`;
                      
                      return (
                        <div key={uniqueKey} className="bg-surface p-3 rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingCallData.Contactname || ''}
                                    onChange={(e) => handleCallDataChange('Contactname', e.target.value)}
                                    className="text-sm font-medium bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                    placeholder="Contact name"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-text">
                                    {(displayData.Contactname && displayData.Contactname.trim()) || 'Unknown Contact'}
                                  </span>
                                )}
                                
                                {isEditing ? (
                                  <select
                                    value={editingCallData.CallStatus || ''}
                                    onChange={(e) => handleCallDataChange('CallStatus', e.target.value)}
                                    className="text-xs px-2 py-1 rounded border border-border bg-background text-text focus:outline-none focus:border-primary"
                                  >
                                    <option value="O">Open</option>
                                    <option value="C">Closed</option>
                                    <option value="F">Follow-up</option>
                                  </select>
                                ) : (
                                  displayData.CallStatus && displayData.CallStatus.trim() && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      displayData.CallStatus === 'O' ? 'bg-yellow-100 text-yellow-800' :
                                      displayData.CallStatus === 'C' ? 'bg-green-100 text-green-800' :
                                      displayData.CallStatus === 'F' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {displayData.CallStatus === 'O' ? 'Open' : 
                                       displayData.CallStatus === 'C' ? 'Closed' : 
                                       displayData.CallStatus === 'F' ? 'Follow-up' : displayData.CallStatus}
                                    </span>
                                  )
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="text-xs text-text-muted">
                                  <span className="font-medium">Date:</span> {callDate}{callTime && ` at ${callTime}`}
                                </div>
                                
                                {isEditing ? (
                                  <input
                                    type="tel"
                                    value={editingCallData.PhoneNumber || ''}
                                    onChange={(e) => handleCallDataChange('PhoneNumber', e.target.value)}
                                    className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                    placeholder="Phone number"
                                  />
                                ) : (
                                  displayData.PhoneNumber && displayData.PhoneNumber.trim() && (
                                    <div className="text-xs text-text-muted">
                                      <span className="font-medium">Phone:</span> {displayData.PhoneNumber}
                                    </div>
                                  )
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {isEditing ? (
                                  <select
                                    value={editingCallData.CallType || ''}
                                    onChange={(e) => handleCallDataChange('CallType', e.target.value)}
                                    className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                  >
                                    <option value="">Select type...</option>
                                    <option value="T">Technical</option>
                                    <option value="S">Sales</option>
                                    <option value="G">General</option>
                                  </select>
                                ) : (
                                  displayData.CallType && displayData.CallType.trim() && (
                                    <div className="text-xs text-text-muted">
                                      <span className="font-medium">Type:</span> {displayData.CallType === 'T' ? 'Technical' : displayData.CallType}
                                    </div>
                                  )
                                )}
                                
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingCallData.CallOwner || ''}
                                    onChange={(e) => handleCallDataChange('CallOwner', e.target.value)}
                                    className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                    placeholder="Call owner"
                                  />
                                ) : (
                                  displayData.CallOwner && displayData.CallOwner.trim() && (
                                    <div className="text-xs text-text-muted">
                                      <span className="font-medium">Owner:</span> {displayData.CallOwner}
                                    </div>
                                  )
                                )}
                              </div>

                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editingCallData.CustEmail || ''}
                                  onChange={(e) => handleCallDataChange('CustEmail', e.target.value)}
                                  className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary w-full mb-2"
                                  placeholder="Customer email"
                                />
                              ) : (
                                displayData.CustEmail && displayData.CustEmail.trim() && (
                                  <div className="text-xs text-text-muted mb-2">
                                    <span className="font-medium">Email:</span> 
                                    <a href={`mailto:${displayData.CustEmail}`} className="text-info hover:underline ml-1">
                                      {displayData.CustEmail}
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-text-muted">
                                #{displayData.CallRefNum || 'N/A'}
                              </div>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveCall}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={handleCancelCallEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={() => handleEditCall(call)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCall(call)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <>
                              <div className="mb-2">
                                <div className="text-xs font-medium text-text-muted mb-1">Customer Comments:</div>
                                <textarea
                                  value={editingCallData.CustComments || ''}
                                  onChange={(e) => handleCallDataChange('CustComments', e.target.value)}
                                  className="w-full text-xs bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none"
                                  rows={3}
                                  placeholder="Customer comments..."
                                />
                              </div>
                              
                              <div className="mb-2">
                                <div className="text-xs font-medium text-text-muted mb-1">Our Comments:</div>
                                <textarea
                                  value={editingCallData.OurComments || ''}
                                  onChange={(e) => handleCallDataChange('OurComments', e.target.value)}
                                  className="w-full text-xs bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none"
                                  rows={3}
                                  placeholder="Our comments..."
                                />
                              </div>
                              
                              <div className="mb-2">
                                <div className="text-xs font-medium text-text-muted mb-1">Resolution:</div>
                                <textarea
                                  value={editingCallData.Resolution || ''}
                                  onChange={(e) => handleCallDataChange('Resolution', e.target.value)}
                                  className="w-full text-xs bg-background border border-border rounded p-2 text-text focus:outline-none focus:border-primary resize-none"
                                  rows={2}
                                  placeholder="Resolution..."
                                />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                <input
                                  type="text"
                                  value={editingCallData.Issues || ''}
                                  onChange={(e) => handleCallDataChange('Issues', e.target.value)}
                                  className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                  placeholder="Issues"
                                />
                                <input
                                  type="text"
                                  value={editingCallData.ServiceCodes || ''}
                                  onChange={(e) => handleCallDataChange('ServiceCodes', e.target.value)}
                                  className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                  placeholder="Service codes"
                                />
                                <input
                                  type="text"
                                  value={editingCallData.RefEquipment || ''}
                                  onChange={(e) => handleCallDataChange('RefEquipment', e.target.value)}
                                  className="text-xs bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                                  placeholder="Equipment"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              {displayData.CustComments && displayData.CustComments.trim() && (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-text-muted mb-1">Customer Comments:</div>
                                  <div className="text-xs text-text bg-background p-2 rounded border">
                                    {displayData.CustComments}
                                  </div>
                                </div>
                              )}
                              
                              {displayData.OurComments && displayData.OurComments.trim() && (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-text-muted mb-1">Our Comments:</div>
                                  <div className="text-xs text-text bg-background p-2 rounded border">
                                    {displayData.OurComments}
                                  </div>
                                </div>
                              )}
                              
                              {displayData.Resolution && displayData.Resolution.trim() && (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-text-muted mb-1">Resolution:</div>
                                  <div className="text-xs text-text bg-background p-2 rounded border">
                                    {displayData.Resolution}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          
                          {followupDate && (
                            <div className="text-xs text-text-muted mt-2 pt-2 border-t border-border">
                              <span className="font-medium">Follow-up:</span> {followupDate}
                              {displayData.FollowupTime && displayData.FollowupTime !== 0 && ` at ${String(displayData.FollowupTime).padStart(6, '0').replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3')}`}
                            </div>
                          )}
                          
                          {!isEditing && ((displayData.Issues && displayData.Issues.trim()) || 
                            (displayData.ServiceCodes && displayData.ServiceCodes.trim()) || 
                            (displayData.RefEquipment && displayData.RefEquipment.trim())) && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
                              {displayData.Issues && displayData.Issues.trim() && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                  Issue: {displayData.Issues}
                                </span>
                              )}
                              {displayData.ServiceCodes && displayData.ServiceCodes.trim() && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  Service: {displayData.ServiceCodes}
                                </span>
                              )}
                              {displayData.RefEquipment && displayData.RefEquipment.trim() && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                  Equipment: {displayData.RefEquipment}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <svg
                      className="w-12 h-12 text-text-muted/50 mb-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <div className="text-text-muted">No call history found.</div>
                  </div>
                )}
              </div>
            </section>
          ) : activeTab === 'purchase-history' ? (
            <section className="flex-1 flex flex-col overflow-hidden">
              <div
                className="bg-foreground rounded-lg border border-border p-4 flex-1 flex flex-col overflow-hidden"
                style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text">Purchase History ({purchaseHistory.length} jobs)</h4>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {purchaseHistory.length > 0 ? (
                    <div className="space-y-4">
                      {purchaseHistory.map((job, index) => (
                        <div key={`job-${job.jobNumber}-${index}`} className="bg-surface p-4 rounded border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-semibold text-text">
                                  Job #{job.jobNumber}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  job.jobStatus === 'A' ? 'bg-blue-100 text-blue-800' :
                                  job.jobStatus === 'C' ? 'bg-green-100 text-green-800' :
                                  job.jobStatus === 'S' ? 'bg-yellow-100 text-yellow-800' :
                                  job.jobStatus === 'X' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {job.jobStatus === 'A' ? 'Active' :
                                   job.jobStatus === 'C' ? 'Closed' :
                                   job.jobStatus === 'S' ? 'Suggested' :
                                   job.jobStatus === 'X' ? 'Cancelled' :
                                   job.jobStatus || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {job.suffixes && job.suffixes.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-text-muted mb-2">Items:</div>
                              <div className="space-y-2">
                                {job.suffixes.map((suffix: any, suffixIndex: number) => (
                                  <div key={`suffix-${index}-${suffixIndex}`} className="bg-background p-3 rounded border border-border">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="text-sm text-text mb-1">
                                          {suffix.description || 'No description'}
                                        </div>
                                      </div>
                                      <div className="text-sm font-medium text-text ml-4">
                                        {suffix.cost ? formatCurrency(suffix.cost) : '-'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 mt-2 border-t border-border">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-text-muted">Total:</span>
                                  <span className="text-sm font-semibold text-text">
                                    {formatCurrency(job.suffixes.reduce((sum: number, suffix: any) => sum + (suffix.cost || 0), 0))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-text-muted">No items found for this job</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <div className="text-4xl text-text-muted/50 mb-4">📦</div>
                      <div className="text-text-muted">No purchase history found for this company</div>
                    </div>
                  )}
                </div>

                {purchaseHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-text-muted">Grand Total:</span>
                      <span className="text-lg font-bold text-text">
                        {formatCurrency(
                          purchaseHistory.reduce((total, job) =>
                            total + (job.suffixes?.reduce((sum: number, suffix: any) => sum + (suffix.cost || 0), 0) || 0),
                          0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : activeTab === 'credit' ? (
            <section className="flex-1 space-y-2">
              {/* Credit Details */}
              <div
                className="bg-foreground rounded-lg border border-border p-4"
                style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text">Credit Information</h4>
                  {isEditingAll ? (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveAll}
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary-outline"
                        size="sm"
                        onClick={handleCancelAll}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleStartEditing}
                    >
                      <Edit size={16} />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit Status */}
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-medium">Credit Status</span>
                    {isEditingAll ? (
                      <select
                        value={tempValues.creditStatus || ''}
                        onChange={(e) => handleTempValueChange('creditStatus', e.target.value)}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                      >
                        <option value="">Select status...</option>
                        {CREDIT_STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full bg-surface text-text px-3 py-2 rounded border">
                        {company.creditStatus ? CREDIT_STATUS_OPTIONS.find(opt => opt.value === company.creditStatus)?.label || company.creditStatus : "-"}
                      </div>
                    )}
                  </div>

                  {/* Credit Limit */}
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-medium">Credit Limit</span>
                    {isEditingAll ? (
                      <input
                        type="number"
                        step="0.01"
                        value={tempValues.creditLimit || ''}
                        onChange={(e) => handleTempValueChange('creditLimit', e.target.value)}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                        placeholder="0.00"
                      />
                    ) : (
                      <div className="w-full bg-surface text-text px-3 py-2 rounded border">
                        {company.creditLimit ? formatCurrency(company.creditLimit) : "-"}
                      </div>
                    )}
                  </div>

                  {/* Account Balance */}
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-medium">Account Balance</span>
                    {isEditingAll ? (
                      <input
                        type="number"
                        step="0.01"
                        value={tempValues.acctBalance || ''}
                        onChange={(e) => handleTempValueChange('acctBalance', e.target.value)}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                        placeholder="0.00"
                      />
                    ) : (
                      <div className="w-full bg-surface text-text px-3 py-2 rounded border">
                        {company.acctBalance !== null && company.acctBalance !== undefined ? formatCurrency(company.acctBalance) : "-"}
                      </div>
                    )}
                  </div>

                  {/* Balance Date */}
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-medium">Balance Date</span>
                    {isEditingAll ? (
                      <input
                        type="date"
                        value={tempValues.balanceDate ? new Date(tempValues.balanceDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleTempValueChange('balanceDate', e.target.value)}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="w-full bg-surface text-text px-3 py-2 rounded border">
                        {company.balanceDate ? formatDate(company.balanceDate) : "-"}
                      </div>
                    )}
                  </div>

                  {/* Terms Code */}
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-medium">Terms Code</span>
                    {isEditingAll ? (
                      <select
                        value={tempValues.termsCode || ''}
                        onChange={(e) => handleTempValueChange('termsCode', e.target.value)}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                      >
                        <option value="">Select terms...</option>
                        {TERMS_CODE_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full bg-surface text-text px-3 py-2 rounded border">
                        {company.termsCode || "-"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Credit Note - Full Width */}
                <div className="flex flex-col gap-1 mt-6">
                  <span className="text-text-muted font-medium">Credit Note</span>
                  {isEditingAll ? (
                    <textarea
                      value={tempValues.creditNote || ''}
                      onChange={(e) => handleTempValueChange('creditNote', e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary resize-none"
                      rows={6}
                      placeholder="Enter credit note..."
                    />
                  ) : (
                    <div className="w-full bg-surface text-text px-3 py-2 rounded border min-h-[140px]">
                      {company.creditNote || "-"}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : activeTab === 'notes' ? (
            <section className="flex-1 space-y-2">
              {/* Notes Section */}
              <div
                className="bg-foreground rounded-lg border border-border p-4"
                style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text">Company Notes</h4>
                  {isEditingNotes ? (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveNotes}
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary-outline"
                        size="sm"
                        onClick={handleCancelNotesEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleStartEditingNotes}
                    >
                      <Edit size={16} />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-text-muted font-medium mb-2">Notes</span>
                  {isEditingNotes ? (
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary resize-none"
                      rows={20}
                      placeholder="Enter company notes..."
                    />
                  ) : (
                    <div className="w-full bg-surface text-text px-3 py-2 rounded border min-h-[400px] whitespace-pre-wrap">
                      {company.notes || "No notes available"}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : activeTab === 'relationships' ? (
            <section className="flex-1 space-y-2">
              <div
                className="bg-foreground rounded-lg border border-border p-4"
                style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-text">Company Relationships ({companyRelationships.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddRelationship}
                    className="text-xs text-info border border-info px-2 py-1 rounded hover:bg-info/10">
                    + Add Relationship
                  </button>
                </div>

                {isAddingRelationship && (
                  <div className="bg-surface p-4 rounded border border-primary mb-4">
                    <h5 className="text-sm font-semibold text-text mb-3">Add New Relationship</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Direction</label>
                        <select
                          value={newRelationshipData.direction || 'parent'}
                          onChange={(e) => setNewRelationshipData({ ...newRelationshipData, direction: e.target.value })}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary">
                          <option value="parent">{company.name} is parent of...</option>
                          <option value="child">{company.name} is child of...</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Related Company</label>
                        {newRelationshipData.relatedCompanyName ? (
                          <div className="flex items-center justify-between bg-background border border-border rounded px-2 py-1">
                            <span className="text-sm text-text">{newRelationshipData.relatedCompanyName}</span>
                            <button
                              type="button"
                              onClick={() => setNewRelationshipData({ ...newRelationshipData, relatedCompanyId: '', relatedCompanyName: '' })}
                              className="text-xs text-error hover:underline">
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={companySearchTerm}
                              onChange={(e) => {
                                setCompanySearchTerm(e.target.value);
                                handleSearchCompanies(e.target.value);
                              }}
                              className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary"
                              placeholder="Search for company by name..."
                            />
                            {isSearchingCompanies && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                              </div>
                            )}
                            {companySearchResults.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded shadow-lg max-h-48 overflow-y-auto">
                                {companySearchResults.map((result) => (
                                  <button
                                    key={result.Company_ID}
                                    type="button"
                                    onClick={() => handleSelectCompanyForRelationship(result)}
                                    className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface border-b border-border last:border-b-0">
                                    {result.CustDlrName} (ID: {result.Company_ID})
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Relationship Type</label>
                        <select
                          value={newRelationshipData.relationshipType || ''}
                          onChange={(e) => setNewRelationshipData({ ...newRelationshipData, relationshipType: e.target.value })}
                          className="w-full text-sm bg-background border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-primary">
                          <option value="">Select type...</option>
                          <option value="Subsidiary">Subsidiary</option>
                          <option value="Partner">Partner</option>
                          <option value="Branch">Branch</option>
                        </select>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveRelationship}>
                          Save Relationship
                        </Button>
                        <Button
                          variant="secondary-outline"
                          size="sm"
                          onClick={handleCancelRelationship}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {companyRelationships.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-foreground z-10">
                        <tr className="text-text-muted border-b border-border">
                          <th className="text-left py-2">RELATIONSHIP</th>
                          <th className="text-left py-2">TYPE</th>
                          <th className="text-left py-2 w-24">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyRelationships.map((relationship, index) => {
                          const relatedCompanyId = relationship.direction === 'parent'
                            ? relationship.childId
                            : relationship.parentId;
                          const relatedCompanyName = relationship.relatedCompanyName || `Company ${relatedCompanyId}`;

                          let relationshipLabel;
                          if (relationship.relationshipType === 'Partner') {
                            relationshipLabel = (
                              <>
                                Partnership with{' '}
                                <Link
                                  to={`/sales/companies/${relatedCompanyId}`}
                                  className="text-primary hover:underline">
                                  {relatedCompanyName}
                                </Link>
                              </>
                            );
                          } else if (relationship.relationshipType === 'Subsidiary') {
                            relationshipLabel = relationship.direction === 'parent' ? (
                              <>
                                {company.name} owns:{' '}
                                <Link
                                  to={`/sales/companies/${relatedCompanyId}`}
                                  className="text-primary hover:underline">
                                  {relatedCompanyName}
                                </Link>
                              </>
                            ) : (
                              <>
                                {company.name} is child to:{' '}
                                <Link
                                  to={`/sales/companies/${relatedCompanyId}`}
                                  className="text-primary hover:underline">
                                  {relatedCompanyName}
                                </Link>
                              </>
                            );
                          } else if (relationship.relationshipType === 'Branch') {
                            relationshipLabel = relationship.direction === 'parent' ? (
                              <>
                                {company.name} has branch:{' '}
                                <Link
                                  to={`/sales/companies/${relatedCompanyId}`}
                                  className="text-primary hover:underline">
                                  {relatedCompanyName}
                                </Link>
                              </>
                            ) : (
                              <>
                                {company.name} is branch of:{' '}
                                <Link
                                  to={`/sales/companies/${relatedCompanyId}`}
                                  className="text-primary hover:underline">
                                  {relatedCompanyName}
                                </Link>
                              </>
                            );
                          } else {
                            relationshipLabel = (
                              <>
                                Related to{' '}
                                <Link
                                  to={`/sales/companies/${relatedCompanyId}`}
                                  className="text-primary hover:underline">
                                  {relatedCompanyName}
                                </Link>
                              </>
                            );
                          }

                          return (
                            <tr key={`relationship-${relationship.id}-${index}`} className="border-b border-border">
                              <td className="py-2 text-text">
                                {relationshipLabel}
                              </td>
                              <td className="py-2">
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                  {relationship.relationshipType || 'Not specified'}
                                </span>
                              </td>
                              <td className="py-2">
                                <Button
                                  variant="secondary-outline"
                                  size="sm"
                                  onClick={() => handleDeleteRelationship(relationship)}
                                  className="border-red-300 hover:bg-red-50 hover:border-red-400">
                                  <Trash2 size={12} className="text-red-600" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    No relationships found for this company
                  </div>
                )}
              </div>
            </section>
          ) : null
        }</div>
      </main>

      {/* Journey Creation Modal */}
      {isJourneyModalOpen && (
        <CreateJourneyModal
          isOpen={isJourneyModalOpen}
          onClose={() => setIsJourneyModalOpen(false)}
          onSuccess={(newJourney) => {
            if (newJourney) {
              console.log('Raw new journey:', newJourney);
              const adaptedJourney = adaptLegacyJourney(newJourney);
              console.log('Adapted journey:', adaptedJourney);
              
              setCompanyJourneys(prev => [adaptedJourney, ...prev]);
              
              setNavigationModal({
                isOpen: true,
                journeyName: adaptedJourney.name || adaptedJourney.Project_Name || adaptedJourney.Target_Account || 'New Journey',
                journeyId: adaptedJourney.id
              });
            }
          }}
          availableRsms={availableRsms.map(rsm => ({ value: rsm.initials, label: `${rsm.name} (${rsm.initials})` }))}
          companyId={id}
          companyName={company?.name}
        />
      )}
      
      {/* Navigation Modal */}
      {navigationModal.isOpen && (
        <Modal
          isOpen={navigationModal.isOpen}
          onClose={() => setNavigationModal({ isOpen: false, journeyName: '', journeyId: '' })}
          title="Journey Created Successfully!"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-text">
              Journey "{navigationModal.journeyName}" has been created successfully.
            </p>
            <p className="text-text-muted text-sm">
              Would you like to open the journey details now?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => setNavigationModal({ isOpen: false, journeyName: '', journeyId: '' })}
              >
                Stay Here
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setNavigationModal({ isOpen: false, journeyName: '', journeyId: '' });
                  navigate(`/sales/pipeline/${navigationModal.journeyId}`);
                }}
              >
                Open Journey Details
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={isAddingAddress}
        onClose={handleCancelNewAddress}
        onAddressAdded={handleAddressAdded}
        companyId={id}
      />

      {/* Delete Contact Modal */}
      <DeleteContactModal
        isOpen={markInactiveContact !== null}
        onClose={() => setMarkInactiveContact(null)}
        onConfirm={handleMarkContactAs}
        contact={markInactiveContact}
        isUpdating={isMarkingInactive}
      />
    </div>
  );
};

const CreateJourneyModal = ({
  isOpen,
  onClose,
  onSuccess,
  availableRsms,
  companyId,
  companyName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJourney?: any) => void;
  availableRsms: { value: string; label: string }[];
  companyId?: string;
  companyName?: string;
}) => {
  const [name, setName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [journeyType, setJourneyType] = useState<string>("");
  const [rsm, setRsm] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [stateProv, setStateProv] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [leadSource, setLeadSource] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [actionDate, setActionDate] = useState<string>("");
  const [equipmentType, setEquipmentType] = useState<string>("");

  const { post, loading, error } = useApi();

  const handleCreate = async () => {
    if (!name || !journeyType || !rsm || !city || !stateProv || !country || !industry || !leadSource) {
      alert("Please fill in all required fields: Journey Name, Journey Type, RSM, City, State, Country, Industry, and Lead Source");
      return;
    }

    try {
      const payload = {
        Project_Name: name,
        Journey_Start_Date: startDate,
        Journey_Type: journeyType,
        RSM: rsm,
        City: city,
        State_Province: stateProv,
        Country: country,
        Industry: industry,
        Lead_Source: leadSource,
        Journey_Stage: "Lead",
        Notes: notes,
        Action_Date: actionDate,
        Equipment_Type: equipmentType,
        Company_ID: companyId ? parseInt(companyId) : undefined,
        Target_Account: companyName || '',
      };

      console.log("Journey payload:", payload);

      const result = await post("/legacy/std/Journey", payload);

      if (result) {
        const newJourney = {
          ...payload,
          ...result,
          CreateDT: new Date().toISOString(),
          Action_Date: actionDate || new Date().toISOString(),
          Journey_Value: 0,
          Priority: 'C',
          Quote_Number: '',
          Chance_To_Secure_order: null,
          Expected_Decision_Date: null,
          Quote_Presentation_Date: null,
          Date_PO_Received: null,
          Journey_Start_Date: startDate || new Date().toISOString(),
          Journey_Status: 'Active',
          RSM_Territory: '',
          Dealer: '',
          Dealer_Name: '',
          Dealer_ID: null,
          Qty_of_Items: 0,
        };
        onSuccess?.(newJourney);
        onClose();
        setName("");
        setStartDate("");
        setJourneyType("");
        setRsm("");
        setCity("");
        setStateProv("");
        setCountry("");
        setIndustry("");
        setLeadSource("");
        setNotes("");
        setActionDate("");
        setEquipmentType("");
      } else {
        console.error("Journey creation failed:", error);
      }
    } catch (error) {
      console.error("Error generating unique ID or creating journey:", error);
      alert("Failed to create journey. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Journey" size="md">
      <div className="flex flex-col max-h-[60vh]">
        <div className="overflow-y-auto pr-2 space-y-3 mb-2">
          <div className="space-y-1">
            <Input
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="Enter journey name"
              label="Journey Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Start Date</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Journey Type"
              placeholder="Select a journey type"
              required
              value={journeyType}
              onChange={(e) => setJourneyType(e.target.value)}
              options={[
                { value: "stamping", label: "Stamping" },
                { value: "CTL", label: "CTL" },
                { value: "roll_forming", label: "Roll Forming" },
                { value: "upgrade", label: "Upgrade" },
                { value: "parts", label: "Parts" },
                { value: "service", label: "Service" },
                { value: "retrofit", label: "Retrofit" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="RSM"
              placeholder="Select an RSM"
              required
              value={rsm}
              onChange={(e) => setRsm(e.target.value)}
              options={availableRsms.filter(rsm => rsm.value && rsm.value.trim())}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="City"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              required
              value={stateProv}
              onChange={(e) => setStateProv(e.target.value)}
            />
            <Select
              label="Country"
              placeholder="Select a country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: "usa", label: "USA" },
                { value: "canada", label: "Canada" },
                { value: "mexico", label: "Mexico" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Industry"
              placeholder="Select an industry"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={[
                { value: "Contract Stamping", label: "Contract Stamping" },
                { value: "Press OEM", label: "Press OEM" },
                { value: "Construction", label: "Construction" },
                { value: "Energy / Motors / Transformers", label: "Energy / Motors / Transformers" },
                { value: "Integrator", label: "Integrator" },
                { value: "Auto Tier 1 & 2", label: "Auto Tier 1 & 2" },
                { value: "Auto OEM", label: "Auto OEM" },
                { value: "Marine", label: "Marine" },
                { value: "Appliances", label: "Appliances" },
                { value: "Lawn Equipment", label: "Lawn Equipment" },
                { value: "Contract Rollforming", label: "Contract Rollforming" },
                { value: "HVAC / Air Handling", label: "HVAC / Air Handling" },
                { value: "Packaging", label: "Packaging" },
                { value: "Mobile Heavy Equipment / Locomotive", label: "Mobile Heavy Equipment / Locomotive" },
                { value: "Other", label: "Other" },
                { value: "Storage / Lockers / Hardware", label: "Storage / Lockers / Hardware" },
                { value: "Contract Fabricating", label: "Contract Fabricating" },
                { value: "Furniture & Components", label: "Furniture & Components" },
                { value: "Electrical Components / Lighting", label: "Electrical Components / Lighting" },
                { value: "RV / Trailers", label: "RV / Trailers" },
                { value: "Military / Defense", label: "Military / Defense" },
                { value: "Medical", label: "Medical" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Lead Source"
              placeholder="Select a lead source"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              required
              options={[
                { value: "coe_service", label: "Coe Service" },
                { value: "coe_website_contact_form", label: "Coe Website (contact form)" },
                { value: "coe_website_email_inquiry", label: "Coe Website (Email Inquiry)" },
                { value: "cold_call_new_customer", label: "Cold Call - New Customer" },
                { value: "cold_call_prior_customer", label: "Cold Call - Prior Customer" },
                { value: "customer_visit_current_customer", label: "Customer Visit (current customer)" },
                { value: "customer_visit_prior_customer", label: "Customer Visit (prior customer)" },
                { value: "dealer_lead", label: "Dealer Lead" },
                { value: "email_existing_customer", label: "Email - Existing Customer" },
                { value: "email_new_customer", label: "Email - New Customer" },
                { value: "event_fabtech", label: "Event - Fabtech" },
                { value: "event_fema", label: "Event - FEMA" },
                { value: "event_pma", label: "Event - PMA" },
                { value: "event_natm", label: "Event - NATM" },
                { value: "oem_lead", label: "OEM Lead" },
                { value: "other", label: "Other" },
                { value: "phone_in_existing_customer", label: "Phone In - Existing Customer" },
                { value: "phone_in_new_customer", label: "Phone In - New Customer" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Journey Notes</label>
            <textarea
              className="w-full rounded border border-border px-3 py-2 text-sm"
              rows={3}
              placeholder="Enter any relevant notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Action Date</label>
            <DatePicker
              value={actionDate}
              onChange={setActionDate}
              placeholder="Select action date"
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Equipment Type"
              placeholder="Select an equipment type"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              options={[
                { value: "standard", label: "Standard" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </div>

          <div className="pt-2 border-t">
            <Button
              onClick={handleCreate}
              disabled={!name || !journeyType || !rsm || !city || !stateProv || !country || !industry || !leadSource || loading}
              variant="primary"
              className="w-full"
            >
              {loading ? "Creating..." : "Create Journey"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CompanyDetails;