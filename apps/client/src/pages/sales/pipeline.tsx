import { Download, Plus, Layout, List as ListIcon, BarChart3, Upload } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ExcelJS from 'exceljs';

import { PageHeader, Modal, Button, Select, Input } from "@/components";
import { CreateJourneyModal } from "@/components/modals/create-journey-modal";
import { ImportExcelModal } from "@/components/modals/import-excel-modal";
import { ExportExcelModal } from "@/components/modals/export-excel-modal";
import { KanbanView } from "./journeys/KanbanView";
import { ListView } from "./journeys/ListView";
import { ProjectionsView } from "./journeys/ProjectionsView";
import { PipelineHeader } from "./journeys/pipeline-header";
import { STAGES } from "./journeys/constants";
import { fuzzyMatch, fetchAvailableRsms, fetchDemographicCategory, Employee } from "./journeys/utils";
import { formatCurrency } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";

type StageId = (typeof STAGES)[number]["id"];

const stageLabel = (id?: number) =>
  STAGES.find(s => s.id === Number(id))?.label ?? `Stage ${id ?? ""}`;



const Pipeline = () => {
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const toggleJourneyModal = () => setIsJourneyModalOpen(prev => !prev);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const toggleImportModal = () => setIsImportModalOpen(prev => !prev);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const toggleExportModal = () => setIsExportModalOpen(prev => !prev);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { employee } = useAuth();
  const { put, get, delete: del } = useApi();
  const api = useApi();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [journeyTags, setJourneyTags] = useState<Map<string, any[]>>(new Map());

  const [legacyJourneys, setLegacyJourneys] = useState<any[] | null>(null);
  const fetchJourneyTags = async (journeyIds: string[]) => {
    const tagsMap = new Map<string, any[]>();

    if (journeyIds.length === 0) {
      return tagsMap;
    }

    try {
      const response = await get('/tags', {
        filter: JSON.stringify({
          parentTable: 'journeys',
          parentIds: journeyIds
        })
      });

      if (response?.success && Array.isArray(response.data)) {
        response.data.forEach((tag: any) => {
          const journeyId = tag.parentId;
          if (!tagsMap.has(journeyId)) {
            tagsMap.set(journeyId, []);
          }
          tagsMap.get(journeyId)?.push(tag);
        });
      }

      journeyIds.forEach(id => {
        if (!tagsMap.has(id)) {
          tagsMap.set(id, []);
        }
      });
    } catch (error) {
      console.error('Error fetching journey tags:', error);
    }

    return tagsMap;
  };
  useEffect(() => {
    const fetchData = async () => {
      const [journeysData, customersData] = await Promise.all([
        get('/legacy/base/Journey', {
          page: 1,
          limit: 200,
          sort: 'CreateDT',
          order: 'desc',
          fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status'
        }),
        get('/legacy/base/Company', { sort: 'Company_ID', order: 'desc' })
      ]);

      if (journeysData) {
        const journeysArray = journeysData.data ? journeysData.data : (Array.isArray(journeysData) ? journeysData : []);
        const mappedJourneys = journeysArray.map(adaptLegacyJourney);
        setJourneys(mappedJourneys);
      }

      if (customersData) {
        const customersArray = customersData.data ? customersData.data : (Array.isArray(customersData) ? customersData : []);
        setCustomers(customersArray);
      }
    };

    fetchData();
  }, []);

  const refetchApi = useApi();

  const refetchLegacyJourneys = async () => {
    try {
      const raw = await refetchApi.get('/legacy/base/Journey', {
        page: 1,
        limit: 200,
        sort: 'CreateDT',
        order: 'desc',
        fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Address_ID,RSM,Journey_Status'
      });

      if (raw !== null) {
        const journeysArray = raw.data ? raw.data : (Array.isArray(raw) ? raw : []);
        const mapped = journeysArray.map(adaptLegacyJourney);
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
    const str = String(v);
    if (str === "Closed Won") return 100;
    if (str === "Closed Lost") return 0;
    const m = str.match(/\d+/);
    return m ? Math.min(100, Math.max(0, Number(m[0]))) : undefined;
  };

  const normalizePriority = (v: any): string => {
    const s = String(v ?? "").toUpperCase().trim();
    if (s === "A" || s === "B" || s === "C" || s === "D") return s;
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
      target_account: raw.Target_Account,
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
      Next_Steps: raw.Next_Steps,
      Address_ID: raw.Address_ID,
    };
  };

  const initialFetchApi = useApi();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await initialFetchApi.get('/legacy/base/Journey', {
          page: 1,
          limit: 200,
          sort: 'CreateDT',
          order: 'desc',
          fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status'
        });

        if (!cancelled && raw !== null) {
          const journeysArray = raw.data ? raw.data : (Array.isArray(raw) ? raw : []);
          const mapped = journeysArray.map(adaptLegacyJourney);
          setLegacyJourneys(mapped);
        }
      } catch (error) {
        console.error("Error fetching Journeys:", error);
      }

      const [rsms, statuses] = await Promise.all([
        fetchAvailableRsms(api),
        fetchDemographicCategory(api, 'Journey_status')
      ]);

      if (!cancelled && rsms.length > 0) {
        setAvailableRsms(rsms);

        const displayNamesMap = new Map<string, string>();
        rsms.forEach(rsm => {
          displayNamesMap.set(rsm.initials, `${rsm.name} (${rsm.initials})`);
        });
        setRsmDisplayNames(displayNamesMap);
      }

      if (!cancelled && statuses.length > 0) {
        setValidJourneyStatuses(statuses);
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
        if (cid && cid !== "0" && name && !map.has(cid)) {
          map.set(cid, { id: cid, name });
        }
      });
    }
    return map;
  }, [customers, baseJourneys, isLegacyData]);
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
  const [availableRsms, setAvailableRsms] = useState<Employee[]>([]);
  const [rsmDisplayNames, setRsmDisplayNames] = useState<Map<string, string>>(new Map());
  const [validJourneyStatuses, setValidJourneyStatuses] = useState<string[]>([]);
  const [journeyStatusFilter, setJourneyStatusFilter] = useState<string>(() => getFromLocalStorage('journeyStatusFilter', ''));
  const [sortField, setSortField] = useState<string>(() => getFromLocalStorage('sortField', ''));
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => getFromLocalStorage('sortDirection', 'asc'));
  const [showTags, setShowTags] = useState<boolean>(() => getFromLocalStorage('showTags', false));
  const [kanbanBatchSize, setKanbanBatchSize] = useState<number>(() => getFromLocalStorage('kanbanBatchSize', 50));
  const [listPage, setListPage] = useState(1);
  const [listPageSize] = useState(25);
  const [listViewJourneys, setListViewJourneys] = useState<any[]>([]);
  const [listViewPagination, setListViewPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 25
  });
  const [isLoadingListView, setIsLoadingListView] = useState(false);


  const filteredJourneys = useMemo(() => {
    let results = baseJourneys ?? [];
    const q = searchTerm.trim();
    if (q) {
      // Check if it's exactly "tag:" or starts with "tag:"
      if (q.toLowerCase() === 'tag:') {
        // Show only journeys that have any tags
        results = results.filter(j => {
          const tags = journeyTags.get(j.id.toString()) || [];
          return tags.length > 0;
        });
      } else {
        const tagMatch = q.match(/tag:(\S+)/i);

        if (tagMatch) {
          const tagSearch = tagMatch[1].toUpperCase();
          const remainingSearch = q.replace(tagMatch[0], '').trim();
          if (tagSearch) {
            results = results.filter(j => {
              const tags = journeyTags.get(j.id.toString()) || [];
              return tags.some(tag =>
                tag.description &&
                tag.description.toUpperCase().includes(tagSearch)
              );
            });
          }
          if (remainingSearch) {
            results = results.filter(j => {
              const searchableText = [
                j.name ?? '',
                j.companyName ?? '',
                customersById?.get(String(j.customerId))?.name ?? ''
              ].join(' ');

              return fuzzyMatch(searchableText, remainingSearch);
            });
          }
        } else {
          results = results.filter(j => {
            const searchableText = [
              j.name ?? '',
              j.companyName ?? '',
              customersById?.get(String(j.customerId))?.name ?? ''
            ].join(' ');

            return fuzzyMatch(searchableText, q);
          });
        }
      }
    }
    if (filters.confidenceLevels.length > 0) {
      results = results.filter(j => {
        const confidence = j.confidence ?? 0;
        return filters.confidenceLevels.includes(confidence);
      });
    }
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
    if (filters.priority) {
      results = results.filter(j => j.priority === filters.priority);
    }
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
    results = results.filter(j => filters.visibleStages.includes(j.stage ?? 1));
    if (rsmFilter) {
      const filterValue = rsmFilter.toLowerCase();
      results = results.filter(j => 
        (j.RSM ?? "").toLowerCase().includes(filterValue)
      );
    }
    if (journeyStatusFilter) {
      results = results.filter(j => 
        (j.Journey_Status ?? "").toLowerCase() === journeyStatusFilter.toLowerCase()
      );
    }
    
    return results;
  }, [baseJourneys, searchTerm, filters, customersById, rsmFilter, journeyStatusFilter, journeyTags]);
  const kanbanJourneys = useMemo(() => {
    return filteredJourneys
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, kanbanBatchSize);
  }, [filteredJourneys, kanbanBatchSize]);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "projections">(() => getFromLocalStorage('viewMode', 'kanban'));

  const fetchListViewJourneys = useCallback(async () => {
    if (isLoadingListView) return;

    setIsLoadingListView(true);
    try {
      const sortFieldMap: Record<string, string> = {
        'name': 'Project_Name',
        'customerId': 'Company_ID',
        'stage': 'Journey_Stage',
        'value': 'Journey_Value',
        'confidence': `CASE
          WHEN Chance_To_Secure_order = 'Closed Won' THEN 100
          WHEN Chance_To_Secure_order = 'Closed Lost' THEN 0
          WHEN Chance_To_Secure_order LIKE '%[0-9]%' THEN CAST(REPLACE(Chance_To_Secure_order, '%', '') AS INT)
          ELSE 0
        END`,
        'priority': 'Priority',
        'updatedAt': 'Action_Date'
      };

      const dbSortField = sortField ? (sortFieldMap[sortField] || sortField) : 'CreateDT';

      const params: any = {
        page: listPage,
        limit: listPageSize,
        sort: dbSortField,
        order: sortDirection,
        fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status'
      };

      const filterConditions: any[] = [];

      if (searchTerm) {
        const trimmedSearch = searchTerm.trim();
        filterConditions.push({
          operator: "or",
          conditions: [
            { field: "Project_Name", operator: "contains", value: trimmedSearch },
            { field: "Target_Account", operator: "contains", value: trimmedSearch }
          ]
        });
      }

      if (rsmFilter) {
        filterConditions.push({
          field: "RSM",
          operator: "contains",
          value: rsmFilter
        });
      }

      if (journeyStatusFilter) {
        filterConditions.push({
          field: "Journey_Status",
          operator: "equals",
          value: journeyStatusFilter
        });
      }

      if (filters.priority) {
        filterConditions.push({
          field: "Priority",
          operator: "equals",
          value: filters.priority
        });
      }

      if (filters.confidenceLevels.length > 0) {
        const confidenceValues = filters.confidenceLevels.map((level: number) => {
          if (level === 0) return "Closed Lost";
          if (level === 100) return "Closed Won";
          return `${level}%`;
        });
        filterConditions.push({
          field: "Chance_To_Secure_order",
          operator: "in",
          values: confidenceValues
        });
      }

      if (filters.dateRange[0] || filters.dateRange[1]) {
        const fieldMap: Record<string, string> = {
          'closeDate': 'Expected_Decision_Date',
          'Action_Date': 'Action_Date',
          'Journey_Start_Date': 'Journey_Start_Date',
          'Quote_Presentation_Date': 'Quote_Presentation_Date',
          'Expected_Decision_Date': 'Expected_Decision_Date',
          'Date_PO_Received': 'Date_PO_Received',
          'Date_Lost': 'Date_Lost'
        };
        const dbField = fieldMap[filters.dateField] || 'Expected_Decision_Date';

        if (filters.dateRange[0]) {
          filterConditions.push({
            field: dbField,
            operator: "gte",
            value: filters.dateRange[0]
          });
        }
        if (filters.dateRange[1]) {
          filterConditions.push({
            field: dbField,
            operator: "lte",
            value: filters.dateRange[1]
          });
        }
      }

      if (filters.minValue) {
        filterConditions.push({
          field: "Journey_Value",
          operator: "gte",
          value: parseFloat(filters.minValue)
        });
      }

      if (filters.maxValue) {
        filterConditions.push({
          field: "Journey_Value",
          operator: "lte",
          value: parseFloat(filters.maxValue)
        });
      }

      if (filters.visibleStages.length !== STAGES.length) {
        const stageConditions = filters.visibleStages.map((stageId: number) => {
          switch (stageId) {
            case 1: // Lead
              return {
                operator: "or",
                conditions: [
                  { field: "Journey_Stage", operator: "contains", value: "LEAD" },
                  { field: "Journey_Stage", operator: "contains", value: "OPEN" },
                  { field: "Journey_Stage", operator: "contains", value: "NEW" }
                ]
              };
            case 2: // Qualified
              return {
                operator: "or",
                conditions: [
                  { field: "Journey_Stage", operator: "contains", value: "QUALIFY" },
                  { field: "Journey_Stage", operator: "contains", value: "QUALIFI" },
                  { field: "Journey_Stage", operator: "contains", value: "PAIN" },
                  { field: "Journey_Stage", operator: "contains", value: "DISCOVER" }
                ]
              };
            case 3: // Presentations
              return {
                operator: "or",
                conditions: [
                  { field: "Journey_Stage", operator: "contains", value: "PRESENT" },
                  { field: "Journey_Stage", operator: "contains", value: "DEMO" },
                  { field: "Journey_Stage", operator: "contains", value: "PROPOSAL" },
                  { field: "Journey_Stage", operator: "contains", value: "QUOTE" }
                ]
              };
            case 4: // Negotiation
              return {
                field: "Journey_Stage",
                operator: "contains",
                value: "NEGOT"
              };
            case 5: // Closed Won
              return {
                operator: "or",
                conditions: [
                  { field: "Journey_Stage", operator: "contains", value: "PO" },
                  { field: "Journey_Stage", operator: "contains", value: "WON" },
                  { field: "Journey_Stage", operator: "contains", value: "CLOSEDWON" },
                  { field: "Journey_Stage", operator: "contains", value: "CLOSED WON" },
                  { field: "Journey_Stage", operator: "contains", value: "ORDER" }
                ]
              };
            case 6: // Closed Lost
              return {
                operator: "or",
                conditions: [
                  { field: "Journey_Stage", operator: "contains", value: "LOST" },
                  { field: "Journey_Stage", operator: "contains", value: "CLOSEDLOST" },
                  { field: "Journey_Stage", operator: "contains", value: "CLOSED LOST" },
                  { field: "Journey_Stage", operator: "contains", value: "DECLIN" }
                ]
              };
            default:
              return null;
          }
        }).filter(Boolean);

        if (stageConditions.length > 0) {
          filterConditions.push({
            operator: "or",
            conditions: stageConditions
          });
        }
      }

      if (filterConditions.length > 0) {
        params.filter = JSON.stringify({ filters: filterConditions });
      }

      const raw = await api.get('/legacy/base/Journey', params);

      if (raw !== null) {
        const journeysArray = raw.data ? raw.data : (Array.isArray(raw) ? raw : []);
        const mapped = journeysArray.map(adaptLegacyJourney);

        setListViewJourneys(mapped);

        if (raw.meta) {
          setListViewPagination({
            page: raw.meta.page,
            totalPages: raw.meta.totalPages,
            total: raw.meta.total,
            limit: raw.meta.limit
          });
        }
      }
    } catch (error) {
      console.error("Error fetching list view journeys:", error);
    } finally {
      setIsLoadingListView(false);
    }
  }, [isLoadingListView, listPage, listPageSize, sortField, sortDirection, api, searchTerm, rsmFilter, journeyStatusFilter, filters]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchListViewJourneys();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, listPage, sortField, sortDirection, searchTerm, rsmFilter, journeyStatusFilter, filters]);

  const handleListPageChange = (newPage: number) => {
    setListPage(newPage);
  };

  useEffect(() => {
    setListPage(1);
  }, [searchTerm]);
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

  useEffect(() => {
    if (showTags && viewMode === 'kanban') {
      const journeysToFetch = filteredJourneys
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, kanbanBatchSize);

      if (journeysToFetch.length > 0) {
        const journeyIds = journeysToFetch.map((j: any) => j.id.toString());
        fetchJourneyTags(journeyIds).then(tagsMap => {
          setJourneyTags(tagsMap);
        });
      }
    }
  }, [showTags, viewMode]);

  useEffect(() => {
    saveToLocalStorage('kanbanBatchSize', kanbanBatchSize);
  }, [kanbanBatchSize]);

  useEffect(() => {
    const view = searchParams.get('view');
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');

    if (view === 'list' || view === 'kanban' || view === 'projections') {
      setViewMode(view);
    }

    if (sort) {
      setSortField(sort);
    }

    if (order === 'asc' || order === 'desc') {
      setSortDirection(order);
    }

    if (view || sort || order) {
      setSearchParams({});
    }
  }, []);

  const visibleStageIds = filters.visibleStages;

  const emptyStageMap = useMemo(() => {
    return STAGES.reduce((acc, s) => {
      acc[s.id] = [];
      return acc;
    }, {} as Record<number, string[]>);
  }, []);

  const [idsByStage, setIdsByStage] = useState<Record<number, string[]>>(emptyStageMap);
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
  
  const handleTagsUpdated = useCallback(async () => {
    if (!showTags) return;

    const journeysToUpdate = viewMode === 'kanban' ? kanbanJourneys : (legacyJourneys || journeys);
    if (journeysToUpdate && journeysToUpdate.length > 0) {
      const journeyIds = journeysToUpdate.map((j: any) => j.id.toString());
      const tagsMap = await fetchJourneyTags(journeyIds);
      setJourneyTags(tagsMap);
    }
  }, [showTags, viewMode, kanbanJourneys, legacyJourneys, journeys]);

  const handleStageUpdate = useCallback(async (journeyId: string, newStage: number) => {
    try {
      if (isLegacyData) {
        const stageLabel = STAGES.find(s => s.id === newStage)?.label;
        if (!stageLabel) {
          console.error(`Invalid stage ID: ${newStage}`);
          return;
        }
        const result = await stageUpdateApi.patch(`/legacy/base/Journey/${journeyId}`, { 
          Journey_Stage: stageLabel 
        });
        
        if (result !== null) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const refetchSuccess = await refetchLegacyJourneys();
          if (!refetchSuccess) {
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

  const totalPipelineValue = filteredJourneys.reduce((sum, j) => sum + Number(j.value ?? 0), 0);
  
  const weightedPipelineValue = useMemo(() => {
    return filteredJourneys.reduce((sum, j) => {
      const stage = STAGES.find(s => s.id === j.stage);
      const weight = stage?.weight ?? 0;
      return sum + (Number(j.value ?? 0) * weight);
    }, 0);
  }, [filteredJourneys]);

  const pageTitle = "Journeys";
  const pageDescription = `${filteredJourneys.length} Journeys`;


  const exportToExcel = useCallback(async (options: { includePrimaryContactOnly: boolean }) => {
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
      'Lead Source',
      'Projected Value',
      'Journey Steps',
      'Contact Name',
      'Contact Email',
      'Contact Position',
      'Address'
    ];
    const uniqueRsmInitials = [...new Set(
      filteredJourneys
        .map(journey => journey.RSM)
        .filter(rsm => rsm && rsm.trim())
    )];

    const rsmFullNames = new Map<string, string>();
    uniqueRsmInitials.forEach(initials => {
      const displayName = rsmDisplayNames.get(initials);
      if (displayName) {
        const nameMatch = displayName.match(/^(.+?)\s*\(/);
        rsmFullNames.set(initials, nameMatch ? nameMatch[1].trim() : initials);
      } else {
        rsmFullNames.set(initials, initials);
      }
    });

    const journeyContacts = new Map<string, Array<{ Contact_Name: string; Contact_Email: string; Contact_Position: string }>>();
    const journeyAddresses = new Map<string, { AddressName: string; Address1: string; Address2: string; Address3: string; City: string; State: string; Country: string; ZipCode: string }>();

    await Promise.all(
      filteredJourneys.map(async (journey) => {
        try {
          const contactData = await api.get('/legacy/base/Journey_Contact/filter/custom', {
            filterField: 'Jrn_ID',
            filterValue: journey.id,
            fields: 'Contact_Name,Contact_Email,Contact_Position,IsPrimary'
          });

          if (contactData && Array.isArray(contactData) && contactData.length > 0) {
            if (options.includePrimaryContactOnly) {
              let selectedContact = contactData.find(contact => contact.IsPrimary === true || contact.IsPrimary === 'true' || contact.IsPrimary === 1);
              if (!selectedContact) {
                selectedContact = contactData[0];
              }

              journeyContacts.set(journey.id.toString(), [{
                Contact_Name: selectedContact.Contact_Name || '',
                Contact_Email: selectedContact.Contact_Email || '',
                Contact_Position: selectedContact.Contact_Position || ''
              }]);
            } else {
              journeyContacts.set(journey.id.toString(), contactData.map(contact => ({
                Contact_Name: contact.Contact_Name || '',
                Contact_Email: contact.Contact_Email || '',
                Contact_Position: contact.Contact_Position || ''
              })));
            }
          } else {
            journeyContacts.set(journey.id.toString(), [{
              Contact_Name: '',
              Contact_Email: '',
              Contact_Position: ''
            }]);
          }
        } catch (error) {
          console.error(`Error fetching contact data for journey ${journey.id}:`, error);
          journeyContacts.set(journey.id.toString(), [{
            Contact_Name: '',
            Contact_Email: '',
            Contact_Position: ''
          }]);
        }

        if (journey.Address_ID && journey.Company_ID) {
          try {
            const addressesData = await api.get('/legacy/std/Address/filter/custom', {
              filterField: 'Company_ID',
              filterValue: journey.Company_ID
            });

            let matchingAddress = null;

            if (addressesData && Array.isArray(addressesData)) {
              matchingAddress = addressesData.find(addr =>
                addr.Address_ID === journey.Address_ID ||
                addr.Address_ID === Number(journey.Address_ID)
              );
            } else if (addressesData && addressesData.Address_ID === journey.Address_ID) {
              matchingAddress = addressesData;
            }

            if (matchingAddress) {
              journeyAddresses.set(journey.id.toString(), {
                AddressName: matchingAddress.AddressName || '',
                Address1: matchingAddress.Address1 || '',
                Address2: matchingAddress.Address2 || '',
                Address3: matchingAddress.Address3 || '',
                City: matchingAddress.City || '',
                State: matchingAddress.State || '',
                Country: matchingAddress.Country || '',
                ZipCode: matchingAddress.ZipCode || ''
              });
            }
          } catch (error) {
            console.error(`Error fetching address data for journey ${journey.id}:`, error);
          }
        }
      })
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pipeline Export');

    const formatDateOnly = (dateString: any) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const dataRows = filteredJourneys.map(journey => {
      const customer = customersById.get(String(journey.customerId));
      const rsmFullName = journey.RSM ? rsmFullNames.get(journey.RSM) || journey.RSM : '';
      const contacts = journeyContacts.get(journey.id.toString()) || [{ Contact_Name: '', Contact_Email: '', Contact_Position: '' }];
      const address = journeyAddresses.get(journey.id.toString());

      const contactNames = contacts.map(c => c.Contact_Name).filter(Boolean).join('\n');
      const contactEmails = contacts.map(c => c.Contact_Email || '').join('\n');
      const contactPositions = contacts.map(c => c.Contact_Position || '').join('\n');

      const formattedAddress = address ? [
        address.AddressName,
        address.Address1,
        address.Address2,
        address.Address3,
        [address.City, address.State, address.ZipCode].filter(Boolean).join(', '),
        address.Country
      ].filter(Boolean).join('\n') : '';

      return [
        journey.Quote_Number || '',
        formatDateOnly(journey.CreateDT),
        formatDateOnly(journey.Action_Date),
        journey.Chance_To_Secure_order || '',
        formatDateOnly(journey.Expected_Decision_Date),
        journey.Journey_Stage || stageLabel(journey.stage),
        rsmFullName,
        journey.Industry || '',
        journey.Dealer || journey.Dealer_Name || journey.dealer || '',
        customer?.name || journey.companyName || journey.Target_Account || '',
        journey.Equipment_Type || '',
        journey.Lead_Source || '',
        Number(journey.Journey_Value || journey.value || 0),
        journey.Next_Steps || '',
        contactNames,
        contactEmails,
        contactPositions,
        formattedAddress
      ];
    });
    const lastColumn = String.fromCharCode(64 + headers.length);
    const lastRow = dataRows.length + 1;

    worksheet.addTable({
      name: 'PipelineTable',
      ref: `A1:${lastColumn}${lastRow}`,
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleLight16',
        showRowStripes: true,
      },
      columns: headers.map(header => ({ name: header, filterButton: true })),
      rows: dataRows
    });
    worksheet.columns.forEach((column: any, index: any) => {
      let maxLength = headers[index].length;

      worksheet.getColumn(index + 1).eachCell({ includeEmpty: false }, (cell: any) => {
        const cellValue = cell.value ? String(cell.value) : '';
        const lines = cellValue.split('\n');
        const longestLine = Math.max(...lines.map(line => line.length));
        maxLength = Math.max(maxLength, longestLine);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    worksheet.eachRow((row: any, rowNumber: any) => {
      if (rowNumber === 1) {
        row.height = 15;
        row.eachCell((cell: any) => {
          cell.font = { bold: true };
          cell.alignment = { wrapText: true, vertical: 'top' };
        });
        return;
      }
      let maxLines = 1;
      row.eachCell((cell: any, colNumber: any) => {
        cell.alignment = { wrapText: true, vertical: 'top' };

        const headerName = headers[colNumber - 1];
        if (headerName === 'Projected Value') {
          cell.numFmt = '$#,##0.00';
        }
        const cellValue = cell.value ? String(cell.value) : '';
        const columnWidth = worksheet.getColumn(colNumber).width || 10;
        const charsPerLine = Math.floor(columnWidth);

        let totalLines = 0;
        const explicitLines = cellValue.split('\n');

        explicitLines.forEach(line => {
          if (line.length === 0) {
            totalLines += 1;
          } else {
            const wrappedLines = Math.ceil(line.length / charsPerLine);
            totalLines += wrappedLines;
          }
        });

        maxLines = Math.max(maxLines, totalLines);
      });
      row.height = Math.max(maxLines * 15, 15);
    });
    const fileName = `pipeline-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
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
        onClick={toggleExportModal}
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
            rsmDisplayNames={rsmDisplayNames}
            journeyStatusFilter={journeyStatusFilter}
            setJourneyStatusFilter={setJourneyStatusFilter}
            employee={employee}
            setIsFilterModalOpen={setIsFilterModalOpen}
            showTags={showTags}
            setShowTags={setShowTags}
            kanbanBatchSize={kanbanBatchSize}
            setKanbanBatchSize={setKanbanBatchSize}
            viewMode={viewMode}
            validJourneyStatuses={validJourneyStatuses}
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
            employee={employee}
            journeyTags={journeyTags}
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
            rsmDisplayNames={rsmDisplayNames}
            journeyStatusFilter={journeyStatusFilter}
            setJourneyStatusFilter={setJourneyStatusFilter}
            employee={employee}
            setIsFilterModalOpen={setIsFilterModalOpen}
            viewMode={viewMode}
            validJourneyStatuses={validJourneyStatuses}
          />
          <ListView
            journeys={listViewJourneys}
            customersById={customersById}
            pagination={listViewPagination}
            onPageChange={handleListPageChange}
            onDeleteJourney={handleDeleteJourney}
            onSort={handleSort}
            stageLabel={stageLabel}
            sortField={sortField}
            sortDirection={sortDirection}
            isLoading={isLoadingListView}
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
            if (newJourney) {
              const adaptedJourney = adaptLegacyJourney(newJourney);
              setLegacyJourneys(prev => {
                const updated = prev ? [adaptedJourney, ...prev] : [adaptedJourney];
                return updated;
              });
              setJourneys(prev => {
                const updated = [adaptedJourney, ...prev];
                return updated;
              });
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
            const fetchData = async () => {
              const [journeysData] = await Promise.all([
                get('/legacy/base/Journey', {
                  page: 1,
                  limit: 200,
                  sort: 'CreateDT',
                  order: 'desc',
                  fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status'
                })
              ]);

              if (journeysData) {
                const journeysArray = journeysData.data ? journeysData.data : (Array.isArray(journeysData) ? journeysData : []);
                const mappedJourneys = journeysArray.map(adaptLegacyJourney);
                setJourneys(mappedJourneys);
                setLegacyJourneys(mappedJourneys);

                if (showTags) {
                  const journeyIds = mappedJourneys.map((j: any) => j.id.toString());
                  const tagsMap = await fetchJourneyTags(journeyIds);
                  setJourneyTags(tagsMap);
                }
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
      {isExportModalOpen && (
        <ExportExcelModal
          isOpen={isExportModalOpen}
          onClose={toggleExportModal}
          onExport={exportToExcel}
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