import {
  Download,
  MoreHorizontal,
  Plus,
  Layout,
  List as ListIcon,
  Filter,
  BarChart3
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  type CollisionDetection
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { PageHeader, StatusBadge, Modal, Button, Input, Select } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { Link, useNavigate } from "react-router-dom";
import Table from "@/components/ui/table";
import { useAuth } from "@/contexts/auth.context";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STAGES = [
  { id: 1, label: "Lead", weight: 0.20 },
  { id: 2, label: "Qualified", weight: 0.40 },
  { id: 3, label: "Presentations", weight: 0.60 },
  { id: 4, label: "Negotiation", weight: 0.90 },
  { id: 5, label: "Closed Won", weight: 1.0 },
  { id: 6, label: "Closed Lost", weight: 0.0 },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const stageLabel = (id?: number) =>
  STAGES.find(s => s.id === Number(id))?.label ?? `Stage ${id ?? ""}`;

const columnIdPrefix = "column-";

const DroppableColumn = ({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "bg-blue-50" : ""} transition-colors`}
    >
      {children}
    </div>
  );
};

const PRIORITY_CONFIG = {
  A: { style: "error", color: "bg-red-500", label: "Highest" },
  B: { style: "warning", color: "bg-orange-500", label: "High" },
  C: { style: "default", color: "bg-yellow-500", label: "Medium" },
  D: { style: "success", color: "bg-green-500", label: "Lowest" },
} as const;

const getPriorityConfig = (priority: string) => {
  const p = String(priority ?? "").toUpperCase();
  return PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG] || {
    style: "default",
    color: "bg-gray-400",
    label: "Medium"
  };
};


const JourneyCard = memo(({
  journey,
  customer,
  isDragging = false,
  onClick,
  style,
  ...dragProps
}: {
  journey: any;
  customer?: any;
  isDragging?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
} & any) => {
  const priorityConfig = useMemo(() => getPriorityConfig(journey.priority), [journey.priority]);
  
  return (
    <div
      style={style}
      onClick={onClick}
      className="bg-foreground rounded shadow-sm border border-border p-3 cursor-move select-none mb-2 
        hover:shadow-md hover:bg-opacity-90 hover:border-neutral-500 transition-all duration-200"
      {...dragProps}
    >
      <div className="flex items-center gap-2 mb-1">
        <div 
          className={`w-3 h-3 rounded-full ${priorityConfig.color} relative group cursor-help`}
          title={`Priority: ${journey.priority || 'None'} (${priorityConfig.label})`}
        >
          <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Priority: {journey.priority || 'None'} ({priorityConfig.label})
          </div>
        </div>
        <div className="text-sm font-medium text-neutral-400 truncate flex-1">
          {journey.name}
        </div>
      </div>
      {journey.Quote_Number && (
        <div className="text-xs text-neutral-500 mb-1">
          Quote #: {journey.Quote_Number}
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-neutral-400">
          {formatCurrency(journey.value)}
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.style}`}>
          {journey.priority}
        </div>
      </div>
      <div className="text-xs text-neutral-400">
        Close date: {formatDate(journey.closeDate)}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t">
        <div className="text-xs text-neutral-400">
          Last activity: {formatDate(journey.updatedAt)}
        </div>
        {!isDragging && (
          <button
            className="text-neutral-400 hover:text-neutral-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

const SortableItem = memo(({
  journey,
  customersById,
}: {
  journey: any;
  customersById: Map<string, any>;
}) => {
  const navigate = useNavigate();
  const customer = customersById?.get(String(journey.customerId));

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: journey.id.toString() });

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation();
      navigate(`/sales/pipeline/${journey.id}`, {
        state: { journey, customer }
      });
    }
  }, [isDragging, navigate, journey, customer]);

  return (
    <JourneyCard
      ref={setNodeRef}
      journey={journey}
      customer={customer}
      isDragging={isDragging}
      onClick={handleClick}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    />
  );
});

const DragPreview = memo(({
  journey,
  customersById,
}: {
  journey: any;
  customersById: Map<string, any>;
}) => {
  const customer = customersById?.get(String(journey.customerId));
  return (
    <JourneyCard
      journey={journey}
      customer={customer}
      isDragging
      className="select-none"
    />
  );
});

const PipelineHeader = ({ searchTerm, setSearchTerm, rsmFilterDisplay, setRsmFilter, setRsmFilterDisplay, availableRsms, employee, setIsFilterModalOpen }: any) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-foreground">
    <div className="flex items-center gap-4">
      <Input
        placeholder="Search journeys..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-64"
      />
      <Select
        value={rsmFilterDisplay}
        onChange={(e) => {
          if (e.target.value === 'my-journeys') {
            const userInitials = employee?.number;
            setRsmFilter(userInitials || "");
            setRsmFilterDisplay('my-journeys');
          } else {
            setRsmFilter(e.target.value);
            setRsmFilterDisplay(e.target.value);
          }
        }}
        options={[
          { value: "", label: "All RSMs" },
          { value: "my-journeys", label: "My Journeys" },
          ...availableRsms.filter((rsm: string) => rsm && rsm.trim()).map((rsm: string) => ({ value: rsm, label: rsm }))
        ]}
        className="w-48"
      />
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="secondary-outline"
        size="sm"
        onClick={() => setIsFilterModalOpen(true)}
        className="flex items-center gap-2"
      >
        <Filter size={14} />
        Advanced Filters
      </Button>
    </div>
  </div>
);

const Pipeline = () => {
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const toggleJourneyModal = () => setIsJourneyModalOpen(prev => !prev);

  const { user, employee } = useAuth();
  const { put, get } = useApi();
  const [journeys, setJourneys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [legacyJourneys, setLegacyJourneys] = useState<any[] | null>(null);

  // Fetch journeys and customers data
  useEffect(() => {
    const fetchData = async () => {
      const [journeysData, customersData] = await Promise.all([
        get('/journeys'),
        get('/companies')
      ]);
      
      if (journeysData) {
        // Handle both array response and entities property
        setJourneys(Array.isArray(journeysData) ? journeysData : journeysData.entities || []);
      }
      
      if (customersData) {
        // Handle both array response and entities property
        setCustomers(Array.isArray(customersData) ? customersData : customersData.entities || []);
      }
    };
    
    fetchData();
  }, [get]);

  const refetchLegacyJourneys = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/legacy/base/Journey?sort=CreateDT&order=desc&limit=1600`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (response.ok) {
        const raw = await response.json();
        const mapped = Array.isArray(raw) ? raw.map(adaptLegacyJourney) : [];
        setLegacyJourneys(mapped);
        return true;
      } else {
        console.error("Legacy journeys refetch failed:", response.status, await response.text());
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
      Company_ID: raw.Company_ID,
    };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/legacy/base/Journey?sort=CreateDT&order=desc&limit=1600`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        if (response.ok) {
          const raw = await response.json();
          const mapped = Array.isArray(raw) ? raw.map(adaptLegacyJourney) : [];
          if (!cancelled) setLegacyJourneys(mapped);
        } else {
          console.error("Legacy journeys fetch failed:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Error fetching Journeys:", error);
      }
      try {
        const response = await fetch(
          `http://localhost:8080/api/legacy/getrsms`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        if (response.ok) {
          const raw = await response.json();
          if (!cancelled && Array.isArray(raw)) {
            setAvailableRsms(raw);
          }
        } else {
          console.error("RSM fetch failed:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Error fetching RSMS:", error);
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
  const [rsmFilter, setRsmFilter] = useState<string>(() => getFromLocalStorage('rsmFilter', ''));
  const [rsmFilterDisplay, setRsmFilterDisplay] = useState<string>(() => getFromLocalStorage('rsmFilterDisplay', ''));
  const [availableRsms, setAvailableRsms] = useState<string[]>([]);

  const fuzzyMatch = useCallback((text: string, query: string): boolean => {
    if (!query) return true;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) return true;
    
    const cleanText = textLower.replace(/[^a-z0-9]/g, '');
    const cleanQuery = queryLower.replace(/[^a-z0-9]/g, '');
    
    if (cleanText.includes(cleanQuery)) return true;
    
    let textIndex = 0;
    let queryIndex = 0;
    let mismatches = 0;
    const maxMismatches = Math.floor(queryLower.length * 0.3);
    
    while (textIndex < textLower.length && queryIndex < queryLower.length) {
      if (textLower[textIndex] === queryLower[queryIndex]) {
        queryIndex++;
      } else {
        mismatches++;
        if (mismatches > maxMismatches) return false;
      }
      textIndex++;
    }
    
    return queryIndex >= queryLower.length * 0.7;
  }, []);

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
    
    return results;
  }, [baseJourneys, searchTerm, filters, customersById, rsmFilter]);

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
  
  const listJourneys = useMemo(() => {
    return filteredJourneys.slice(0, listBatchSize);
  }, [filteredJourneys, listBatchSize]);

  const hasMoreJourneys = filteredJourneys.length > listBatchSize;

  const loadMoreJourneys = useCallback(() => {
    if (isLoadingMore || !hasMoreJourneys) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setListBatchSize(prev => prev + 200);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreJourneys]);

  // Scroll detection for auto-loading
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target || viewMode !== "list") return;
    
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    
    if (isNearBottom && hasMoreJourneys && !isLoadingMore) {
      loadMoreJourneys();
    }
  }, [viewMode, hasMoreJourneys, isLoadingMore, loadMoreJourneys]);

  // Add scroll listener for list view
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (viewMode !== "list" || !listContainerRef.current) return;

    const scrollContainer = listContainerRef.current;

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = (e: Event) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleScroll(e), 100);
    };

    scrollContainer.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [viewMode, handleScroll]);

  // Reset batch size when filters change
  useEffect(() => {
    setListBatchSize(200);
  }, [searchTerm, filters, rsmFilter]);

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
    saveToLocalStorage('viewMode', viewMode);
  }, [viewMode]);
  
  // For kanban view, filter visible stages
  const visibleStageIds = filters.visibleStages;
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Increased to reduce accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stageFromDroppableId = (droppableId: string): number | undefined =>
    droppableId.startsWith(columnIdPrefix)
      ? Number(droppableId.replace(columnIdPrefix, ""))
      : undefined;

  const findStageByItemId = (id: string): number | undefined => {
    const key = Object.keys(idsByStage).find((k) =>
      (idsByStage[Number(k)] ?? []).includes(id)
    );
    return key ? Number(key) : undefined;
  };

  const stageFor = (id: string): number | undefined =>
    stageFromDroppableId(id) ?? findStageByItemId(id);

  const handleDragStart = useCallback(({ active }: any) => {
    setActiveId(active.id.toString());
  }, []);

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    const overId = getFirstCollision(intersections, "id");
    return overId ? [{ id: overId }] : [];
  }, []);

  const handleDragOver = useCallback(({ active, over }: any) => {
    if (!over) return;

    const activeContainerId: string | undefined =
      active?.data?.current?.sortable?.containerId;
    const sourceStage =
      (activeContainerId && stageFromDroppableId(activeContainerId)) ??
      findStageByItemId(String(active.id));

    const targetStage =
      stageFromDroppableId(String(over.id)) ??
      (over?.data?.current?.sortable?.containerId
        ? stageFromDroppableId(over.data.current.sortable.containerId)
        : undefined) ??
      findStageByItemId(String(over.id));

    if (!sourceStage || !targetStage || sourceStage === targetStage) return;

    setIdsByStage((prev) => {
      const sourceItems = [...(prev[sourceStage] ?? [])];
      const targetItems = [...(prev[targetStage] ?? [])];
      const activeIndex = sourceItems.indexOf(String(active.id));
      if (activeIndex === -1) return prev;

      sourceItems.splice(activeIndex, 1);

      const isOverAColumn =
        typeof over.id === "string" && String(over.id).startsWith(columnIdPrefix);
      const overIndex = isOverAColumn ? 0 : targetItems.indexOf(String(over.id));
      const insertAt = overIndex < 0 ? 0 : overIndex;

      targetItems.splice(insertAt, 0, String(active.id));

      return {
        ...prev,
        [sourceStage]: sourceItems,
        [targetStage]: targetItems,
      };
    });
  }, [stageFromDroppableId, findStageByItemId, columnIdPrefix]);
  

  const handleDragEnd = async ({ active, over }: any) => {
    setActiveId(null);
    if (!over) return;

    const activeContainerId: string | undefined =
      active?.data?.current?.sortable?.containerId;

    const fromStage =
      (activeContainerId && stageFromDroppableId(activeContainerId)) ??
      findStageByItemId(String(active.id));

    const toStage =
      stageFromDroppableId(String(over.id)) ??
      (over?.data?.current?.sortable?.containerId
        ? stageFromDroppableId(over.data.current.sortable.containerId)
        : undefined) ??
      findStageByItemId(String(over.id));

    if (!fromStage || !toStage) return;

    const isOverAColumn =
      typeof over.id === "string" && String(over.id).startsWith(columnIdPrefix);

    setIdsByStage((prev) => {
      if (fromStage === toStage) {
        const list = [...(prev[fromStage] ?? [])];
        const fromIndex = list.indexOf(String(active.id));
        if (fromIndex === -1) return prev;

        const rawToIndex = isOverAColumn
          ? list.length - 1
          : list.indexOf(String(over.id));

        const toIndex = Math.max(0, Math.min(list.length - 1, rawToIndex));
        return { ...prev, [fromStage]: arrayMove(list, fromIndex, toIndex) };
      } else {
        const fromList = [...(prev[fromStage] ?? [])];
        const toList = [...(prev[toStage] ?? [])];
        const fromIndex = fromList.indexOf(String(active.id));
        if (fromIndex === -1) return prev;

        fromList.splice(fromIndex, 1);

        const overIndex = isOverAColumn
          ? toList.length
          : toList.indexOf(String(over.id));
        const insertAt = overIndex < 0 ? toList.length : overIndex;

        toList.splice(insertAt, 0, String(active.id));

        return { ...prev, [fromStage]: fromList, [toStage]: toList };
      }
    });

    const journeysForDrag = viewMode === "kanban" ? kanbanJourneys : filteredJourneys;
    const updatedJourney = (journeysForDrag ?? []).find(
      (j) => j.id.toString() === String(active.id)
    );
    if (!updatedJourney) return;

    if (isLegacyData) {
      try {
        // Call the server to update the journey stage in the legacy database
        const response = await fetch(
          `http://localhost:8080/api/legacy/journeys/${updatedJourney.id}/stage`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ stage: toStage }),
          }
        );
        
        if (response.ok) {
          // Instead of updating local state immediately, refetch the data to ensure consistency
          // Add a small delay to ensure database has time to commit the change
          await new Promise(resolve => setTimeout(resolve, 100));
          const refetchSuccess = await refetchLegacyJourneys();
          if (!refetchSuccess) {
            // Fallback: update local state if refetch fails
            setLegacyJourneys((prev) =>
              (prev ?? []).map((j) =>
                j.id.toString() === String(active.id)
                  ? {
                      ...j,
                      stage: toStage as StageId,
                      updatedAt: new Date().toISOString(),
                    }
                  : j
              )
            );
          }
        } else {
          console.error("Failed to update journey stage on server:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating journey stage:", error);
      }
    } else {
      try {
        await put(`/journeys/${updatedJourney.id}`, { stage: toStage });
      } catch (error) {
        console.error("Failed to update journey stage:", error);
      }
    }
  };

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

  const tableColumns = [
    {
      key: "name",
      header: "Journey Name",
      render: (_: string, row: any) => (
        <Link
          to={`/sales/pipeline/${row.id}`}
          state={{ 
            journey: row,
            customer: customersById?.get(String(row.customerId))
          }}
          className="text-sm font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "customerId",
      header: "Company",
      render: (value: string, row: any) => {
        const customer = customersById.get(String(value));
        return (
          <div>
            <div className="text-sm text-neutral-400">
              {customer?.name ?? row.companyName ?? ""}
            </div>
            <div className="text-xs text-neutral-400">{row.contact}</div>
          </div>
        );
      }
    },
    {
      key: "stage",
      header: "Stage",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="text-sm text-neutral-400">{stageLabel(value)}</div>
        </div>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (value: number) => (
        <div className="text-sm font-medium text-neutral-400">
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      key: "confidence",
      header: "Confidence",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 h-1.5 w-16 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                (value ?? 0) >= 70
                  ? "bg-green-500"
                  : (value ?? 0) >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${(value ?? 0)}%` }}></div>
          </div>
          <span className="text-xs text-neutral-400">{value ?? 0}%</span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value: string) => (
        <StatusBadge label={value} variant={getPriorityConfig(value).style} />
      ),
    },
    {
      key: "updatedAt",
      header: "Last Activity",
      render: (value: string) => (
        <div className="text-sm text-neutral-400">{formatDate(value)}</div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <div className="text-right">
          <button className="text-neutral-400 hover:text-neutral-600">
            <MoreHorizontal size={16} />
          </button>
        </div>
      ),
    },
  ];

  const headerActions = [
    {
      type: "button" as const,
      label: "Card",
      variant: viewMode === "kanban" ? "secondary" : "secondary-outline",
      icon: <Layout size={16} />,
      onClick: () => setViewMode("kanban"),
    },
    {
      type: "button" as const,
      label: "List",
      variant: viewMode === "list" ? "secondary" : "secondary-outline",
      icon: <ListIcon size={16} />,
      onClick: () => setViewMode("list"),
    },
    {
      type: "button" as const,
      label: "Projections",
      variant: viewMode === "projections" ? "secondary" : "secondary-outline",
      icon: <BarChart3 size={16} />,
      onClick: () => setViewMode("projections"),
    },
    {
      type: "button" as const,
      label: "Export",
      variant: "secondary-outline" as const,
      icon: <Download size={16} />,
      
    },
    {
      type: "button" as const,
      label: "Add Journey",
      variant: "primary" as const,
      icon: <Plus size={16} />,
      onClick: () => {
        toggleJourneyModal();
      },
    },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={headerActions}
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
            employee={employee}
            setIsFilterModalOpen={setIsFilterModalOpen}
          />
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden">
              <div className="inline-flex gap-2 p-2 h-full">
                {STAGES.filter(s => visibleStageIds?.includes(s.id)).map((stage) => {
                  const { items, stageTotal, stageWeighted } = stageCalculations.get(stage.id) || { items: [], stageTotal: 0, stageWeighted: 0 };
                  return (
                    <DroppableColumn
                      key={stage.id}
                      id={`${columnIdPrefix}${stage.id}`}
                      className="w-[320px] min-w-[320px] bg-foreground rounded border border-border flex flex-col h-full"
                    >
                      <div className="p-2 pb-1 flex items-center justify-between flex-shrink-0">
                        <div className="text-sm font-semibold text-primary">{stage.label}</div>
                        <div className="text-xs text-neutral-400">
                          {items.length} Journeys
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-8">
                        <SortableContext
                          id={`${columnIdPrefix}${stage.id}`}
                          items={items}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.map((itemId) => {
                            const journey = kanbanJourneys.find((d) => d.id.toString() === itemId);
                            return journey ? (
                              <SortableItem
                                key={itemId}
                                journey={journey}
                                customersById={customersById}
                              />
                            ) : null;
                          })}
                        </SortableContext>
                      </div>
                      <div className="flex-shrink-0 p-2 pt-1 border-t border-border bg-background/50">
                        <div className="text-xs text-neutral-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium">{formatCurrency(stageTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Weighted ({Math.round(stage.weight * 100)}%):</span>
                            <span className="font-medium text-primary">{formatCurrency(stageWeighted)}</span>
                          </div>
                        </div>
                      </div>
                    </DroppableColumn>
                  );
                })}
              </div>
            </div>
            <DragOverlay>
              {activeId && (() => {
                const journey = kanbanJourneys.find((d) => d.id.toString() === activeId);
                return journey ? <DragPreview journey={journey} customersById={customersById} /> : null;
              })()}
            </DragOverlay>
          </DndContext>
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
            employee={employee}
            setIsFilterModalOpen={setIsFilterModalOpen}
          />
          <div ref={listContainerRef} className="flex-1 overflow-auto">
            <div className="flex flex-col h-full">
              <Table
                columns={tableColumns as any}
                data={listJourneys}
                total={filteredJourneys.length}
                className="bg-foreground rounded shadow-sm border flex-shrink-0"
              />
              {hasMoreJourneys && (
                <div className="p-4 bg-foreground flex justify-center flex-shrink-0">
                  <Button
                    variant="secondary-outline"
                    onClick={loadMoreJourneys}
                    disabled={isLoadingMore}
                    className="min-w-32"
                  >
                    {isLoadingMore 
                      ? "Loading..." 
                      : `Load ${Math.min(200, filteredJourneys.length - listBatchSize)} More (${filteredJourneys.length - listBatchSize} remaining)`
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>
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
          onSuccess={() => {}}
        />
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

const ProjectionsView = ({ journeys, customersById }: { journeys: any[], customersById: Map<string, any> }) => {
  const monthlyProjections = useMemo(() => {
    const monthMap = new Map<string, { journeys: any[], weightedValue: number, totalValue: number }>();
    
    journeys.forEach(journey => {
      const closeDate = new Date(journey.closeDate);
      const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = closeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      const stage = STAGES.find(s => s.id === journey.stage);
      const weight = stage?.weight ?? 0;
      const value = Number(journey.value ?? 0);
      const weightedValue = value * weight;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          journeys: [],
          weightedValue: 0,
          totalValue: 0
        });
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData.journeys.push({ ...journey, monthLabel });
      monthData.weightedValue += weightedValue;
      monthData.totalValue += value;
    });
    
    // Sort by month and convert to array
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, data]) => ({
        monthKey,
        monthLabel: data.journeys[0]?.monthLabel || monthKey,
        ...data,
        avgValuePerDeal: data.journeys.length > 0 ? data.totalValue / data.journeys.length : 0,
        avgDealAge: data.journeys.length > 0 ? (() => {
          const journeysWithDates = data.journeys.filter(j => j.CreateDT);
          if (journeysWithDates.length === 0) return 0;
          const totalAge = journeysWithDates.reduce((sum, j) => {
            const createdDate = new Date(j.CreateDT);
            const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0);
          return totalAge / journeysWithDates.length;
        })() : 0
      }));
  }, [journeys]);

  const totalWeightedProjection = monthlyProjections.reduce((sum, month) => sum + month.weightedValue, 0);
  const totalDeals = journeys.length;
  const avgValuePerDeal = totalDeals > 0 ? journeys.reduce((sum, j) => sum + Number(j.value ?? 0), 0) / totalDeals : 0;
  const avgDealAge = (() => {
    const journeysWithDates = journeys.filter(j => j.CreateDT);
    if (journeysWithDates.length === 0) return 0;
    const totalAge = journeysWithDates.reduce((sum, j) => {
      const createdDate = new Date(j.CreateDT);
      const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    return totalAge / journeysWithDates.length;
  })();

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
      {/* Summary Cards */}
      <div className="border-b px-6 py-4 bg-foreground">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Total Weighted Projection</div>
            <div className="text-2xl font-semibold text-primary">{formatCurrency(totalWeightedProjection)}</div>
          </div>
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Average Deal Value</div>
            <div className="text-2xl font-semibold text-neutral-400">{formatCurrency(avgValuePerDeal)}</div>
          </div>
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Average Deal Age</div>
            <div className="text-2xl font-semibold text-neutral-400">{Math.round(avgDealAge)} days</div>
          </div>
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Active Months</div>
            <div className="text-2xl font-semibold text-neutral-400">{monthlyProjections.length}</div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 min-h-0 overflow-auto bg-background">
        {/* Revenue Chart */}
        <div className="p-6">
          <div className="bg-foreground rounded border border-border p-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-400 mb-4">Revenue by Month</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyProjections.map(month => ({
                  month: month.monthLabel,
                  totalValue: month.totalValue,
                  weightedValue: month.weightedValue,
                  monthKey: month.monthKey
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      formatCurrency(value), 
                      props.dataKey === 'totalValue' ? 'Total Value' : 'Weighted Value'
                    ]}
                    labelStyle={{ color: '#9CA3AF' }}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="#9CA3AF" 
                    strokeWidth={2}
                    name="Total Value"
                    dot={{ fill: '#9CA3AF', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weightedValue" 
                    stroke="#EAB308" 
                    strokeWidth={2}
                    name="Weighted Value"
                    dot={{ fill: '#EAB308', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Projections Table */}
        <div className="px-6 pb-6">
        <div className="bg-foreground rounded border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background">
            <h3 className="text-lg font-semibold text-neutral-400">Monthly Projections</h3>
          </div>
          <div>
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Month</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Journeys</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Total Value</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Weighted Value</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Avg Value/Deal</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Avg Age (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyProjections.map((month) => (
                  <tr key={month.monthKey} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-400">{month.monthLabel}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {month.journeys.length}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-400">
                      {formatCurrency(month.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatCurrency(month.weightedValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {formatCurrency(month.avgValuePerDeal)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {Math.round(month.avgDealAge)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
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

const CreateJourneyModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = useState<string | { create: true; label: string }>("");
  const [startDate, setStartDate] = useState<string>("");
  const [journeyType, setJourneyType] = useState<string>("");
  const [rsm, setRsm] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
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
    const payload = {
      name,
      startDate,
      journeyType,
      rsm,
      contactName,
      city,
      state: stateProv,
      country,
      industry,
      leadSource,
      notes,
      actionDate,
      equipmentType,
    };

    console.log("Journey payload:", payload);

    const result = await post("/journeys", payload);

    if (result) {
      onSuccess?.();
      onClose();
    } else {
      console.error("Journey creation failed:", error);
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
              value={typeof name === "string" ? name : name.label}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Start Date</label>
            <input
              type="date"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              options={[
                { value: "reid_coe", label: "Reid Coe" },
                { value: "greg_p_isabel", label: "Greg P. Isabel" },
                { value: "john_m_kwiatkowski", label: "John M. Kwiatkowski" },
                { value: "kathryn_l_chun", label: "Kathryn L. Chun" },
                { value: "mark_a_versteegden", label: "Mark A. Versteegden" },
                { value: "noah_j_hellner", label: "Noah J. Hellner" },
                { value: "ryan_w_hardin", label: "Ryan W. Hardin" },
                { value: "roberto_r_aguilar", label: "Roberto R. Aguilar" },
                { value: "tyler_c_sloan", label: "Tyler C. Sloan" },
                { value: "tricia_a_thomas", label: "Tricia A. Thomas" },
                { value: "terry_l_sawyer", label: "Terry L. Sawyer" },
                { value: "tom_w_brockie", label: "Tom W. Brockie" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Contact Name"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="Enter primary contact name"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
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
                { value: "appliances", label: "Appliances" },
                { value: "auto_oem", label: "Auto OEM" },
                { value: "auto_tier_1_2", label: "Auto Tier 1 & 2" },
                { value: "construction", label: "Construction" },
                { value: "contract_fabricating", label: "Contract Fabricating" },
                { value: "contract_rollforming", label: "Contract Rollforming" },
                { value: "contract_stamping", label: "Contract Stamping" },
                { value: "electrical_components_lighting", label: "Electrical Components / Lighting" },
                { value: "energy_motors_transformers", label: "Energy / Motors / Transformers" },
                { value: "furniture_components", label: "Furniture & Components" },
                { value: "hvac_air_handling", label: "HVAC / Air Handling" },
                { value: "integrator", label: "Integrator" },
                { value: "lawn_equipment", label: "Lawn Equipment" },
                { value: "mobile_heavy_equipment_locomotive", label: "Mobile Heavy Equipment / Locomotive" },
                { value: "marine", label: "Marine" },
                { value: "medical", label: "Medical" },
                { value: "military_defense", label: "Military / Defense" },
                { value: "packaging", label: "Packaging" },
                { value: "press_oem", label: "Press OEM" },
                { value: "rv_trailers", label: "RV / Trailers" },
                { value: "storage_lockers_hardware", label: "Storage / Lockers / Hardware" },
                { value: "other", label: "Other" },
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
            <input
              type="date"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
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
              disabled={!name || loading}
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

export default Pipeline;