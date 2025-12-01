import { QuoteRevisionStatus, QuoteStatus } from "@coesco/types";
import { format } from "date-fns";
import { PlusCircleIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { Filter } from "@/components/feature/toolbar";
import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import { AdvancedDropdown, Button, Modal, StatusBadge, Table, Toolbar } from "@/components";
import PageHeader from "@/components/layout/page-header";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatQuoteNumber } from "@/utils";

function Quotes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { get: getQuotes, response: quotes, loading: quotesLoading, error: quotesError } = useApi<IApiResponse<any[]>>();
  const { post: createQuote, loading: createQuoteLoading, error: createQuoteError } = useApi<IApiResponse<any[]>>();
  const { get: getEmployees, response: employees } = useApi<IApiResponse<any[]>>();
  // const { get: getMetrics, response: metrics, loading: metricsLoading } = useApi<IApiResponse<any>>();

  const [params, setParams] = useState({
    sort: "createdAt" as "createdAt" | "updatedAt" | "year" | "quoteNumber" | "latestRevision" | "latestRevisionStatus",
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: { status: "OPEN" },
    include: [] as string[],
    search: "",
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    const activeFilters = Object.fromEntries(
      Object.entries(params.filter).filter(([_, value]) => value),
    );

    if (Object.keys(activeFilters).length > 0) {
      q.filter = JSON.stringify(activeFilters);
    }

    if (params.include.length > 0) {
      q.include = JSON.stringify(params.include);
    }

    if (params.search) {
      q.search = params.search;
    }

    return q;
  }, [params]);

  const fetchQuotes = async () => {
    await getQuotes("/sales/quotes", queryParams);
  };

  const fetchEmployees = async () => {
    await getEmployees("/admin/employees");
  };

  // const fetchMetrics = async () => {
  //   await getMetrics("/quotes/metrics");
  // };

  const refresh = () => {
    fetchQuotes();
    // fetchMetrics();
  };

  useEffect(() => {
    fetchQuotes();
    // fetchMetrics();
  }, [params]);

  useEffect(() => {
    fetchEmployees();
  }, []);

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
      key: "latestRevision",
      header: "Revision",
      className: "w-1 text-center",
      render: (_, row) => row.latestRevision,
    },
    {
      key: "journey.customer.name",
      header: "Customer",
      render: (_, row) =>
        row.journey?.customer
          ? (
              <Link
                to={`/sales/companies/${row.journey.customer.id}`}
                className="hover:underline"
              >
                {row.journey.customer.name || "-"}
              </Link>
            )
          : (
              "-"
            ),
    },
    {
      key: "journey.name",
      header: "Journey",
      render: (_, row) =>
        row.journey
          ? (
              <Link
                to={`/sales/journeys/${row.journey.id}`}
                className="hover:underline"
              >
                {row.journey.name || "-"}
              </Link>
            )
          : (
              "-"
            ),
    },
    {
      key: "latestRevisionStatus",
      header: "Status",
      className: "w-1",
      render: (_, row) => (
        <div className="flex gap-2 whitespace-nowrap">
          <StatusBadge label={row.status as string} />
          <StatusBadge label={row.revisionStatus as string} />
        </div>
      ),
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
      key: "totalAmount",
      header: "Value",
      className: "w-1 text-right",
      render: (_, row) => formatCurrency(row.totalAmount || 0, false),
    },
    {
      key: "createdAt",
      header: "Created On",
      className: "w-1",
      render: (_, row) => {
        return format(row.createdAt as string, "MM/dd/yyyy");
      },
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // const kpis = useMemo(() => {
  //   const metricsData = metrics?.data;

  //   return [
  //     {
  //       title: "Total Quote Value",
  //       value: metricsLoading ? "-" : formatCurrency(metricsData?.totalQuoteValue || 0, false),
  //       description: "Total value of open quotes",
  //       icon: <DollarSignIcon size={16} />,
  //     },
  //     {
  //       title: "Total Quotes",
  //       value: metricsLoading ? "-" : (metricsData?.totalQuoteCount || 0).toString(),
  //       description: "Open quotes",
  //       icon: <FileTextIcon size={16} />,
  //     },
  //     {
  //       title: "Average Quote Value",
  //       value: metricsLoading ? "-" : formatCurrency(metricsData?.averageQuoteValue || 0, false),
  //       description: "Average value per quote",
  //       icon: <TrendingUpIcon size={16} />,
  //     },
  //     {
  //       title: "Approved Quotes",
  //       value: metricsLoading ? "-" : (metricsData?.quotesByStatus?.APPROVED || 0).toString(),
  //       description: "Quotes approved",
  //       icon: <UsersIcon size={16} />,
  //     },
  //   ];
  // }, [metrics, metricsLoading]);

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={toggleModal}>
          <PlusCircleIcon size={20} />
          {" "}
          Create New
        </Button>
      </div>
    );
  };

  const handleSearch = (query: string) => {
    handleParamsChange({
      search: query,
      page: 1,
    });
  };

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    handleParamsChange({
      filter: { ...params.filter, [key]: value },
    });
  };

  const quoteRevisionStatuses = Object.keys(QuoteRevisionStatus);
  const quoteRevisionStatusOptions = quoteRevisionStatuses.map((status) => { return { value: status, label: status }; });
  const quoteStatuses = Object.keys(QuoteStatus);
  const quoteStatusOptions = quoteStatuses.map((status) => { return { value: status, label: status }; });

  const employeeOptions = useMemo(
    () =>
      employees?.data?.map((employee: any) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })) || [],
    [employees],
  );

  const filters: Filter[] = [
    {
      key: "status",
      label: "Quote Status",
      options: [
        { value: "", label: "All" },
        ...quoteStatusOptions,
      ],
      placeholder: "Quote Status",
    },
    {
      key: "latestRevisionStatus",
      label: "Rev. Status",
      options: [
        { value: "", label: "All" },
        ...quoteRevisionStatusOptions,
      ],
      placeholder: "Revision Status",
    },
    {
      key: "createdById",
      label: "Created By",
      options: [
        { value: "", label: "All" },
        ...employeeOptions,
      ],
      placeholder: "Created By",
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Quotes"
        description="Manage and track sales quotes"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        {/* <Metrics>
          {kpis.map((metric) => (
            <MetricsCard {...metric} />
          ))}
        </Metrics> */}

        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search quotes..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
        />

        <div className="flex-1 overflow-hidden">
          <Table
            columns={columns}
            data={quotes?.data || []}
            total={quotes?.meta?.total || 0}
            idField="id"
            pagination
            loading={quotesLoading}
            error={quotesError}
            currentPage={quotes?.meta?.page}
            totalPages={quotes?.meta?.totalPages}
            onPageChange={page => handleParamsChange({ page })}
            sort={params.sort}
            order={params.order}
            onSortChange={(newSort, newOrder) => {
              handleParamsChange({
                sort: newSort as any,
                order: newOrder as any,
              });
            }}
            className="rounded border overflow-clip"
            emptyMessage="No quotes found"
          />
        </div>
      </div>

      {isModalOpen && (
        <CreateQuoteModal
          isOpen={isModalOpen}
          onClose={toggleModal}
          onSuccess={refresh}
          createQuote={data => createQuote("/sales/quotes", data)}
          loading={createQuoteLoading}
          error={createQuoteError}
        />
      )}
    </div>
  );
}

function CreateQuoteModal({
  isOpen,
  onClose,
  onSuccess,
  createQuote,
  loading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createQuote: (params: any) => Promise<any>;
  loading: boolean;
  error: string | null;
}) {
  const [customerValue, setCustomerValue] = useState<
    string | { create: true; label: string }
  >("");
  const [journeyValue, setJourneyValue] = useState<
    string | { create: true; label: string }
  >("");
  const [customerMode, setCustomerMode] = useState<"select" | "create">(
    "select",
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
    const response = await getCompanies("/sales/companies");
    if (response?.success) {
      setCompanies(response.data || []);
    }
  };

  const fetchJourneys = async () => {
    const response = await getJourneys("/sales/journeys");
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
    [companies],
  );

  const journeyOptions = useMemo(
    () =>
      journeys
        ?.filter((journey: any) =>
          typeof customerValue === "string" && customerValue
            ? journey.customerId === customerValue
            : false,
        )
        ?.map((journey: any) => ({
          value: journey.id,
          label: journey.name || `Journey ${journey.id.slice(-8)}`,
        })) || [],
    [journeys, customerValue],
  );

  useEffect(() => {
    if (customerValue && typeof customerValue === "string") {
      setCustomerMode("select");
    }
    else if (
      customerValue
      && typeof customerValue === "object"
      && customerValue.create
    ) {
      setCustomerMode("create");
    }
  }, [customerValue]);

  useEffect(() => {
    const checkDisabled = () => {
      if (loading)
        return true;

      if (typeof customerValue === "object" && customerValue.create) {
        const customerLabel = customerValue.label?.trim();
        const journeyLabel
          = typeof journeyValue === "object"
            ? journeyValue.label?.trim()
            : typeof journeyValue === "string"
              ? journeyValue.trim()
              : "";
        return !customerLabel || !journeyLabel;
      }

      if (typeof customerValue === "string" && customerValue) {
        if (!journeyValue)
          return true;
        if (typeof journeyValue === "string")
          return !journeyValue.trim();
        if (typeof journeyValue === "object")
          return !journeyValue.label?.trim();
      }

      return false;
    };

    setIsCreateDisabledState(checkDisabled());
  }, [customerValue, journeyValue, loading]);

  const handleCreateQuote = async () => {
    const params: any = {};
    if (
      customerValue
      && typeof customerValue === "object"
      && customerValue.create
    ) {
      params.customerName = customerValue.label.trim();
      if (
        journeyValue
        && typeof journeyValue === "object"
        && journeyValue.create
      ) {
        params.journeyName = journeyValue.label.trim();
      }
    }
    else if (typeof customerValue === "string" && customerValue) {
      params.customerId = customerValue;
      if (
        journeyValue
        && typeof journeyValue === "object"
        && journeyValue.create
      ) {
        params.journeyName = journeyValue.label.trim();
      }
      else if (typeof journeyValue === "string" && journeyValue) {
        params.journeyId = journeyValue;
      }
    }
    const result = await createQuote(params);
    if (result?.success) {
      onClose();
      onSuccess();
      refreshCompanies();
      refreshJourneys();
    }
  };

  const isJourneyHidden = () => {
    if (customerMode === "create")
      return false;
    if (customerValue && typeof customerValue === "string")
      return false;
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
      overflow="visible"
    >
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
            }
            else if (typeof val === "string" && val) {
              setCustomerValue(val);
              setCustomerMode("select");
              setJourneyValue("");
              setJourneyMode("select");
            }
            else {
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
              }
              else if (typeof val === "object") {
                setJourneyValue(val);
                setJourneyMode("create");
              }
              else if (typeof val === "string") {
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
        {(!customerValue || customerValue === "")
          && (!journeyValue || journeyValue === "")
          && "Create a standalone draft quote that can be attached to a customer later."}
        {customerValue
          && typeof customerValue === "object"
          && (customerValue as { create: true; label: string }).create
          && (!journeyValue
            || (typeof journeyValue === "object"
              && !(
                journeyValue as { create: true; label: string }
              ).label.trim()))
              && "Creating a new customer requires creating a new journey as well."}
        {customerValue
          && typeof customerValue === "object"
          && (customerValue as { create: true; label: string }).create
          && journeyValue
          && typeof journeyValue === "object"
          && (journeyValue as { create: true; label: string }).create
          && (journeyValue as { create: true; label: string }).label.trim()
          && "Quote will be created with the new customer and new journey."}
        {typeof customerValue === "string"
          && customerValue
          && (!journeyValue
            || (typeof journeyValue === "object"
              && !(
                journeyValue as { create: true; label: string }
              ).label.trim()))
              && "You must select or create a journey to proceed with this customer."}
        {typeof customerValue === "string"
          && customerValue
          && ((typeof journeyValue === "string" && journeyValue)
            || (typeof journeyValue === "object"
              && (journeyValue as { create: true; label: string }).create
              && (
                journeyValue as { create: true; label: string }
              ).label.trim()))
              && "Quote will be created as part of the selected journey."}
      </div>

      {error && (
        <div className="text-xs text-error bg-error/10 p-3 rounded">
          {error}
        </div>
      )}

      <Button
        onClick={handleCreateQuote}
        disabled={isCreateDisabledState}
        variant="primary"
        className="w-full"
      >
        {loading ? "Creating..." : "Create Quote"}
      </Button>
    </Modal>
  );
}

export default Quotes;
