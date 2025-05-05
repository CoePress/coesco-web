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
import { formatCurrency, formatDate } from "@/utils";
import { sampleQuotes } from "@/utils/sample-data";
import { TableColumn } from "@/components/v1/table";

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
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const columns: TableColumn<Quote>[] = [
    {
      key: "id",
      header: "Quote ID",
      className: "text-primary",
    },
    {
      key: "name",
      header: "Name",
    },
    {
      key: "customer",
      header: "Customer",
      render: (_, row) => (
        <>
          <div>{row.customer}</div>
          <div>{row.contact}</div>
        </>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (value, row) => (
        <>
          <div>{formatCurrency(value as number)}</div>
          <div>{row.items} items</div>
        </>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (value) => <div>{formatDate(value as string)}</div>,
    },
    {
      key: "expiry",
      header: "Expiry",
      render: (value) => <div>{formatDate(value as string)}</div>,
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
      key: "assignedTo",
      header: "Assigned To",
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
        actions={
          <>
            <Button
              onClick={() => {}}
              variant="secondary-outline">
              <Download size={16} />
              Export
            </Button>
            <Button onClick={toggleModal}>
              <Plus size={16} />
              New Quote
            </Button>
          </>
        }
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
        data={sampleQuotes}
        onRowClick={(row) => {
          navigate(`/sales/quotes/${row.id}`);
        }}
        total={sampleQuotes.length}
        selectable
        selectedItems={selectedRows}
        onSelectionChange={setSelectedRows}
        idField="id"
        pagination
      />

      <Modal
        isOpen={isModalOpen}
        onClose={toggleModal}
        title="New Quote">
        <div>Modal</div>
      </Modal>
    </div>
  );
};

export default Quotes;
