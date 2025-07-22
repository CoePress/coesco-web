import { Plus, Filter, MoreHorizontal, ChevronDown, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, Table, PageSearch } from "@/components";
import { TableColumn } from "@/components/common/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import Modal from "@/components/common/modal";
import { useState, useEffect } from "react";
import { instance } from "@/utils";
import Input from "@/components/common/input";

const PerformanceSheets = () => {
  const { entities: performanceSheets } = useGetEntities("/performance/sheets");
  const [isModalOpen, setModalOpen] = useState(false);
  const [locks, setLocks] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [links, setLinks] = useState<
    Array<{ entityType: string; entityId: string }>
  >([]);
  const [addMode, setAddMode] = useState(false);
  const [newLink, setNewLink] = useState<{
    entityType: string;
    entityId: string;
  }>({ entityType: "quote", entityId: "" });

  useEffect(() => {
    const fetchLocks = async () => {
      try {
        const { data } = await instance.get(`/lock/performance-sheets`);
        const lockMap: Record<string, any> = {};
        (data.locks || []).forEach((lock: any) => {
          if (lock.lockInfo && lock.lockInfo.recordId) {
            lockMap[lock.lockInfo.recordId] = lock.lockInfo;
          }
        });
        setLocks(lockMap);
      } catch (err) {
        setLocks({});
      }
    };
    fetchLocks();
  }, [performanceSheets]);

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/performance/${row.id}`}>
          {row.name ? row.name : "Untitled Performance Sheet"}
        </Link>
      ),
    },
    {
      key: "revisionNumber",
      header: "Revision Number",
      className: "hover:underline",
      render: (_, row) => row.revisionNumber,
    },
    {
      key: "locked",
      header: "",
      render: (_, row) =>
        locks[row.id] ? (
          <Lock
            size={16}
            className="text-red-500"
            aria-label="Locked"
          />
        ) : null,
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

  const pageTitle = "Performance Sheets";
  const pageDescription = performanceSheets
    ? `${performanceSheets?.length} total performance sheets`
    : "";

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "New Performance Sheet",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: () => setModalOpen(true),
          },
        ]}
      />

      <PageSearch
        placeholder="Search companies..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
      />

      <Table<any>
        columns={columns}
        data={performanceSheets || []}
        total={performanceSheets?.length || 0}
        idField="id"
        pagination
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setName("");
          setLinks([]);
          setAddMode(false);
          setNewLink({ entityType: "quote", entityId: "" });
        }}
        title="New Performance Sheet"
        size="xs">
        <div className="py-4 flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default PerformanceSheets;
