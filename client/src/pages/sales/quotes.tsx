import { Plus, Filter, Download, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Button,
  Modal,
  PageHeader,
  PageSearch,
  StatusBadge,
  Table,
  Tabs,
  Select,
} from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";
import { useCreateSandboxQuote } from "@/hooks/sales/use-create-sandbox-quote";
import useGetCompanies from "@/hooks/sales/use-get-companies";
import useGetJourneys from "@/hooks/sales/use-get-journeys";

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"actual" | "sandbox">("actual");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedJourney, setSelectedJourney] = useState<string>("");

  const include = useMemo(() => ["journey", "journey.customer"], []);

  const { quotes, loading, error, refresh, pagination } = useGetQuotes({
    include,
  });
  const {
    createSandboxQuote,
    loading: sandboxLoading,
    error: sandboxError,
  } = useCreateSandboxQuote();
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
      setActiveTab("actual");
      setSelectedCustomer("");
      setSelectedJourney("");
    }
  };

  const handleCreateQuote = async () => {
    if (activeTab === "sandbox") {
      const result = await createSandboxQuote();
      if (result) {
        toggleModal();
        refresh();
      }
    } else {
      // TODO: Implement actual quote creation
      console.log("Create actual quote with:", {
        selectedCustomer,
        selectedJourney,
      });
    }
  };

  const customerOptions =
    companies?.map((company) => ({
      value: company.id,
      label: company.name,
    })) || [];

  const journeyOptions =
    journeys?.map((journey) => ({
      value: journey.id,
      label: journey.name,
    })) || [];

  const totalQuoteValue = quotes?.reduce(
    (sum, quote) => sum + quote.totalAmount,
    0
  );

  const pageTitle = "Quotes";
  const pageDescription = `${quotes?.length} total quotes · ${formatCurrency(
    totalQuoteValue
  )} total value`;

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
        <div className="space-y-4">
          <Tabs
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab as "actual" | "sandbox")}
            tabs={[
              { label: "Actual", value: "actual" },
              { label: "Sandbox", value: "sandbox" },
            ]}
          />

          <div className="space-y-4 pt-4">
            <Select
              label="Customer"
              options={customerOptions}
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required={activeTab === "actual"}
              placeholder="Select a customer"
            />

            <Select
              label="Journey"
              options={journeyOptions}
              value={selectedJourney}
              onChange={(e) => setSelectedJourney(e.target.value)}
              required={activeTab === "actual"}
              placeholder="Select a journey"
            />

            <Button
              onClick={handleCreateQuote}
              disabled={
                (activeTab === "actual" &&
                  (!selectedCustomer || !selectedJourney)) ||
                sandboxLoading
              }
              variant="primary"
              className="w-full">
              {sandboxLoading ? "Creating..." : "Create Quote"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Quotes;
