import { Plus, Filter, Download, ChevronDown } from "lucide-react";
import { useMemo, useState, useRef } from "react";
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
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";
import { useCreateQuote } from "@/hooks/sales/use-create-quote";
import useGetCompanies from "@/hooks/sales/use-get-companies";
import useGetJourneys from "@/hooks/sales/use-get-journeys";
import AdvancedDropdown from "@/components/common/advanced-dropdown";

function isCreateValue(val: unknown): val is { create: true; label: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "create" in val &&
    (val as any).create === true &&
    "label" in val
  );
}

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedJourney, setSelectedJourney] = useState<string>("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newJourneyName, setNewJourneyName] = useState("");
  const customerRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);

  const include = useMemo(() => ["journey", "journey.customer"], []);

  const { quotes, loading, error, refresh, pagination } = useGetQuotes({
    include,
  });
  const {
    createQuote,
    loading: createLoading,
    error: createError,
  } = useCreateQuote();

  const { companies } = useGetCompanies();
  const { journeys } = useGetJourneys();

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
            className="text-primary hover:underline">
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
            className="text-primary hover:underline">
            {row.journey.customer.name || "-"}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      key: "createdById",
      header: "Created By",
      render: (value) => value,
    },
  ];

  const [customerValue, setCustomerValue] = useState<
    string | { create: true; label: string }
  >("");
  const [journeyValue, setJourneyValue] = useState<
    string | { create: true; label: string }
  >("");

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setCustomerValue("");
      setJourneyValue("");
      setSelectedCustomer("");
      setSelectedJourney("");
      setNewCustomerName("");
      setNewJourneyName("");
    }
  };

  const handleCreateQuote = async () => {
    let params: Record<string, string> = {};
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
      toggleModal();
      refresh();
    }
  };

  const customerOptions = useMemo(
    () =>
      companies?.map((company) => ({
        value: company.id,
        label: company.name,
      })) || [],
    [companies]
  );

  const journeyOptions = useMemo(
    () =>
      journeys
        ?.filter((journey) =>
          typeof customerValue === "string" && customerValue
            ? journey.customerId === customerValue
            : false
        )
        ?.map((journey) => ({
          value: journey.id,
          label: journey.name || `Journey ${journey.id.slice(-8)}`,
        })) || [],
    [journeys, customerValue]
  );

  const pageTitle = "Quotes";
  const pageDescription = `${quotes?.length} total quotes`;

  const isCreateDisabled = () => {
    if (createLoading) return true;

    // If creating new customer, MUST also create new journey
    if (
      customerValue &&
      typeof customerValue === "object" &&
      customerValue.create
    ) {
      return (
        !customerValue.label.trim() ||
        !(
          journeyValue &&
          typeof journeyValue === "object" &&
          journeyValue.label.trim()
        )
      );
    }

    // If customer selected but no journey selected (or being created)
    if (
      typeof customerValue === "string" &&
      customerValue &&
      (!journeyValue ||
        (typeof journeyValue === "object" && !journeyValue.label.trim()))
    )
      return true;

    return false;
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "Export",
            icon: <Download size={16} />,
            variant: "secondary-outline",
            onClick: () => {},
          },
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

      <Modal
        isOpen={isModalOpen}
        onClose={toggleModal}
        title="Create New Quote"
        size="xs">
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Customer</label>
            <AdvancedDropdown
              ref={customerRef}
              options={customerOptions}
              value={customerValue}
              onChange={(val) => {
                setCustomerValue(val);
                setJourneyValue("");
                if (typeof val === "object" && val.create) {
                  // New customer: force new journey
                  setSelectedCustomer("");
                  setJourneyValue({ create: true, label: "" });
                } else if (typeof val === "string") {
                  setSelectedCustomer(val);
                }
              }}
              placeholder="Select a customer (optional)"
              createPlaceholder="Enter customer name"
            />
          </div>

          {/* Journey Selection */}
          {(customerValue || isCreateValue(customerValue)) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Journey</label>
              <AdvancedDropdown
                ref={journeyRef}
                options={journeyOptions}
                value={journeyValue}
                onChange={(val) => {
                  // If exiting create mode for journey, also clear customer if it was new
                  if (
                    typeof val === "string" ||
                    (typeof val === "object" && !val.create)
                  ) {
                    if (
                      typeof customerValue === "object" &&
                      customerValue.create
                    ) {
                      setCustomerValue("");
                    }
                  }
                  setJourneyValue(val);
                }}
                placeholder={
                  typeof customerValue === "object" && customerValue.create
                    ? "Enter journey name"
                    : !customerValue
                    ? "Select a customer first"
                    : "Select a journey"
                }
                createPlaceholder="Enter journey name"
                disabled={!customerValue}
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
                  (journeyValue as { create: true; label: string }).create &&
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
            disabled={isCreateDisabled()}
            variant="primary"
            className="w-full">
            {createLoading ? "Creating..." : "Create Quote"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Quotes;
