import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { StatusBadge, PageHeader, Table, PageSearch } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { TableColumn } from "@/components/shared/table";
import useGetJourneys from "@/hooks/sales/use-get-journeys";

const Journeys = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const { journeys, loading, error, refresh, pagination } = useGetJourneys();

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ];

  const pageTitle = "Journeys";
  const pageDescription = journeys ? `${journeys?.length} total journeys` : "";

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
            label: "New Journey",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: () => {},
          },
        ]}
      />

      <PageSearch
        placeholder="Search journeys..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
        label={`${selectedRows.length} selected`}
        labelTrigger={selectedRows.length > 0}
      />

      <Table<any>
        columns={columns}
        data={journeys || []}
        total={journeys?.length || 0}
        idField="id"
        pagination
        onRowClick={(row) => navigate(`/sales/journeys/${row.id}`)}
      />
    </div>
  );
};

export default Journeys;
