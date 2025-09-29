import {
  Download,
  Plus,
  Layout,
  List as ListIcon,
  BarChart3,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { PageHeader, Modal, Button, Select, Input } from "@/components";
import { CreateJourneyModal } from "@/components/modals/create-journey-modal";
import { ImportExcelModal } from "@/components/modals/import-excel-modal";
import { KanbanView } from "./journeys/KanbanView";
import { ListView } from "./journeys/ListView";
import { ProjectionsView } from "./journeys/ProjectionsView";
import { PipelineHeader } from "./journeys/pipeline-header";
import { STAGES } from "./journeys/constants";
import { fuzzyMatch } from "./journeys/utils";
import { formatCurrency } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";
import * as XLSX from 'xlsx';

type StageId = (typeof STAGES)[number]["id"];

const stageLabel = (id?: number) =>
  STAGES.find(s => s.id === Number(id))?.label ?? `Stage ${id ?? ""}`;



const Pipeline = () => {
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const toggleJourneyModal = () => setIsJourneyModalOpen(prev => !prev);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const toggleImportModal = () => setIsImportModalOpen(prev => !prev);
  const navigate = useNavigate();

  const { employee } = useAuth();
  const { put, get, delete: del } = useApi();
  const rsmApi = useApi(); // Separate API instance for RSM fetching
  const [journeys, setJourneys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [legacyJourneys, setLegacyJourneys] = useState<any[] | null>(null);

  // Fetch journeys and customers data
  useEffect(() => {
    const fetchData = async () => {
      const [journeysData, customersData] = await Promise.all([
        get('/legacy/base/Journey', { 
          sort: 'CreateDT', 
          order: 'desc', 
          limit: 100,
          fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID'
        }),
        get('/legacy/base/Company', { sort: 'Company_ID', order: 'desc' })
      ]);
      
      if (journeysData) {
        // Apply the same mapping as the working fetch
        setJourneys(Array.isArray(journeysData) ? journeysData.map(adaptLegacyJourney) : []);
      }
      
      if (customersData) {
        setCustomers(Array.isArray(customersData) ? customersData : []);
      }
    };
    
    fetchData();
  }, []);

  const refetchApi = useApi();

  const refetchLegacyJourneys = async () => {
    try {
      const raw = await refetchApi.get('/legacy/base/Journey', { 
        sort: 'CreateDT', 
        order: 'desc', 
        limit: 100,
        fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID'
      });
      
      if (raw !== null) {
        const mapped = Array.isArray(raw) ? raw.map(adaptLegacyJourney) : [];
        setLegacyJourneys(mapped);
        return true;
      } else {
        console.error("Legacy journeys refetch failed");
        return false;
      }
    } catch (error) {
      console.error("Error refetching journeys:", error);
      return false;
    }
  };

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

  const parseConfidence = (v: any) => {
    if (v == null || v === "") return undefined;
    const m = String(v).match(/\d+/);
    return m ? Math.min(100, Math.max(0, Number(m[0]))) : undefined;
  };

  const normalizePriority = (v: any): string => {
    const s = String(v ?? "").toUpperCase().trim();
    if (s === "A" || s === "B" || s === "C" || s === "D") return s;
    // Legacy conversion
    if (s.startsWith("H")) return "A"; // High -> A
    if (s.startsWith("L")) return "D"; // Low -> D
    if (s.startsWith("M")) return "C"; // Medium -> C
    return "C"; // Default to medium priority
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
      Quote_Number: raw.Quote_Number,
      Journey_Stage: raw.Journey_Stage,
      RSM: raw.RSM,
      Journey_Status: raw.Journey_Status,
      Project_Name: raw.Project_Name,
      Target_Account: raw.Target_Account,
      Company_ID: raw.Company_ID,
      CreateDT: raw.CreateDT,
      Action_Date: raw.Action_Date,
      Expected_Decision_Date: raw.Expected_Decision_Date,
      Chance_To_Secure_order: raw.Chance_To_Secure_order,
      Industry: raw.Industry,
      Dealer: raw.Dealer,
      Dealer_Name: raw.Dealer_Name,
      Equipment_Type: raw.Equipment_Type,
      Lead_Source: raw.Lead_Source,
    };
  };

  const initialFetchApi = useApi();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await initialFetchApi.get('/legacy/base/Journey', { 
          sort: 'CreateDT', 
          order: 'desc', 
          limit: 100,
          fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID'
        });
        
        if (!cancelled && raw !== null) {
          const mapped = Array.isArray(raw) ? raw.map(adaptLegacyJourney) : [];
          setLegacyJourneys(mapped);
        }
      } catch (error) {
        console.error("Error fetching Journeys:", error);
      }

      const rsmData = await rsmApi.get('/legacy/std/Demographic/filter/custom', {
        filterField: 'Category',
        filterValue: 'RSM',
        fields: 'Description'
      });
      
      if (!cancelled && Array.isArray(rsmData)) {
        const rsmValues = rsmData.map(item => item.Description).filter(Boolean);
        setAvailableRsms(rsmValues);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const baseJourneys = legacyJourneys?.length ? legacyJourneys : (journeys ?? []);
  const isLegacyData = !!legacyJourneys?.length;

  const customersById = useMemo(() => {
    const map = new Map<string, any>((customers ?? []).map(c => [String(c.id), c]));
    if (isLegacyData) {
      baseJourneys.forEach(j => {
        const cid = String(j.customerId ?? "");
        const name = j.companyName;
        if (cid && name && !map.has(cid)) {
          map.set(cid, { id: cid, name });
        }
      });
    }
    return map;
  }, [customers, baseJourneys, isLegacyData]);

  // Helper functions for localStorage
  const getFromLocalStorage = (key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem(`pipeline_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const saveToLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(`pipeline_${key}`, JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
  };

  const [searchTerm, setSearchTerm] = useState(() => getFromLocalStorage('searchTerm', ''));
  const [filters, setFilters] = useState(() => getFromLocalStorage('filters', {
    confidenceLevels: [] as number[],
    dateRange: ["", ""] as [string, string],
    dateField: "closeDate" as string,
    priority: "" as string,
    minValue: "" as string,
    maxValue: "" as string,
    visibleStages: STAGES.map(s => s.id) as number[],
  }));
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [navigationModal, setNavigationModal] = useState<{ isOpen: boolean; journeyName: string; journeyId: string }>({ isOpen: false, journeyName: '', journeyId: '' });
  const [rsmFilter, setRsmFilter] = useState<string>(() => getFromLocalStorage('rsmFilter', ''));
  const [rsmFilterDisplay, setRsmFilterDisplay] = useState<string>(() => getFromLocalStorage('rsmFilterDisplay', ''));
  const [availableRsms, setAvailableRsms] = useState<string[]>([]);
  const [journeyStatusFilter, setJourneyStatusFilter] = useState<string>(() => getFromLocalStorage('journeyStatusFilter', ''));
  const [sortField, setSortField] = useState<string>(() => getFromLocalStorage('sortField', ''));
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => getFromLocalStorage('sortDirection', 'asc'));
  const [showTags, setShowTags] = useState<boolean>(() => getFromLocalStorage('showTags', false));


  const filteredJourneys = useMemo(() => {
    let results = baseJourneys ?? [];
    
    // Apply fuzzy search term filter
    const q = searchTerm.trim();
    if (q) {
      results = results.filter(j => {
        const searchableText = [
          j.name ?? '',
          j.companyName ?? '',
          customersById?.get(String(j.customerId))?.name ?? ''
        ].join(' ');
        
        return fuzzyMatch(searchableText, q);
      });
    }
    
    // Apply confidence filter
    if (filters.confidenceLevels.length > 0) {
      results = results.filter(j => {
        const confidence = j.confidence ?? 0;
        return filters.confidenceLevels.includes(confidence);
      });
    }
    
    // Apply date range filter
    if (filters.dateRange[0] || filters.dateRange[1]) {
      results = results.filter(j => {
        const getDateValue = (field: string, journey: any): Date | null => {
          const dateStr = journey[field];
          return dateStr ? new Date(dateStr) : null;
        };
        
        const dateValue = getDateValue(filters.dateField === 'closeDate' ? 'closeDate' : filters.dateField, j);
        
        if (!dateValue) return false;
        
        const startDate = filters.dateRange[0] ? new Date(filters.dateRange[0]) : null;
        const endDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : null;
        
        if (startDate && dateValue < startDate) return false;
        if (endDate && dateValue > endDate) return false;
        
        return true;
      });
    }
    
    // Apply priority filter
    if (filters.priority) {
      results = results.filter(j => j.priority === filters.priority);
    }
    
    // Apply value range filter
    if (filters.minValue) {
      const minVal = parseFloat(filters.minValue);
      if (!isNaN(minVal)) {
        results = results.filter(j => (j.value ?? 0) >= minVal);
      }
    }
    
    if (filters.maxValue) {
      const maxVal = parseFloat(filters.maxValue);
      if (!isNaN(maxVal)) {
        results = results.filter(j => (j.value ?? 0) <= maxVal);
      }
    }
    
    // Apply stage visibility filter
    results = results.filter(j => filters.visibleStages.includes(j.stage ?? 1));
    
    // Apply RSM filter
    if (rsmFilter) {
      const filterValue = rsmFilter.toLowerCase();
      results = results.filter(j => 
        (j.RSM ?? "").toLowerCase().includes(filterValue)
      );
    }
    
    // Apply journey status filter
    if (journeyStatusFilter) {
      results = results.filter(j => 
        (j.Journey_Status ?? "").toLowerCase() === journeyStatusFilter.toLowerCase()
      );
    }
    
    return results;
  }, [baseJourneys, searchTerm, filters, customersById, rsmFilter, journeyStatusFilter]);

  // For kanban view, limit to 50 most recent journeys
  const kanbanJourneys = useMemo(() => {
    return filteredJourneys
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 50);
  }, [filteredJourneys]);

  // View mode state
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "projections">(() => getFromLocalStorage('viewMode', 'kanban'));

  // For list view, implement batch loading
  const [listBatchSize, setListBatchSize] = useState(200);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Apply sorting to the full filtered dataset for list view
  const sortedFilteredJourneys = useMemo(() => {
    if (!sortField) return filteredJourneys;
    
    return [...filteredJourneys].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = (a.name ?? '').toLowerCase();
          bValue = (b.name ?? '').toLowerCase();
          break;
        case 'customerId':
          const aCustomer = customersById?.get(String(a.customerId));
          const bCustomer = customersById?.get(String(b.customerId));
          aValue = (aCustomer?.name ?? a.companyName ?? '').toLowerCase();
          bValue = (bCustomer?.name ?? b.companyName ?? '').toLowerCase();
          break;
        case 'stage':
          aValue = a.stage ?? 1;
          bValue = b.stage ?? 1;
          break;
        case 'value':
          aValue = Number(a.value ?? 0);
          bValue = Number(b.value ?? 0);
          break;
        case 'confidence':
          aValue = Number(a.confidence ?? 0);
          bValue = Number(b.confidence ?? 0);
          break;
        case 'priority':
          const priorityOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 0;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt ?? 0).getTime();
          bValue = new Date(b.updatedAt ?? 0).getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredJourneys, sortField, sortDirection, customersById]);
  
  const listJourneys = useMemo(() => {
    return sortedFilteredJourneys.slice(0, listBatchSize);
  }, [sortedFilteredJourneys, listBatchSize]);

  const hasMoreJourneys = sortedFilteredJourneys.length > listBatchSize;

  const loadMoreJourneys = useCallback(() => {
    if (isLoadingMore || !hasMoreJourneys) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setListBatchSize(prev => prev + 200);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreJourneys]);



  // Reset batch size when filters change
  useEffect(() => {
    setListBatchSize(200);
  }, [searchTerm, filters, rsmFilter, journeyStatusFilter]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage('searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveToLocalStorage('filters', filters);
  }, [filters]);

  useEffect(() => {
    saveToLocalStorage('rsmFilter', rsmFilter);
  }, [rsmFilter]);

  useEffect(() => {
    saveToLocalStorage('rsmFilterDisplay', rsmFilterDisplay);
  }, [rsmFilterDisplay]);

  useEffect(() => {
    saveToLocalStorage('journeyStatusFilter', journeyStatusFilter);
  }, [journeyStatusFilter]);

  useEffect(() => {
    saveToLocalStorage('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveToLocalStorage('sortField', sortField);
  }, [sortField]);

  useEffect(() => {
    saveToLocalStorage('sortDirection', sortDirection);
  }, [sortDirection]);
  
  useEffect(() => {
    saveToLocalStorage('showTags', showTags);
  }, [showTags]);
  
  // For kanban view, filter visible stages
  const visibleStageIds = filters.visibleStages;

  const emptyStageMap = useMemo(() => {
    return STAGES.reduce((acc, s) => {
      acc[s.id] = [];
      return acc;
    }, {} as Record<number, string[]>);
  }, []);

  const [idsByStage, setIdsByStage] = useState<Record<number, string[]>>(emptyStageMap);
  
  // Memoize stage calculations to prevent re-computation during drag
  const stageCalculations = useMemo(() => {
    const calculations = new Map();
    const journeysForCalculation = viewMode === "kanban" ? kanbanJourneys : filteredJourneys;
    STAGES.filter(s => visibleStageIds?.includes(s.id)).forEach((stage) => {
      const items = idsByStage[stage.id] ?? [];
      const stageTotal = items.reduce((sum, id) => {
        const j = journeysForCalculation.find(d => d.id.toString() === id);
        return sum + Number(j?.value ?? 0);
      }, 0);
      const stageWeighted = stageTotal * stage.weight;
      calculations.set(stage.id, { items, stageTotal, stageWeighted, stage });
    });
    return calculations;
  }, [idsByStage, filteredJourneys, kanbanJourneys, visibleStageIds, viewMode]);

  useEffect(() => {
    const next = STAGES.reduce((acc, s) => {
      acc[s.id] = [];
      return acc;
    }, {} as Record<number, string[]>);

    const journeysForStaging = viewMode === "kanban" ? kanbanJourneys : filteredJourneys;
    (journeysForStaging ?? []).forEach(j => {
      const sid: StageId = (j.stage as StageId) ?? 1;
      if (!next[sid]) next[sid] = [];
      next[sid].push(String(j.id));
    });

    setIdsByStage(next);
  }, [filteredJourneys, kanbanJourneys, viewMode]);

  const handleDeleteJourney = useCallback(async (journeyId: string) => {
    try {
      const success = await del(`/legacy/std/Journey/${journeyId}`);
      
      if (success) {
        // Remove from local state
        setLegacyJourneys(prev => 
          prev ? prev.filter(j => j.id.toString() !== journeyId) : prev
        );
        setJourneys(prev => prev.filter(j => j.id.toString() !== journeyId));
      } else {
        alert("Failed to delete journey. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting journey:", error);
      alert("Failed to delete journey. Please try again.");
    }
  }, [del]);

  const stageUpdateApi = useApi();
  
  const handleTagsUpdated = useCallback(() => {
    console.log('Tags updated, triggering refresh');
  }, []);

  const handleStageUpdate = useCallback(async (journeyId: string, newStage: number) => {
    try {
      if (isLegacyData) {
        // Convert stage ID to stage label for backend
        const stageLabel = STAGES.find(s => s.id === newStage)?.label;
        if (!stageLabel) {
          console.error(`Invalid stage ID: ${newStage}`);
          return;
        }
        
        // Call the server to update the journey stage in the legacy database
        const result = await stageUpdateApi.patch(`/legacy/base/Journey/${journeyId}`, { 
          Journey_Stage: stageLabel 
        });
        
        if (result !== null) {
          // Instead of updating local state immediately, refetch the data to ensure consistency
          // Add a small delay to ensure database has time to commit the change
          await new Promise(resolve => setTimeout(resolve, 100));
          const refetchSuccess = await refetchLegacyJourneys();
          if (!refetchSuccess) {
            // Fallback: update local state if refetch fails
            setLegacyJourneys((prev) =>
              (prev ?? []).map((j) =>
                j.id.toString() === journeyId
                  ? {
                      ...j,
                      stage: newStage,
                      updatedAt: new Date().toISOString(),
                    }
                  : j
              )
            );
          }
        } else {
          console.error("Failed to update journey stage on server");
        }
      } else {
        // Convert stage ID to stage label for backend
        const stageLabel = STAGES.find(s => s.id === newStage)?.label;
        if (!stageLabel) {
          console.error(`Invalid stage ID: ${newStage}`);
          return;
        }
        await put(`/legacy/base/Journey/${journeyId}`, { Journey_Stage: stageLabel });
      }
    } catch (error) {
      console.error("Error updating journey stage:", error);
    }
  }, [isLegacyData, refetchLegacyJourneys, put]);

  const handleSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    if (order) {
      setSortField(field);
      setSortDirection(order);
    } else if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // const getSortIcon = useCallback((field: string) => {
  //   if (sortField !== field) return null;
  //   return sortDirection === 'asc' ? '↑' : '↓';
  // }, [sortField, sortDirection]);

  const totalPipelineValue = filteredJourneys.reduce((sum, j) => sum + Number(j.value ?? 0), 0);
  
  const weightedPipelineValue = useMemo(() => {
    return filteredJourneys.reduce((sum, j) => {
      const stage = STAGES.find(s => s.id === j.stage);
      const weight = stage?.weight ?? 0;
      return sum + (Number(j.value ?? 0) * weight);
    }, 0);
  }, [filteredJourneys]);

  const pageTitle = "Sales Pipeline";
  const pageDescription = `${filteredJourneys.length} Journeys`;


  const exportToExcel = useCallback(() => {
    const headers = [
      'Quote Number',
      'CreateDate', 
      'ActionDate',
      'Confidence',
      'Est PO Date',
      'Stage',
      'RSM',
      'Industry', 
      'Dealer',
      'Customer',
      'Equipment',
      'Lead Source'
    ];

    const rows = filteredJourneys.map(journey => {
      const customer = customersById.get(String(journey.customerId));
      return [
        journey.Quote_Number || '',
        journey.CreateDT ? new Date(journey.CreateDT) : '',
        journey.Action_Date ? new Date(journey.Action_Date) : '',
        journey.Chance_To_Secure_order || '',
        journey.Expected_Decision_Date ? new Date(journey.Expected_Decision_Date) : '',
        journey.Journey_Stage || stageLabel(journey.stage),
        journey.RSM || '',
        journey.Industry || '',
        journey.Dealer || journey.Dealer_Name || journey.dealer || '',
        customer?.name || journey.companyName || journey.Target_Account || '',
        journey.Equipment_Type || '',
        journey.Lead_Source || ''
      ];
    });

    // Create worksheet data
    const wsData = [headers, ...rows];
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths (auto-fit with reasonable limits)
    const colWidths = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 1, 8), 25) }; // Min 8, max 25 characters
    });
    ws['!cols'] = colWidths;
    
    // Add autofilter to entire data range (enables sorting and filtering)
    const dataRange = `A1:${XLSX.utils.encode_col(headers.length - 1)}${wsData.length}`;
    ws['!autofilter'] = { ref: dataRange };
    
    // Format data columns for proper sorting
    for (let col = 0; col < headers.length; col++) {
      const headerName = headers[col];
      for (let row = 1; row <= rows.length; row++) {
        const dataCellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[dataCellRef]) continue;
        
        // Format date columns
        if (headerName === 'CreateDate' || headerName === 'ActionDate' || headerName === 'Est PO Date') {
          if (ws[dataCellRef].v && ws[dataCellRef].v instanceof Date) {
            ws[dataCellRef].t = 'd'; // Set cell type to date
            ws[dataCellRef].z = 'mm/dd/yyyy'; // Date format
          }
        }
        
        // Format confidence as number
        if (headerName === 'Confidence' && ws[dataCellRef].v) {
          const confValue = parseFloat(ws[dataCellRef].v);
          if (!isNaN(confValue)) {
            ws[dataCellRef].v = confValue;
            ws[dataCellRef].t = 'n'; // Set cell type to number
          }
        }
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Pipeline Export');
    
    // Generate Excel file and download
    const fileName = `pipeline-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredJourneys, customersById]);

  const HeaderActions = () => (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "kanban" ? "secondary" : "secondary-outline"}
        size="sm"
        onClick={() => setViewMode("kanban")}
      >
        <Layout size={16} />
        Card
      </Button>
      <Button
        variant={viewMode === "list" ? "secondary" : "secondary-outline"}
        size="sm"
        onClick={() => setViewMode("list")}
      >
        <ListIcon size={16} />
        List
      </Button>
      <Button
        variant={viewMode === "projections" ? "secondary" : "secondary-outline"}
        size="sm"
        onClick={() => setViewMode("projections")}
      >
        <BarChart3 size={16} />
        Projections
      </Button>
      <Button
        variant="secondary-outline"
        size="sm"
        onClick={exportToExcel}
      >
        <Download size={16} />
        Export
      </Button>
      <Button
        variant="secondary-outline"
        size="sm"
        onClick={() => toggleImportModal()}
      >
        <Upload size={16} />
        Import
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => toggleJourneyModal()}
      >
        <Plus size={16} />
        Add Journey
      </Button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={<HeaderActions />}
      />
      
      {/* Pipeline Value Summary - Only show for kanban and list views */}
      {viewMode !== "projections" && (
        <div className="border-b px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start gap-16">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">Total Pipeline:</span>
              <span className="text-xl font-semibold text-primary">{formatCurrency(totalPipelineValue)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">Weighted Pipeline:</span>
              <span className="text-xl font-semibold text-primary">{formatCurrency(weightedPipelineValue)}</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          <PipelineHeader 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            rsmFilterDisplay={rsmFilterDisplay}
            setRsmFilter={setRsmFilter}
            setRsmFilterDisplay={setRsmFilterDisplay}
            availableRsms={availableRsms}
            journeyStatusFilter={journeyStatusFilter}
            setJourneyStatusFilter={setJourneyStatusFilter}
            employee={employee}
            setIsFilterModalOpen={setIsFilterModalOpen}
            showTags={showTags}
            setShowTags={setShowTags}
            viewMode={viewMode}
          />
          <KanbanView
            journeys={kanbanJourneys}
            customersById={customersById}
            visibleStageIds={visibleStageIds}
            idsByStage={idsByStage}
            stageCalculations={stageCalculations}
            onDeleteJourney={handleDeleteJourney}
            onStageUpdate={handleStageUpdate}
            setIdsByStage={setIdsByStage}
            showTags={showTags}
            onTagsUpdated={handleTagsUpdated}
          />
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          <PipelineHeader 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            rsmFilterDisplay={rsmFilterDisplay}
            setRsmFilter={setRsmFilter}
            setRsmFilterDisplay={setRsmFilterDisplay}
            availableRsms={availableRsms}
            journeyStatusFilter={journeyStatusFilter}
            setJourneyStatusFilter={setJourneyStatusFilter}
            employee={employee}
            setIsFilterModalOpen={setIsFilterModalOpen}
            viewMode={viewMode}
          />
          <ListView
            journeys={listJourneys}
            sortedFilteredJourneys={sortedFilteredJourneys}
            customersById={customersById}
            listBatchSize={listBatchSize}
            hasMoreJourneys={hasMoreJourneys}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreJourneys}
            onDeleteJourney={handleDeleteJourney}
            onSort={handleSort}
            stageLabel={stageLabel}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>
      )}

      {viewMode === "projections" && (
        <ProjectionsView 
          journeys={filteredJourneys}
          customersById={customersById}
        />
      )}
      {isJourneyModalOpen && (
        <CreateJourneyModal
          isOpen={isJourneyModalOpen}
          onClose={toggleJourneyModal}
          onSuccess={(newJourney) => {
            // Add the new journey to the top of the list
            if (newJourney) {
              console.log('Raw new journey:', newJourney);
              const adaptedJourney = adaptLegacyJourney(newJourney);
              console.log('Adapted journey:', adaptedJourney);
              
              // Update both legacy journeys and regular journeys state
              setLegacyJourneys(prev => {
                const updated = prev ? [adaptedJourney, ...prev] : [adaptedJourney];
                console.log('Updated legacyJourneys:', updated);
                return updated;
              });
              setJourneys(prev => {
                const updated = [adaptedJourney, ...prev];
                console.log('Updated journeys:', updated);
                return updated;
              });
              
              // Show navigation modal
              setNavigationModal({
                isOpen: true,
                journeyName: adaptedJourney.name || adaptedJourney.Project_Name || adaptedJourney.Target_Account || 'New Journey',
                journeyId: adaptedJourney.id
              });
            }
          }}
          availableRsms={availableRsms}
        />
      )}
      {isImportModalOpen && (
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={toggleImportModal}
          onSuccess={() => {
            // Refresh the journeys data after successful import
            const fetchData = async () => {
              const [journeysData] = await Promise.all([
                get('/legacy/base/Journey', { 
                  sort: 'CreateDT', 
                  order: 'desc', 
                  limit: 100,
                  fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID'
                })
              ]);
              
              if (journeysData) {
                setJourneys(Array.isArray(journeysData) ? journeysData.map(adaptLegacyJourney) : []);
                setLegacyJourneys(Array.isArray(journeysData) ? journeysData.map(adaptLegacyJourney) : []);
              }
            };
            
            fetchData();
          }}
          availableRsms={availableRsms}
        />
      )}
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
      {isFilterModalOpen && (
        <FilterModal
          isOpen={isFilterModalOpen}
          filters={filters}
          onApply={(newFilters) => { setFilters(newFilters); setIsFilterModalOpen(false); }}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </div>
  );
};

const FilterModal = ({
  isOpen,
  filters,
  onApply,
  onClose,
}: {
  isOpen: boolean;
  filters: {
    confidenceLevels: number[];
    dateRange: [string, string];
    dateField: string;
    priority: string;
    minValue: string;
    maxValue: string;
    visibleStages: number[];
  };
  onApply: (filters: any) => void;
  onClose: () => void;
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);
  
  const handleReset = () => {
    setLocalFilters({
      confidenceLevels: [],
      dateRange: ["", ""],
      dateField: "closeDate",
      priority: "",
      minValue: "",
      maxValue: "",
      visibleStages: STAGES.map(s => s.id),
    });
  };
  
  const hasActiveFilters = 
    localFilters.confidenceLevels.length > 0 ||
    localFilters.dateRange[0] ||
    localFilters.dateRange[1] ||
    localFilters.priority ||
    localFilters.minValue ||
    localFilters.maxValue ||
    localFilters.visibleStages.length !== STAGES.length;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Pipeline" size="md">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Confidence Level</label>
          <div className="grid grid-cols-3 gap-2">
            {[0, 25, 50, 75, 90, 100].map(level => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.confidenceLevels.includes(level)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setLocalFilters(prev => ({
                        ...prev,
                        confidenceLevels: [...prev.confidenceLevels, level]
                      }));
                    } else {
                      setLocalFilters(prev => ({
                        ...prev,
                        confidenceLevels: prev.confidenceLevels.filter(l => l !== level)
                      }));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{level}%</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Select
            label="Date Field"
            value={localFilters.dateField}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, dateField: e.target.value }))}
            options={[
              { value: "closeDate", label: "Close Date" },
              { value: "Action_Date", label: "Action Date" },
              { value: "Journey_Start_Date", label: "Journey Start Date" },
              { value: "Quote_Presentation_Date", label: "Quote Presentation Date" },
              { value: "Expected_Decision_Date", label: "Expected Decision Date" },
              { value: "Date_PO_Received", label: "PO Received Date" },
              { value: "Date_Lost", label: "Date Lost" }
            ]}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Date From</label>
            <input
              type="date"
              value={localFilters.dateRange[0]}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                dateRange: [e.target.value, prev.dateRange[1]]
              }))}
              className="w-full rounded border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Date To</label>
            <input
              type="date"
              value={localFilters.dateRange[1]}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                dateRange: [prev.dateRange[0], e.target.value]
              }))}
              className="w-full rounded border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Select
            label="Priority"
            value={localFilters.priority}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, priority: e.target.value }))}
            options={[
              { value: "", label: "All priorities" },
              { value: "A", label: "A (Highest)" },
              { value: "B", label: "B (High)" },
              { value: "C", label: "C (Medium)" },
              { value: "D", label: "D (Lowest)" },
            ]}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label="Min Value ($)"
              placeholder="0"
              value={localFilters.minValue}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, minValue: e.target.value }))}
              type="number"
            />
          </div>
          <div className="space-y-2">
            <Input
              label="Max Value ($)"
              placeholder="No limit"
              value={localFilters.maxValue}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, maxValue: e.target.value }))}
              type="number"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Visible Stages</label>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button 
              variant="secondary-outline" 
              size="sm"
              onClick={() => setLocalFilters(prev => ({ ...prev, visibleStages: [] }))}
            >
              Clear
            </Button>
            <Button 
              variant="secondary-outline" 
              size="sm"
              onClick={() => setLocalFilters(prev => ({ ...prev, visibleStages: STAGES.map(s => s.id) }))}
            >
              Select All
            </Button>
          </div>
          <div className="overflow-x-auto border rounded p-2">
            <div className="grid grid-rows-2 grid-flow-col gap-x-4 gap-y-2 min-w-fit">
              {STAGES.map(stage => (
                <label key={stage.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={localFilters.visibleStages.includes(stage.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          visibleStages: [...prev.visibleStages, stage.id]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          visibleStages: prev.visibleStages.filter(id => id !== stage.id)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{stage.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="secondary-outline"
            onClick={handleReset}
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary-outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => onApply(localFilters)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};


export default Pipeline;