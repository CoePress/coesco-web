import { Plus, Filter, ChevronDown } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

import {
  Button,
  Modal,
  PageHeader,
  PageSearch,
  StatusBadge,
  Table,
} from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/common/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { useCreateEntity } from "@/hooks/_base/use-create-entity";
import AdvancedDropdown from "@/components/common/advanced-dropdown";

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [_, setPage] = useState(1);

  const include = useMemo(
    () => ["journey", "journey.customer", "createdBy"],
    []
  );

  const {
    entities: quotes,
    refresh,
    pagination,
  } = useGetEntities("/quotes", {
    include,
  });
  const { createEntity: createQuote, loading: createLoading } =
    useCreateEntity("/quotes");

  const columns: TableColumn<any>[] = [
    {
      key: "quoteNumber",
      header: "Quote Number",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/quotes/${row.id}`}>{row.number}</Link>
      ),
    },
    {
      key: "revision",
      header: "Revision",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge label={value as string} />,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (value) => formatCurrency(value as number),
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
      key: "createdBy.name",
      header: "Created By",
      render: (_, row) =>
        row.createdBy ? (
          <Link
            to={`/sales/team/${row.createdBy.id}?tab=quotes`}
            className="hover:underline">
            {`${row.createdBy.firstName} ${row.createdBy.lastName}`}
          </Link>
        ) : (
          "-"
        ),
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const pageTitle = "Quotes";
  const pageDescription = `${quotes?.length} total quotes`;

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "New Quote",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: toggleModal,
          },
        ]}
      />

      <PageSearch
        placeholder="Search quotes..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
        label="Quotes"
        labelTrigger={false}
      />

      <Table
        columns={columns}
        data={quotes || []}
        total={quotes?.length || 0}
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
      />

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

// Create Quote Modal Component
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

  // Only load data when modal is open
  const { entities: companies, refresh: refreshCompanies } =
    useGetEntities("/companies");
  const { entities: journeys, refresh: refreshJourneys } =
    useGetEntities("/journeys");

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
      size="sm">
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

      {/* Info Text */}
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

      {/* Create Button */}
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
