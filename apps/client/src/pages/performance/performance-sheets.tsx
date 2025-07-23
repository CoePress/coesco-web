import { ChevronDown, Filter, Lock, MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader, PageSearch, Table, Button } from "@/components";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import { TableColumn } from "@/components/common/table";
import { useCreateEntity } from "@/hooks/_base/use-create-entity";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { instance } from "@/utils";

const PerformanceSheets = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [locks, setLocks] = useState<Record<string, any>>({});
  const [name, setName] = useState("");

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

  const {
    entities: performanceSheets,
    loading: performanceSheetsLoading,
    error: performanceSheetsError,
    refresh: refreshPerformanceSheets,
  } = useGetEntities("/performance/sheets");

  const pageTitle = "Performance Sheets";
  const pageDescription = performanceSheets
    ? `${performanceSheets?.length} total performance sheets`
    : "";

  const {
    createEntity: createPerformanceSheet,
    loading: createPerformanceSheetLoading,
    error: createPerformanceSheetError,
  } = useCreateEntity("/performance/sheets");

  const handleClose = () => {
    setModalOpen(false);
    setName("");
  };

  const handleCreate = async () => {
    const result = await createPerformanceSheet({
      name,
    });
    if (result.success) {
      handleClose();
      refreshPerformanceSheets();
    }
  };

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
        onClose={handleClose}
        title="New Performance Sheet"
        size="xs">
        <div className="flex flex-col gap-2">
          <Input
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              size="md"
              onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreate}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PerformanceSheets;
