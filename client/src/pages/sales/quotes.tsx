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

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedJourney, setSelectedJourney] = useState<string>("");
  const [showNewCustomerInput, setShowNewCustomerInput] = useState(false);
  const [showNewJourneyInput, setShowNewJourneyInput] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newJourneyName, setNewJourneyName] = useState("");
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);

  // Add state to track if we're in create mode
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCreatingJourney, setIsCreatingJourney] = useState(false);

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
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/journeys/${row.journey.id}`}>
          {row.journey.name || "-"}
        </Link>
      ),
    },
    {
      key: "journey.customer.name",
      header: "Customer",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.journey.customer.id}`}>
          {row.journey.customer.name || "-"}
        </Link>
      ),
    },
    {
      key: "createdById",
      header: "Created By",
      render: (value) => value,
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setSelectedCustomer("");
      setSelectedJourney("");
      setShowNewCustomerInput(false);
      setShowNewJourneyInput(false);
      setNewCustomerName("");
      setNewJourneyName("");
    }
  };

  const handleCreateQuote = async () => {
    if (
      !selectedCustomer &&
      !selectedJourney &&
      !showNewCustomerInput &&
      !showNewJourneyInput
    ) {
      // Create standalone draft quote
      const result = await createQuote();
      if (result) {
        toggleModal();
        refresh();
      }
    } else if (
      (selectedCustomer || showNewCustomerInput) &&
      (selectedJourney || showNewJourneyInput)
    ) {
      // Create quote attached to journey (existing or new)
      const params: Record<string, string> = {};

      if (selectedCustomer) params.customerId = selectedCustomer;
      if (selectedJourney) params.journeyId = selectedJourney;
      if (showNewCustomerInput && newCustomerName)
        params.customerName = newCustomerName;
      if (showNewJourneyInput && newJourneyName)
        params.journeyName = newJourneyName;

      const result = await createQuote(params);
      if (result) {
        toggleModal();
        refresh();
      }
    }
  };

  const handleCreateNewCustomer = () => {
    if (showNewCustomerInput) {
      // Cancel - hide input
      setShowNewCustomerInput(false);
      setNewCustomerName("");
      setShowNewJourneyInput(false);
      setNewJourneyName("");
    } else {
      // Show input
      setShowNewCustomerInput(true);
      setSelectedCustomer("");
      setShowNewJourneyInput(true);
      // Focus customer input after state updates
      setTimeout(() => customerInputRef.current?.focus(), 0);
    }
  };

  const handleCreateNewJourney = () => {
    if (!selectedCustomer && !showNewCustomerInput) return;

    if (showNewJourneyInput) {
      // Cancel - hide input
      setShowNewJourneyInput(false);
      setNewJourneyName("");
    } else {
      // Show input
      setShowNewJourneyInput(true);
      setSelectedJourney("");
    }
  };

  // Filter journeys by selected customer
  const filteredJourneyOptions = useMemo(() => {
    if (!selectedCustomer) return [];
    return (
      journeys
        ?.filter((journey) => journey.customerId === selectedCustomer)
        ?.map((journey) => ({
          value: journey.id,
          label: journey.name || `Journey ${journey.id.slice(-8)}`,
        })) || []
    );
  }, [journeys, selectedCustomer]);

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
        ?.filter((journey) => journey.customerId === selectedCustomer)
        ?.map((journey) => ({
          value: journey.id,
          label: journey.name || `Journey ${journey.id.slice(-8)}`,
        })) || [],
    [journeys, selectedCustomer]
  );

  const pageTitle = "Quotes";
  const pageDescription = `${quotes?.length} total quotes`;

  const [customerInputValue, setCustomerInputValue] = useState("");
  const [journeyInputValue, setJourneyInputValue] = useState("");

  const isCreateDisabled = () => {
    if (createLoading) return true;

    // If creating new customer, MUST also create new journey
    if (isCreatingCustomer) {
      return !customerInputValue.trim() || !journeyInputValue.trim();
    }

    // If customer selected but no journey selected (or being created)
    if (selectedCustomer && !selectedJourney && !isCreatingJourney) return true;

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
              value={selectedCustomer}
              onChange={(value) => {
                setSelectedCustomer(value);
                setSelectedJourney("");
                setNewJourneyName("");
              }}
              onIsCreateNewChange={(isCreateNew) => {
                setIsCreatingCustomer(isCreateNew);
                if (isCreateNew) {
                  setIsCreatingJourney(true);
                }
              }}
              onInputChange={setCustomerInputValue}
              placeholder="Select a customer (optional)"
              createPlaceholder="Enter customer name"
            />
          </div>

          {/* Journey Selection */}
          {(selectedCustomer || isCreatingCustomer) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Journey</label>
              <AdvancedDropdown
                ref={journeyRef}
                options={journeyOptions}
                value={selectedJourney}
                onChange={setSelectedJourney}
                onIsCreateNewChange={setIsCreatingJourney}
                onInputChange={setJourneyInputValue}
                disabled={!selectedCustomer && !isCreatingCustomer}
                forceCreate={isCreatingCustomer}
                placeholder={
                  isCreatingCustomer
                    ? "Enter journey name"
                    : !selectedCustomer && !isCreatingCustomer
                    ? "Select a customer first"
                    : "Select a journey"
                }
                createPlaceholder="Enter journey name"
              />
            </div>
          )}

          {/* Info Text */}
          <div className="text-xs text-text-muted bg-surface p-3 rounded">
            {!selectedCustomer &&
              !isCreatingCustomer &&
              !selectedJourney &&
              !isCreatingJourney &&
              "Create a standalone draft quote that can be attached to a customer later."}
            {isCreatingCustomer &&
              !isCreatingJourney &&
              "Creating a new customer requires creating a new journey as well."}
            {isCreatingCustomer &&
              isCreatingJourney &&
              "Quote will be created with the new customer and new journey."}
            {selectedCustomer &&
              !selectedJourney &&
              !isCreatingJourney &&
              "You must select or create a journey to proceed with this customer."}
            {selectedCustomer &&
              (selectedJourney || isCreatingJourney) &&
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
