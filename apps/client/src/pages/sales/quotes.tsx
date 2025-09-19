import { DollarSignIcon, FileTextIcon, PlusCircleIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

import { AdvancedDropdown, Button, Modal, StatusBadge, Table, Toolbar } from "@/components";
import { formatCurrency, formatQuoteNumber } from "@/utils";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import PageHeader from "@/components/layout/page-header";
import { Filter } from "@/components/feature/toolbar";
import Metrics, { MetricsCard } from "@/components/ui/metrics";
import { format } from "date-fns";

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt" | "year">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({ page: 1, totalPages: 1, total: 0, limit: 25 });
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  
  const { get, post } = useApi<IApiResponse<any[]>>();

  const include = useMemo(
    () => [],
    []
  );

  const filter = useMemo(() => JSON.stringify({
    status: "OPEN",
  }), []);


  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    const response = await get("/quotes", {
      include,
      filter,
      sort,
      order,
      page,
      limit,
    });
    
    if (response?.success) {
      setQuotes(response.data || []);
      if (response.meta) {
        setPagination({
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
          page: response.meta.page || 1,
          limit: response.meta.limit || 25,
        });
      }
    } else {
      setError(response?.error || "Failed to fetch quotes");
    }
    setLoading(false);
  };
  
  const refresh = () => {
    fetchQuotes();
  };
  
  const createQuote = async (params: any) => {
    setCreateLoading(true);
    const response = await post("/quotes", params);
    setCreateLoading(false);
    return response?.success ? response.data : null;
  };
  
  useEffect(() => {
    fetchQuotes();
  }, [include, filter, sort, order, page, limit]);

  const columns: TableColumn<any>[] = [
    {
      key: "quoteNumber",
      header: "Quote Number",
      className: "text-primary hover:underline w-1",
      render: (_, row) => (
        <Link to={`/sales/quotes/${row.id}`}>{formatQuoteNumber(row.year, row.number)}</Link>
      ),
    },
    {
      key: "revision",
      header: "Revision",
      className: "w-1 text-center",
    },
    {
      key: "journey.customer.name",
      header: "Customer",
      render: (_, row) =>
      row.journey?.customer ? (
        <Link
          to={`/sales/companies/${row.journey.customer.id}`}
          className="hover:underline">
          {row.journey.customer.name || "-"}
        </Link>
      ) : (
        "-"
      ),
    },
    {
      key: "journey.name",
      header: "Journey",
      render: (_, row) =>
      row.journey ? (
        <Link
          to={`/sales/journeys/${row.journey.id}`}
          className="hover:underline">
          {row.journey.name || "-"}
        </Link>
      ) : (
        "-"
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-1",
      render: (_, row) => (
         <div className="flex gap-2 whitespace-nowrap"><StatusBadge label={row.status as string} /><StatusBadge label={row.revisionStatus as string} /></div>
       )
    },
    {
      key: "priority",
      header: "Priority",
      className: "w-1 text-center",
    },
    {
      key: "confidence",
      header: "Confidence",
      className: "w-1 text-center",
    },
    {
      key: "createdAt",
      header: "Created On",
      className: "w-1",
      render: (_, row) => {
        return format(row.createdAt as string, "MM/dd/yyyy");
      },
    }
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const kpis = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(92000, false),
      description: "Total revenue this month",
      icon: <DollarSignIcon size={16} />,
      change: 12.5,
    },
    {
      title: "Total Quotes",
      value: "118",
      description: "Active quotes this month",
      icon: <FileTextIcon size={16} />,
      change: 8.2,
    },
    {
      title: "Conversion Rate",
      value: "78%",
      description: "Quote to deal conversion",
      icon: <TrendingUpIcon size={16} />,
      change: -2.1,
    },
    {
      title: "Active Deals",
      value: "47",
      description: "Deals in pipeline",
      icon: <UsersIcon size={16} />,
      change: 5.3,
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={toggleModal}>
          <PlusCircleIcon size={20} /> Create New
        </Button>
      </div>
    );
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExport = () => {
    console.log('Exporting quotes...', filteredQuotes)
    // TODO: Implement actual export functionality
  }

  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'expired', label: 'Expired' }
      ],
      placeholder: 'Filter by status'
    },
    {
      key: 'revision',
      label: 'Revision',
      options: [
        { value: '', label: 'All Revisions' },
        { value: '0', label: 'Original' },
        { value: '1', label: 'Revision 1' },
        { value: '2', label: 'Revision 2' },
        { value: '3+', label: '3+' }
      ],
      placeholder: 'Filter by revision'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      options: [
        { value: '', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'last30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'thisQuarter', label: 'This Quarter' },
        { value: 'thisYear', label: 'This Year' }
      ],
      placeholder: 'Filter by date'
    }
  ]

  const filteredQuotes = useMemo(() => {
    return quotes || []
  }, [quotes])

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Quotes"
        description="Manage and track sales quotes"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Metrics>
          {kpis.map((metric) => (
            <MetricsCard {...metric} />
          ))}
        </Metrics>

        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search quotes..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          showExport={true}
          onExport={handleExport}
        />

        <div className="flex-1 overflow-hidden">
          <Table
            columns={columns}
            data={filteredQuotes}
            total={pagination.total}
            idField="id"
            pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            sort={sort}
            order={order}
            onSortChange={(newSort, newOrder) => {
              setSort(newSort as "createdAt" | "updatedAt");
              setOrder(newOrder as "asc" | "desc");
            }}
            className="rounded border overflow-clip"
            loading={loading}
            emptyMessage="No quotes found"
          />
        </div>
      </div>

      {isModalOpen && (
        <CreateQuoteModal
          isOpen={isModalOpen}
          onClose={toggleModal}
          onSuccess={refresh}
          createQuote={createQuote}
          loading={createLoading}
        />
      )}
    </div>
  );
};

const CreateQuoteModal = ({
  isOpen,
  onClose,
  onSuccess,
  createQuote,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createQuote: (params: any) => Promise<any>;
  loading: boolean;
}) => {
  const [customerValue, setCustomerValue] = useState<
    string | { create: true; label: string }
  >("");
  const [journeyValue, setJourneyValue] = useState<
    string | { create: true; label: string }
  >("");
  const [customerMode, setCustomerMode] = useState<"select" | "create">(
    "select"
  );
  const [journeyMode, setJourneyMode] = useState<"select" | "create">("select");
  const [isCreateDisabledState, setIsCreateDisabledState] = useState(true);

  const customerRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);

  const [companies, setCompanies] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const { get: getCompanies } = useApi<IApiResponse<any[]>>();
  const { get: getJourneys } = useApi<IApiResponse<any[]>>();
  
  const fetchCompanies = async () => {
    const response = await getCompanies("/crm/companies");
    if (response?.success) {
      setCompanies(response.data || []);
    }
  };
  
  const fetchJourneys = async () => {
    const response = await getJourneys("/crm/journeys");
    if (response?.success) {
      setJourneys(response.data || []);
    }
  };
  
  const refreshCompanies = () => {
    fetchCompanies();
  };
  
  const refreshJourneys = () => {
    fetchJourneys();
  };
  
  useEffect(() => {
    fetchCompanies();
    fetchJourneys();
  }, []);

  const customerOptions = useMemo(
    () =>
      companies?.map((company: any) => ({
        value: company.id,
        label: company.name,
      })) || [],
    [companies]
  );

  const journeyOptions = useMemo(
    () =>
      journeys
        ?.filter((journey: any) =>
          typeof customerValue === "string" && customerValue
            ? journey.customerId === customerValue
            : false
        )
        ?.map((journey: any) => ({
          value: journey.id,
          label: journey.name || `Journey ${journey.id.slice(-8)}`,
        })) || [],
    [journeys, customerValue]
  );

  useEffect(() => {
    if (customerValue && typeof customerValue === "string") {
      setCustomerMode("select");
    } else if (
      customerValue &&
      typeof customerValue === "object" &&
      customerValue.create
    ) {
      setCustomerMode("create");
    }
  }, [customerValue]);

  useEffect(() => {
    const checkDisabled = () => {
      if (loading) return true;

      if (typeof customerValue === "object" && customerValue.create) {
        const customerLabel = customerValue.label?.trim();
        const journeyLabel =
          typeof journeyValue === "object"
            ? journeyValue.label?.trim()
            : typeof journeyValue === "string"
              ? journeyValue.trim()
              : "";
        return !customerLabel || !journeyLabel;
      }

      if (typeof customerValue === "string" && customerValue) {
        if (!journeyValue) return true;
        if (typeof journeyValue === "string") return !journeyValue.trim();
        if (typeof journeyValue === "object")
          return !journeyValue.label?.trim();
      }

      return false;
    };

    setIsCreateDisabledState(checkDisabled());
  }, [customerValue, journeyValue, loading]);

  const handleCreateQuote = async () => {
    let params: any = {};
    if (
      customerValue &&
      typeof customerValue === "object" &&
      customerValue.create
    ) {
      params.customerName = customerValue.label.trim();
      if (
        journeyValue &&
        typeof journeyValue === "object" &&
        journeyValue.create
      ) {
        params.journeyName = journeyValue.label.trim();
      }
    } else if (typeof customerValue === "string" && customerValue) {
      params.customerId = customerValue;
      if (
        journeyValue &&
        typeof journeyValue === "object" &&
        journeyValue.create
      ) {
        params.journeyName = journeyValue.label.trim();
      } else if (typeof journeyValue === "string" && journeyValue) {
        params.journeyId = journeyValue;
      }
    }
    const result = await createQuote(params);
    if (result) {
      onClose();
      onSuccess();
      refreshCompanies();
      refreshJourneys();
    }
  };

  const isJourneyHidden = () => {
    if (customerMode === "create") return false;
    if (customerValue && typeof customerValue === "string") return false;
    return true;
  };

  const resetForm = () => {
    setCustomerValue("");
    setJourneyValue("");
    setCustomerMode("select");
    setJourneyMode("select");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Quote"
      size="xs"
      overflow="visible">
      {/* Customer Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Customer</label>
        <AdvancedDropdown
          ref={customerRef}
          options={customerOptions}
          value={customerValue}
          mode={customerMode}
          onChange={(val) => {
            if (typeof val === "object") {
              setCustomerValue(val);
              setCustomerMode("create");
              if (journeyMode !== "create") {
                setJourneyValue({ create: true, label: "" });
                setJourneyMode("create");
              }
            } else if (typeof val === "string" && val) {
              setCustomerValue(val);
              setCustomerMode("select");
              setJourneyValue("");
              setJourneyMode("select");
            } else {
              setCustomerValue("");
              setCustomerMode("select");
              setJourneyValue("");
              setJourneyMode("select");
            }
          }}
          placeholder="Select a customer (optional)"
          createPlaceholder="Enter customer name"
        />
      </div>

      {/* Journey Selection */}
      {!isJourneyHidden() && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Journey</label>
          <AdvancedDropdown
            ref={journeyRef}
            options={journeyOptions}
            value={journeyValue}
            mode={journeyMode}
            onChange={(val) => {
              if (!val) {
                setJourneyValue("");
                setJourneyMode("select");
                setCustomerMode("select");
              } else if (typeof val === "object") {
                setJourneyValue(val);
                setJourneyMode("create");
              } else if (typeof val === "string") {
                setJourneyValue(val);
                setJourneyMode("select");
              }
            }}
            placeholder={
              journeyMode === "create"
                ? "Enter journey name"
                : !customerValue
                  ? "Select a customer first"
                  : "Select a journey"
            }
            createPlaceholder="Enter journey name"
            disabled={!customerValue && customerMode !== "create"}
          />
        </div>
      )}

      <div className="text-xs text-text-muted bg-surface p-3 rounded">
        {(!customerValue || customerValue === "") &&
          (!journeyValue || journeyValue === "") &&
          "Create a standalone draft quote that can be attached to a customer later."}
        {customerValue &&
          typeof customerValue === "object" &&
          (customerValue as { create: true; label: string }).create &&
          (!journeyValue ||
            (typeof journeyValue === "object" &&
              !(
                journeyValue as { create: true; label: string }
              ).label.trim())) &&
          "Creating a new customer requires creating a new journey as well."}
        {customerValue &&
          typeof customerValue === "object" &&
          (customerValue as { create: true; label: string }).create &&
          journeyValue &&
          typeof journeyValue === "object" &&
          (journeyValue as { create: true; label: string }).create &&
          (journeyValue as { create: true; label: string }).label.trim() &&
          "Quote will be created with the new customer and new journey."}
        {typeof customerValue === "string" &&
          customerValue &&
          (!journeyValue ||
            (typeof journeyValue === "object" &&
              !(
                journeyValue as { create: true; label: string }
              ).label.trim())) &&
          "You must select or create a journey to proceed with this customer."}
        {typeof customerValue === "string" &&
          customerValue &&
          ((typeof journeyValue === "string" && journeyValue) ||
            (typeof journeyValue === "object" &&
              (journeyValue as { create: true; label: string }).create &&
              (
                journeyValue as { create: true; label: string }
              ).label.trim())) &&
          "Quote will be created as part of the selected journey."}
      </div>

      <Button
        onClick={handleCreateQuote}
        disabled={isCreateDisabledState}
        variant="primary"
        className="w-full">
        {loading ? "Creating..." : "Create Quote"}
      </Button>
    </Modal>
  );
};

export default Quotes;
