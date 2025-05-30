import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Modal,
  PageHeader,
  PageSearch,
  StatusBadge,
  Table,
} from "@/components";
import { formatCurrency } from "@/utils";
import { sampleQuotes } from "@/utils/sample-data";
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";

type Quote = {
  id: string;
  name: string;
  customer: string;
  contact: string;
  amount: number;
  date: string;
  expiry: string;
  status: string;
  items: number;
};

const Quotes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const { quotes, loading, error, refresh, pagination } = useGetQuotes();

  const columns: TableColumn<Quote>[] = [
    {
      key: "id",
      header: "Quote ID",
      className: "text-primary",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <StatusBadge
          label={value as string}
          icon={value === "active" ? CheckCircle : XCircle}
          variant={
            value === "accepted"
              ? "success"
              : value === "rejected"
              ? "error"
              : "default"
          }
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <div className="flex gap-2">
          <button onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={16} />
          </button>
          <button onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={16} />
          </button>
          <button onClick={(e) => e.stopPropagation()}>
            <DollarSign size={16} />
          </button>
        </div>
      ),
    },
  ];

  const navigate = useNavigate();

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const totalQuoteValue = sampleQuotes.reduce(
    (sum, quote) => sum + quote.amount,
    0
  );

  const pageTitle = "Quotes";
  const pageDescription = `${
    sampleQuotes.length
  } total quotes · ${formatCurrency(totalQuoteValue)} total value`;

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
            label: "Add Quote",
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
        onRowClick={(row) => {
          navigate(`/sales/quotes/${row.id}`);
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
          onClick={() => {}}
          variant="secondary-outline">
          New Customer
        </Button>
      </Modal>
    </div>
  );
};

export default Quotes;
