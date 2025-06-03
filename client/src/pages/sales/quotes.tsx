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
} from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";
import { useCreateSandboxQuote } from "@/hooks/sales/use-create-sandbox-quote";

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const include = useMemo(() => ["journey"], []);

  const { quotes, loading, error, refresh, pagination } = useGetQuotes({
    include,
  });
  const {
    createSandboxQuote,
    loading: sandboxLoading,
    error: sandboxError,
  } = useCreateSandboxQuote();

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
      key: "createdById",
      header: "Created By",
      render: (value) => value,
    },
  ];

  const navigate = useNavigate();

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

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
        <Button onClick={() => {}}>Existing Customer</Button>

        <div className="text-center">
          <span className="text-sm text-text-muted">or</span>
        </div>

        <Button
          onClick={async () => {
            const result = await createSandboxQuote();
            if (result) {
              toggleModal();
              refresh();
            }
          }}
          disabled={sandboxLoading}
          variant="secondary-outline">
          {sandboxLoading ? "Creating..." : "Sandbox Quote"}
        </Button>
      </Modal>
    </div>
  );
};

export default Quotes;
