import { Plus, Filter, Download, ChevronDown } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import {
  Button,
  Modal,
  PageHeader,
  PageSearch,
  StatusBadge,
  Table,
  Select,
} from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";
import { useCreateQuote } from "@/hooks/sales/use-create-quote";
import useGetCompanies from "@/hooks/sales/use-get-companies";
import useGetJourneys from "@/hooks/sales/use-get-journeys";

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
      const result = await createQuote({
        customerId: selectedCustomer,
        journeyId: selectedJourney,
        customerName: showNewCustomerInput ? newCustomerName : undefined,
        journeyName: showNewJourneyInput ? newJourneyName : undefined,
      });
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

  // Focus journey input when customer name is entered
  useEffect(() => {
    if (showNewCustomerInput && newCustomerName.trim() && showNewJourneyInput) {
      const journeyInput = document.querySelector(
        'input[placeholder="Enter journey name"]'
      ) as HTMLInputElement;
      if (journeyInput) {
        journeyInput.focus();
      }
    }
  }, [newCustomerName, showNewCustomerInput, showNewJourneyInput]);

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

  const customerOptions =
    companies?.map((company) => ({
      value: company.id,
      label: company.name,
    })) || [];

  const pageTitle = "Quotes";
  const pageDescription = `${quotes?.length} total quotes`;

  const isCreateDisabled = () => {
    if (createLoading) return true;

    // If creating new customer, MUST also create new journey
    if (showNewCustomerInput) {
      return (
        !newCustomerName.trim() ||
        !showNewJourneyInput ||
        !newJourneyName.trim()
      );
    }

    // If showing new journey input but no name entered
    if (showNewJourneyInput && !newJourneyName.trim()) return true;

    // If customer selected but no journey selected (or being created)
    if (selectedCustomer && !selectedJourney && !showNewJourneyInput)
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">Customer</label>
              <div className="flex gap-2">
                {selectedCustomer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer("");
                      setSelectedJourney("");
                      setShowNewCustomerInput(false);
                      setNewCustomerName("");
                      setShowNewJourneyInput(false);
                      setNewJourneyName("");
                    }}
                    className="text-xs h-6 px-2">
                    Clear
                  </Button>
                )}
                {!selectedCustomer && !showNewCustomerInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateNewCustomer}
                    className="text-xs h-6 px-2">
                    Create New
                  </Button>
                )}
                {showNewCustomerInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateNewCustomer}
                    className="text-xs h-6 px-2">
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* New Customer Input */}
            {showNewCustomerInput && (
              <div className="space-y-2 p-3 bg-surface border rounded">
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  ref={customerInputRef}
                />
                {newCustomerName.trim() && !showNewJourneyInput && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    You must also create a journey for this new customer.
                  </div>
                )}
              </div>
            )}

            {!showNewCustomerInput && (
              <Select
                options={customerOptions}
                value={selectedCustomer}
                onChange={(e) => {
                  const newCustomerId = e.target.value;
                  setSelectedCustomer(newCustomerId);
                  if (!newCustomerId) {
                    setSelectedJourney("");
                    setShowNewJourneyInput(false);
                    setNewJourneyName("");
                  }
                }}
                placeholder="Select a customer (optional)"
              />
            )}
          </div>

          {/* Journey Selection */}
          {(selectedCustomer || showNewCustomerInput) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">Journey</label>
                <div className="flex gap-2">
                  {selectedJourney && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedJourney("");
                        setShowNewJourneyInput(false);
                        setNewJourneyName("");
                      }}
                      disabled={!selectedCustomer}
                      className="text-xs h-6 px-2">
                      Clear
                    </Button>
                  )}
                  {!selectedJourney &&
                    !showNewJourneyInput &&
                    selectedCustomer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateNewJourney}
                        className="text-xs h-6 px-2">
                        Create New
                      </Button>
                    )}
                  {showNewJourneyInput && !showNewCustomerInput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateNewJourney}
                      className="text-xs h-6 px-2">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* New Journey Input */}
              {showNewJourneyInput && (
                <div className="space-y-2 p-3 bg-surface border rounded">
                  <input
                    type="text"
                    placeholder="Enter journey name"
                    value={newJourneyName}
                    onChange={(e) => setNewJourneyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                </div>
              )}

              {!showNewJourneyInput && (
                <Select
                  options={filteredJourneyOptions}
                  value={selectedJourney}
                  onChange={(e) => setSelectedJourney(e.target.value)}
                  disabled={!selectedCustomer && !showNewCustomerInput}
                  placeholder={
                    !selectedCustomer && !showNewCustomerInput
                      ? "Select a customer first"
                      : showNewCustomerInput
                      ? "Create a new journey for the new customer"
                      : "Select a journey"
                  }
                />
              )}
            </div>
          )}

          {/* Info Text */}
          <div className="text-xs text-text-muted bg-surface p-3 rounded">
            {!selectedCustomer &&
              !showNewCustomerInput &&
              !selectedJourney &&
              !showNewJourneyInput &&
              "Create a standalone draft quote that can be attached to a customer later."}
            {showNewCustomerInput &&
              !showNewJourneyInput &&
              "Creating a new customer requires creating a new journey as well."}
            {showNewCustomerInput &&
              showNewJourneyInput &&
              "Quote will be created with the new customer and new journey."}
            {selectedCustomer &&
              !selectedJourney &&
              !showNewJourneyInput &&
              "You must select or create a journey to proceed with this customer."}
            {selectedCustomer &&
              (selectedJourney || showNewJourneyInput) &&
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
