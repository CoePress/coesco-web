import { Download, Plus, Layout, List as ListIcon, BarChart3, Upload, Save, Bookmark, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ExcelJS from 'exceljs';

import { PageHeader, Modal, Button, Select, Input } from "@/components";
import { CreateJourneyModal } from "@/components/modals/create-journey-modal";
import { ImportExcelModal } from "@/components/modals/import-excel-modal";
import { ExportExcelModal } from "@/components/modals/export-excel-modal";
import { KanbanView } from "./journeys/journey-kanban";
import { ListView } from "./journeys/journey-list";
import { ProjectionsView } from "./journeys/journey-projections";
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
  const { get, patch } = useApi();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [journeyTags, setJourneyTags] = useState<Map<string, any[]>>(new Map());

  const [legacyJourneys, setLegacyJourneys] = useState<any[] | null>(null);

  const fetchJourneyTags = async (journeyIds: string[]) => {
    const tagsMap = new Map<string, any[]>();
    if (journeyIds.length === 0) return tagsMap;

    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < journeyIds.length; i += BATCH_SIZE) {
      batches.push(journeyIds.slice(i, i + BATCH_SIZE));
    }

    try {
      await Promise.all(
        batches.map(async (batch) => {
          const response = await get('/core/tags', {
            filter: JSON.stringify({
              parentTable: 'journeys',
              parentId: { in: batch }
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
        })
      );

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

    const expectedDecisionDate =
      normalizeDate(raw.Expected_Decision_Date) ??
      null

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
      CreateDT: normalizeDate(raw.CreateDT),
      Journey_Start_Date: normalizeDate(raw.Journey_Start_Date),
      Action_Date: raw.Action_Date,
      updatedAt: normalizeDate(raw.Action_Date) ?? normalizeDate(raw.CreateDT),
      Expected_Decision_Date: raw.Expected_Decision_Date,
      Chance_To_Secure_order: raw.Chance_To_Secure_order,
      Industry: raw.Industry,
      Dealer: raw.Dealer,
      Dealer_Name: raw.Dealer_Name,
      Equipment_Type: raw.Equipment_Type,
      Lead_Source: raw.Lead_Source,
      Next_Steps: raw.Next_Steps,
      Address_ID: raw.Address_ID,
      deletedAt: raw.Deleted === 1 || raw.Deleted === '1' || raw.Deleted === true ? 1 : 0,
    };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [journeysData, customersData, rsms, statuses] = await Promise.all([
          get('/legacy/base/Journey', {
            page: 1,
            limit: 200,
            sort: 'CreateDT',
            order: 'desc',
            fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status,Deleted'
          }),
          get('/legacy/base/Company', { sort: 'Company_ID', order: 'desc' }),
          fetchAvailableRsms({ get }),
          fetchDemographicCategory({ get }, 'Journey_status')
        ]);

        if (!cancelled && journeysData) {
          const journeysArray = journeysData.data ? journeysData.data : (Array.isArray(journeysData) ? journeysData : []);
          const mapped = journeysArray.map(adaptLegacyJourney);
          setLegacyJourneys(mapped);
          setJourneys(mapped);
        }

        if (!cancelled && customersData) {
          const customersArray = customersData.data ? customersData.data : (Array.isArray(customersData) ? customersData : []);
          setCustomers(customersArray);
        }

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
      } catch (error) {
        console.error("Error fetching data:", error);
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
    dateField: "expectedDecisionDate" as string,
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
  const [journeyStatusFilter, setJourneyStatusFilter] = useState<string[]>(() => getFromLocalStorage('journeyStatusFilter', []));
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "projections">(() => getFromLocalStorage('viewMode', 'kanban'));
  const [sortField, setSortField] = useState<string>(() => getFromLocalStorage('sortField', ''));
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => getFromLocalStorage('sortDirection', 'asc'));
  const [showTags, setShowTags] = useState<boolean>(() => getFromLocalStorage('showTags', false));
  const [kanbanBatchSize, setKanbanBatchSize] = useState<number>(() => getFromLocalStorage('kanbanBatchSize', 50));
  const [listPage, setListPage] = useState(1);
  const [listPageSize] = useState(25);
  const [listViewJourneys, setListViewJourneys] = useState<any[]>([]);
  const [listViewPagination, setListViewPagination] = useState({ page: 1, totalPages: 0, total: 0, limit: 25 });
  const [isLoadingListView, setIsLoadingListView] = useState(false);
  const [showDisabledJourneys, setShowDisabledJourneys] = useState(() => getFromLocalStorage('showDisabledJourneys', false));
  const [kanbanViewJourneys, setKanbanViewJourneys] = useState<any[]>([]);
  const [isLoadingKanbanView, setIsLoadingKanbanView] = useState(false);
  const [savedPresets, setSavedPresets] = useState<any[]>(() => getFromLocalStorage('savedPresets', []));
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const filteredJourneys = useMemo(() => {
    let results = baseJourneys ?? [];
    const q = searchTerm.trim();
    if (q) {
      if (q.toLowerCase() === 'tag:') {
        results = results.filter(j => (journeyTags.get(j.id.toString()) || []).length > 0);
      } else {
        const tagMatch = q.match(/tag:(\S+)/i);
        if (tagMatch) {
          const tagSearch = tagMatch[1].toUpperCase();
          const remainingSearch = q.replace(tagMatch[0], '').trim();

          if (tagSearch) {
            results = results.filter(j => {
              const tags = journeyTags.get(j.id.toString()) || [];
              return tags.some(tag => tag.description?.toUpperCase().includes(tagSearch));
            });
          }

          if (remainingSearch) {
            results = results.filter(j => {
              const searchableText = [j.companyName ?? '', customersById?.get(String(j.customerId))?.name ?? ''].join(' ');
              return fuzzyMatch(searchableText, remainingSearch);
            });
          }
        } else {
          results = results.filter(j => {
            const searchableText = [j.companyName ?? '', customersById?.get(String(j.customerId))?.name ?? ''].join(' ');
            return fuzzyMatch(searchableText, q);
          });
        }
      }
    }

    if (filters.confidenceLevels.length > 0) {
      results = results.filter(j => filters.confidenceLevels.includes(j.confidence ?? 0));
    }

    if (filters.dateRange[0] || filters.dateRange[1]) {
      results = results.filter(j => {
        const dateValue = j[filters.dateField] ? new Date(j[filters.dateField]) : null;
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
      if (!isNaN(minVal)) results = results.filter(j => (j.value ?? 0) >= minVal);
    }

    if (filters.maxValue) {
      const maxVal = parseFloat(filters.maxValue);
      if (!isNaN(maxVal)) results = results.filter(j => (j.value ?? 0) <= maxVal);
    }

    results = results.filter(j => filters.visibleStages.includes(j.stage ?? 1));

    if (rsmFilter) {
      results = results.filter(j => (j.RSM ?? "").toLowerCase().includes(rsmFilter.toLowerCase()));
    }

    if (journeyStatusFilter.length > 0) {
      results = results.filter(j =>
        journeyStatusFilter.some(status => (j.Journey_Status ?? "").toLowerCase() === status.toLowerCase())
      );
    }

    if (!showDisabledJourneys) {
      results = results.filter(j => j.deletedAt !== 1);
    }

    return results;
  }, [baseJourneys, searchTerm, filters, customersById, rsmFilter, journeyStatusFilter, journeyTags, showDisabledJourneys]);
  const buildStageConditions = (stageId: number) => {
    const stageMap: Record<number, any> = {
      1: { operator: "or", conditions: [
        { field: "Journey_Stage", operator: "contains", value: "LEAD" },
        { field: "Journey_Stage", operator: "contains", value: "OPEN" },
        { field: "Journey_Stage", operator: "contains", value: "NEW" }
      ]},
      2: { operator: "or", conditions: [
        { field: "Journey_Stage", operator: "contains", value: "QUALIFY" },
        { field: "Journey_Stage", operator: "contains", value: "QUALIFI" },
        { field: "Journey_Stage", operator: "contains", value: "PAIN" },
        { field: "Journey_Stage", operator: "contains", value: "DISCOVER" }
      ]},
      3: { operator: "or", conditions: [
        { field: "Journey_Stage", operator: "contains", value: "PRESENT" },
        { field: "Journey_Stage", operator: "contains", value: "DEMO" },
        { field: "Journey_Stage", operator: "contains", value: "PROPOSAL" },
        { field: "Journey_Stage", operator: "contains", value: "QUOTE" }
      ]},
      4: { field: "Journey_Stage", operator: "contains", value: "NEGOT" },
      5: { operator: "or", conditions: [
        { field: "Journey_Stage", operator: "contains", value: "PO" },
        { field: "Journey_Stage", operator: "contains", value: "WON" },
        { field: "Journey_Stage", operator: "contains", value: "CLOSEDWON" },
        { field: "Journey_Stage", operator: "contains", value: "CLOSED WON" },
        { field: "Journey_Stage", operator: "contains", value: "ORDER" }
      ]},
      6: { operator: "or", conditions: [
        { field: "Journey_Stage", operator: "contains", value: "LOST" },
        { field: "Journey_Stage", operator: "contains", value: "CLOSEDLOST" },
        { field: "Journey_Stage", operator: "contains", value: "CLOSED LOST" },
        { field: "Journey_Stage", operator: "contains", value: "DECLIN" }
      ]}
    };
    return stageMap[stageId] || null;
  };

  const buildFilterConditions = (includeSearch = true) => {
    const filterConditions: any[] = [];
    const trimmedSearch = searchTerm.trim();

    if (includeSearch && searchTerm && trimmedSearch.toLowerCase() !== 'tag:') {
      filterConditions.push({
        field: "Target_Account",
        operator: "contains",
        value: trimmedSearch
      });
    }

    if (rsmFilter) {
      filterConditions.push({ field: "RSM", operator: "contains", value: rsmFilter });
    }

    if (journeyStatusFilter.length > 0) {
      filterConditions.push({ field: "Journey_Status", operator: "in", values: journeyStatusFilter });
    }

    if (filters.priority) {
      filterConditions.push({ field: "Priority", operator: "equals", value: filters.priority });
    }

    if (filters.confidenceLevels.length > 0) {
      const confidenceValues = filters.confidenceLevels.map((level: number) => {
        if (level === 0) return "Closed Lost";
        if (level === 100) return "Closed Won";
        return `${level}%`;
      });
      filterConditions.push({ field: "Chance_To_Secure_order", operator: "in", values: confidenceValues });
    }

    if (filters.dateRange[0] || filters.dateRange[1]) {
      const fieldMap: Record<string, string> = {
        'expectedDecisionDate': 'Expected_Decision_Date',
        'Action_Date': 'Action_Date',
        'Journey_Start_Date': 'Journey_Start_Date',
        'Quote_Presentation_Date': 'Quote_Presentation_Date',
        'Expected_Decision_Date': 'Expected_Decision_Date',
        'Date_PO_Received': 'Date_PO_Received',
        'Date_Lost': 'Date_Lost'
      };
      const dbField = fieldMap[filters.dateField] || 'Expected_Decision_Date';

      if (filters.dateRange[0]) {
        filterConditions.push({ field: dbField, operator: "gte", value: filters.dateRange[0] });
      }
      if (filters.dateRange[1]) {
        filterConditions.push({ field: dbField, operator: "lte", value: filters.dateRange[1] });
      }
    }

    if (filters.minValue) {
      filterConditions.push({ field: "Journey_Value", operator: "gte", value: parseFloat(filters.minValue) });
    }

    if (filters.maxValue) {
      filterConditions.push({ field: "Journey_Value", operator: "lte", value: parseFloat(filters.maxValue) });
    }

    if (filters.visibleStages.length !== STAGES.length) {
      const stageConditions = filters.visibleStages.map(buildStageConditions).filter(Boolean);
      if (stageConditions.length > 0) {
        filterConditions.push({ operator: "or", conditions: stageConditions });
      }
    }

    return filterConditions;
  };

  const fetchListViewJourneys = useCallback(async () => {
    if (isLoadingListView) return;

    setIsLoadingListView(true);
    try {
      const sortFieldMap: Record<string, string> = {
        'customerId': 'Target_Account',
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
        fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status,Deleted'
      };

      const filterConditions = buildFilterConditions();
      if (!showDisabledJourneys) {
        filterConditions.push({ field: "Deleted", operator: "notEquals", value: 1 });
      }
      if (filterConditions.length > 0) {
        params.filter = JSON.stringify({ filters: filterConditions });
      }

      const raw = await get('/legacy/base/Journey', params);

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
  }, [isLoadingListView, listPage, listPageSize, sortField, sortDirection, get, searchTerm, rsmFilter, journeyStatusFilter, filters, showDisabledJourneys]);

  const fetchKanbanViewJourneys = useCallback(async () => {
    if (isLoadingKanbanView) return;

    const trimmedSearch = searchTerm.trim();
    const hasTagSearch = trimmedSearch.toLowerCase().startsWith('tag:');

    if (hasTagSearch) {
      setKanbanViewJourneys(filteredJourneys.slice(0, kanbanBatchSize));
      return;
    }

    setIsLoadingKanbanView(true);
    try {
      const params: any = {
        page: 1,
        limit: kanbanBatchSize,
        sort: 'CreateDT',
        order: 'desc',
        fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status,Deleted'
      };

      const filterConditions = buildFilterConditions();
      if (!showDisabledJourneys) {
        filterConditions.push({ field: "Deleted", operator: "notEquals", value: 1 });
      }
      if (filterConditions.length > 0) {
        params.filter = JSON.stringify({ filters: filterConditions });
      }

      const raw = await get('/legacy/base/Journey', params);

      if (raw !== null) {
        const journeysArray = raw.data ? raw.data : (Array.isArray(raw) ? raw : []);
        const mapped = journeysArray.map(adaptLegacyJourney);
        setKanbanViewJourneys(mapped);
      }
    } catch (error) {
      console.error("Error fetching kanban view journeys:", error);
    } finally {
      setIsLoadingKanbanView(false);
    }
  }, [isLoadingKanbanView, kanbanBatchSize, get, searchTerm, rsmFilter, journeyStatusFilter, filters, filteredJourneys, showDisabledJourneys]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchListViewJourneys();
    }
  }, [viewMode, listPage, sortField, sortDirection, searchTerm, rsmFilter, journeyStatusFilter, filters, showDisabledJourneys]);

  useEffect(() => {
    if (viewMode === 'kanban') {
      fetchKanbanViewJourneys();
    }
  }, [viewMode, kanbanBatchSize, searchTerm, rsmFilter, journeyStatusFilter, filters, showDisabledJourneys]);

  const handleListPageChange = (newPage: number) => {
    setListPage(newPage);
  };

  useEffect(() => {
    setListPage(1);
  }, [searchTerm]);
  useEffect(() => {
    saveToLocalStorage('searchTerm', searchTerm);
    saveToLocalStorage('filters', filters);
    saveToLocalStorage('rsmFilter', rsmFilter);
    saveToLocalStorage('rsmFilterDisplay', rsmFilterDisplay);
    saveToLocalStorage('journeyStatusFilter', journeyStatusFilter);
    saveToLocalStorage('viewMode', viewMode);
    saveToLocalStorage('sortField', sortField);
    saveToLocalStorage('sortDirection', sortDirection);
    saveToLocalStorage('showTags', showTags);
    saveToLocalStorage('kanbanBatchSize', kanbanBatchSize);
    saveToLocalStorage('showDisabledJourneys', showDisabledJourneys);
  }, [searchTerm, filters, rsmFilter, rsmFilterDisplay, journeyStatusFilter, viewMode, sortField, sortDirection, showTags, kanbanBatchSize, showDisabledJourneys]);

  useEffect(() => {
    if (showTags && viewMode === 'kanban' && kanbanViewJourneys.length > 0) {
      const journeyIds = kanbanViewJourneys.map((j: any) => j.id.toString());
      fetchJourneyTags(journeyIds).then(tagsMap => {
        setJourneyTags(tagsMap);
      });
    }
  }, [showTags, viewMode, kanbanViewJourneys]);

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
    const journeysForCalculation = viewMode === "kanban" ? kanbanViewJourneys : filteredJourneys;
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
  }, [idsByStage, filteredJourneys, kanbanViewJourneys, visibleStageIds, viewMode]);

  useEffect(() => {
    const next = STAGES.reduce((acc, s) => {
      acc[s.id] = [];
      return acc;
    }, {} as Record<number, string[]>);

    const journeysForStaging = viewMode === "kanban" ? kanbanViewJourneys : filteredJourneys;
    (journeysForStaging ?? []).forEach(j => {
      const sid: StageId = (j.stage as StageId) ?? 1;
      if (!next[sid]) next[sid] = [];
      next[sid].push(String(j.id));
    });

    setIdsByStage(next);
  }, [filteredJourneys, kanbanViewJourneys, viewMode]);

  const handleDeleteJourney = useCallback(async (journeyId: string) => {
    try {
      const journey = [...(legacyJourneys || []), ...journeys, ...listViewJourneys, ...kanbanViewJourneys]
        .find(j => j.id.toString() === journeyId);

      if (!journey) return;

      const isCurrentlyDeleted = journey.deletedAt === 1;
      const newDeletedValue = isCurrentlyDeleted ? 0 : 1;

      const success = await patch(`/legacy/base/Journey/${journeyId}`, {
        Deleted: newDeletedValue
      });

      if (success) {
        const updateJourney = (j: any) =>
          j.id.toString() === journeyId
            ? { ...j, deletedAt: newDeletedValue }
            : j;

        setLegacyJourneys(prev => prev ? prev.map(updateJourney) : prev);
        setJourneys(prev => prev.map(updateJourney));
        setListViewJourneys(prev => prev.map(updateJourney));
        setKanbanViewJourneys(prev => prev.map(updateJourney));

        if (!showDisabledJourneys && !isCurrentlyDeleted) {
          setListViewJourneys(prev => prev.filter(j => j.id.toString() !== journeyId));
          setKanbanViewJourneys(prev => prev.filter(j => j.id.toString() !== journeyId));
        }

        if (viewMode === 'list') {
          fetchListViewJourneys();
        } else if (viewMode === 'kanban') {
          fetchKanbanViewJourneys();
        }
      } else {
        alert("Failed to toggle journey status. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling journey status:", error);
      alert("Failed to toggle journey status. Please try again.");
    }
  }, [patch, legacyJourneys, journeys, listViewJourneys, kanbanViewJourneys, showDisabledJourneys, viewMode, fetchListViewJourneys, fetchKanbanViewJourneys]);

  const handleTagsUpdated = useCallback(async () => {
    if (!showTags) return;

    const journeysToUpdate = viewMode === 'kanban' ? kanbanViewJourneys : (legacyJourneys || journeys);
    if (journeysToUpdate && journeysToUpdate.length > 0) {
      const journeyIds = journeysToUpdate.map((j: any) => j.id.toString());
      const tagsMap = await fetchJourneyTags(journeyIds);
      setJourneyTags(tagsMap);
    }
  }, [showTags, viewMode, kanbanViewJourneys, legacyJourneys, journeys]);

  const handleStageUpdate = useCallback(async (journeyId: string, newStage: number) => {
    const stageLabel = STAGES.find(s => s.id === newStage)?.label;
    if (!stageLabel) {
      console.error(`Invalid stage ID: ${newStage}`);
      return;
    }

    const updateLocalState = () => {
      setLegacyJourneys((prev) =>
        (prev ?? []).map((j) =>
          j.id.toString() === journeyId
            ? { ...j, stage: newStage, updatedAt: new Date().toISOString() }
            : j
        )
      );
      setKanbanViewJourneys((prev) =>
        prev.map((j) =>
          j.id.toString() === journeyId
            ? { ...j, stage: newStage, updatedAt: new Date().toISOString() }
            : j
        )
      );
    };

    updateLocalState();

    try {
      await patch(`/legacy/base/Journey/${journeyId}`, { Journey_Stage: stageLabel });
    } catch (error) {
      console.error("Error updating journey stage:", error);
    }
  }, [patch]);

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

  const getCurrentFilterState = () => ({
    searchTerm,
    filters,
    rsmFilter,
    rsmFilterDisplay,
    journeyStatusFilter,
    sortField,
    sortDirection,
    viewMode
  });

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      createdAt: new Date().toISOString(),
      ...getCurrentFilterState()
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    saveToLocalStorage('savedPresets', updatedPresets);
    setNewPresetName('');
  };

  const handleLoadPreset = (preset: any) => {
    setSearchTerm(preset.searchTerm || '');
    setFilters(preset.filters || {
      confidenceLevels: [],
      dateRange: ["", ""],
      dateField: "expectedDecisionDate",
      priority: "",
      minValue: "",
      maxValue: "",
      visibleStages: STAGES.map(s => s.id),
    });
    setRsmFilter(preset.rsmFilter || '');
    setRsmFilterDisplay(preset.rsmFilterDisplay || '');
    setJourneyStatusFilter(preset.journeyStatusFilter || []);
    setSortField(preset.sortField || '');
    setSortDirection(preset.sortDirection || 'asc');
    setViewMode(preset.viewMode || 'kanban');
    setIsPresetModalOpen(false);
  };

  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    saveToLocalStorage('savedPresets', updatedPresets);
  };

  const totalPipelineValue = filteredJourneys.reduce((sum, j) => sum + Number(j.value ?? 0), 0);

  const weightedPipelineValue = useMemo(() => {
    return filteredJourneys.reduce((sum, j) => {
      const stage = STAGES.find(s => s.id === j.stage);
      const weight = stage?.weight ?? 0;
      return sum + (Number(j.value ?? 0) * weight);
    }, 0);
  }, [filteredJourneys]);

  const pageTitle = "Journeys";
  const pageDescription = viewMode === "list"
    ? `Showing ${listViewJourneys.length} of ${listViewPagination.total} Journeys`
    : viewMode === "kanban"
      ? `Showing ${kanbanViewJourneys.length} of ${filteredJourneys.length} Journeys`
      : `${filteredJourneys.length} Journeys`;


  const exportToExcel = useCallback(async (options: { includePrimaryContactOnly: boolean }) => {
    const headers = ['Quote Number', 'CreateDate', 'ActionDate', 'Confidence', 'Est PO Date', 'Stage', 'RSM', 'Industry', 'Dealer', 'Customer', 'Equipment', 'Lead Source', 'Projected Value', 'Journey Steps', 'Contact Name', 'Contact Email', 'Contact Position', 'Address'];

    const rsmFullNames = new Map(
      [...new Set(filteredJourneys.map(j => j.RSM).filter(Boolean))].map(initials => {
        const displayName = rsmDisplayNames.get(initials);
        const nameMatch = displayName?.match(/^(.+?)\s*\(/);
        return [initials, nameMatch ? nameMatch[1].trim() : initials];
      })
    );

    const journeyContacts = new Map();
    const journeyAddresses = new Map();
    const emptyContact = [{ Contact_Name: '', Contact_Email: '', Contact_Position: '' }];

    await Promise.all(
      filteredJourneys.map(async (journey) => {
        try {
          const contactData = await get('/legacy/base/Journey_Contact/filter/custom', {
            filterField: 'Jrn_ID',
            filterValue: journey.id,
            fields: 'Contact_Name,Contact_Email,Contact_Position,IsPrimary'
          });
          if (contactData?.length) {
            const contacts = options.includePrimaryContactOnly
              ? [contactData.find((c: any) => c.IsPrimary === true || c.IsPrimary === 'true' || c.IsPrimary === 1) || contactData[0]]
              : contactData;
            journeyContacts.set(journey.id.toString(), contacts.map((c: any) => ({
              Contact_Name: c.Contact_Name || '',
              Contact_Email: c.Contact_Email || '',
              Contact_Position: c.Contact_Position || ''
            })));
          } else {
            journeyContacts.set(journey.id.toString(), emptyContact);
          }
        } catch (error) {
          console.error(`Error fetching contact data for journey ${journey.id}:`, error);
          journeyContacts.set(journey.id.toString(), emptyContact);
        }

        if (journey.Address_ID && journey.Company_ID) {
          try {
            const addressesData = await get('/legacy/std/Address/filter/custom', {
              filterField: 'Company_ID',
              filterValue: journey.Company_ID
            });

            const matchingAddress = Array.isArray(addressesData)
              ? addressesData.find(addr => addr.Address_ID === journey.Address_ID || addr.Address_ID === Number(journey.Address_ID))
              : (addressesData?.Address_ID === journey.Address_ID ? addressesData : null);

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

    const formatDateOnly = (d: any) => d ? new Date(d).toLocaleDateString('en-US') : '';

    const dataRows = filteredJourneys.map(journey => {
      const contacts = journeyContacts.get(journey.id.toString()) || [{ Contact_Name: '', Contact_Email: '', Contact_Position: '' }];
      const address = journeyAddresses.get(journey.id.toString());

      return [
        journey.Quote_Number || '',
        formatDateOnly(journey.CreateDT),
        formatDateOnly(journey.Action_Date),
        journey.Chance_To_Secure_order || '',
        formatDateOnly(journey.Expected_Decision_Date),
        journey.Journey_Stage || stageLabel(journey.stage),
        journey.RSM ? rsmFullNames.get(journey.RSM) || journey.RSM : '',
        journey.Industry || '',
        journey.Dealer || journey.Dealer_Name || journey.dealer || '',
        customersById.get(String(journey.customerId))?.name || journey.companyName || journey.Target_Account || '',
        journey.Equipment_Type || '',
        journey.Lead_Source || '',
        Number(journey.Journey_Value || journey.value || 0),
        journey.Next_Steps || '',
        contacts.map((c: any) => c.Contact_Name).filter(Boolean).join('\n'),
        contacts.map((c: any) => c.Contact_Email || '').join('\n'),
        contacts.map((c: any) => c.Contact_Position || '').join('\n'),
        address ? [address.AddressName, address.Address1, address.Address2, address.Address3, [address.City, address.State, address.ZipCode].filter(Boolean).join(', '), address.Country].filter(Boolean).join('\n') : ''
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
        const lines = String(cell.value || '').split('\n');
        maxLength = Math.max(maxLength, ...lines.map(line => line.length));
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    worksheet.eachRow((row: any, rowNumber: any) => {
      row.height = 15;
      let maxLines = 1;
      row.eachCell((cell: any, colNumber: any) => {
        cell.alignment = { wrapText: true, vertical: 'top' };
        if (rowNumber === 1) {
          cell.font = { bold: true };
        } else {
          if (headers[colNumber - 1] === 'Projected Value') cell.numFmt = '$#,##0.00';
          const cellValue = String(cell.value || '');
          const columnWidth = worksheet.getColumn(colNumber).width || 10;
          const totalLines = cellValue.split('\n').reduce((sum, line) =>
            sum + (line.length === 0 ? 1 : Math.ceil(line.length / Math.floor(columnWidth))), 0);
          maxLines = Math.max(maxLines, totalLines);
        }
      });
      if (rowNumber > 1) row.height = Math.max(maxLines * 15, 15);
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
        onClick={() => setIsPresetModalOpen(true)}
      >
        <Bookmark size={16} />
        Presets
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
            journeys={kanbanViewJourneys}
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
            isLoading={isLoadingKanbanView}
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
            showDisabled={showDisabledJourneys}
            onToggleShowDisabled={setShowDisabledJourneys}
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
              if (viewMode === 'kanban') {
                fetchKanbanViewJourneys();
              }
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
            if (viewMode === 'kanban') {
              fetchKanbanViewJourneys();
            } else if (viewMode === 'list') {
              fetchListViewJourneys();
            }

            const fetchData = async () => {
              const [journeysData] = await Promise.all([
                get('/legacy/base/Journey', {
                  page: 1,
                  limit: 200,
                  sort: 'CreateDT',
                  order: 'desc',
                  fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Value,Priority,Quote_Number,Expected_Decision_Date,Quote_Presentation_Date,Date_PO_Received,Journey_Start_Date,CreateDT,Action_Date,Chance_To_Secure_order,Company_ID,Next_Steps,Address_ID,RSM,Journey_Status,Deleted'
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
          showDisabled={showDisabledJourneys}
          onApply={(newFilters, newShowDisabled) => {
            setFilters(newFilters);
            setShowDisabledJourneys(newShowDisabled);
            setIsFilterModalOpen(false);
          }}
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
      {isPresetModalOpen && (
        <Modal
          isOpen={isPresetModalOpen}
          onClose={() => {
            setIsPresetModalOpen(false);
            setNewPresetName('');
          }}
          title="Search Presets"
          size="md"
        >
          <div className="space-y-6">
            <div className="pb-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text mb-3">Save Current Search</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., High Priority Open Journeys"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim()}
                >
                  <Save size={16} />
                  Save
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Saved Presets</h3>
              {savedPresets.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-3 bg-surface rounded border border-border hover:bg-background transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-text">{preset.name}</div>
                        <div className="text-xs text-text-muted">
                          Saved on {new Date(preset.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="secondary-outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete preset "${preset.name}"?`)) {
                              handleDeletePreset(preset.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  No saved presets yet. Save your current search configuration above.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setIsPresetModalOpen(false);
                  setNewPresetName('');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const FilterModal = ({
  isOpen,
  filters,
  showDisabled,
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
  showDisabled: boolean;
  onApply: (filters: any, showDisabled: boolean) => void;
  onClose: () => void;
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [localShowDisabled, setLocalShowDisabled] = useState(showDisabled);
  
  useEffect(() => {
    setLocalFilters(filters);
    setLocalShowDisabled(showDisabled);
  }, [filters, showDisabled, isOpen]);
  
  const handleReset = () => {
    setLocalFilters({
      confidenceLevels: [],
      dateRange: ["", ""],
      dateField: "expectedDecisionDate",
      priority: "",
      minValue: "",
      maxValue: "",
      visibleStages: STAGES.map(s => s.id),
    });
    setLocalShowDisabled(false);
  };
  
  const hasActiveFilters =
    localFilters.confidenceLevels.length > 0 ||
    localFilters.dateRange[0] ||
    localFilters.dateRange[1] ||
    localFilters.priority ||
    localFilters.minValue ||
    localFilters.maxValue ||
    localFilters.visibleStages.length !== STAGES.length ||
    localShowDisabled;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Pipeline" size="md">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Confidence Level</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
              { value: "expectedDecisionDate", label: "Expected Decision Date" },
              { value: "Action_Date", label: "Action Date" },
              { value: "Journey_Start_Date", label: "Journey Start Date" },
              { value: "Quote_Presentation_Date", label: "Quote Presentation Date" },
              { value: "Expected_Decision_Date", label: "Expected Decision Date (Raw)" },
              { value: "Date_PO_Received", label: "PO Received Date" },
              { value: "Date_Lost", label: "Date Lost" }
            ]}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="border rounded p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-rows-2 md:grid-flow-col gap-2">
              {STAGES.map(stage => (
                <label key={stage.id} className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded">
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

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localShowDisabled}
              onChange={(e) => setLocalShowDisabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-text">Show disabled journeys</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
          <Button
            variant="secondary-outline"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="w-full sm:w-auto"
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary-outline" onClick={onClose} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => onApply(localFilters, localShowDisabled)} className="flex-1 sm:flex-initial">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};


export default Pipeline;