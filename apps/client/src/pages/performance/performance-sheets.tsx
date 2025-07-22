import { Plus, Filter, MoreHorizontal, ChevronDown, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, Table, PageSearch } from "@/components";
import { TableColumn } from "@/components/common/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import Modal from "@/components/common/modal";
import { useState, useEffect } from "react";
import { instance } from "@/utils";
import Input from "@/components/common/input";
import Button from "@/components/common/button";
import Select from "@/components/common/select";

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
      key: "referenceNumber",
      header: "Reference Number",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/performance/${row.id}`}>{row.referenceNumber}</Link>
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
        size="sm">
        <div className="py-4 flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Links</label>
            <div className="bg-foreground rounded border border-border p-2 flex flex-col gap-1 mb-2">
              {links.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No links added.
                </span>
              )}
              {links.map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center px-2 py-1 justify-between rounded hover:bg-surface/80 transition text-sm cursor-pointer border border-transparent">
                  <span className="font-medium capitalize text-text-muted">
                    {link.entityType}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    #{link.entityId}
                  </span>
                </div>
              ))}
            </div>
            {!addMode ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setAddMode(true)}
                className="w-full">
                Add Link
              </Button>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newLink.entityId) {
                    setLinks([...links, newLink]);
                    setAddMode(false);
                    setNewLink({ entityType: "quote", entityId: "" });
                  }
                }}>
                <Select
                  label="Entity Type"
                  name="entityType"
                  value={newLink.entityType}
                  onChange={(e) =>
                    setNewLink({ ...newLink, entityType: e.target.value })
                  }
                  options={[
                    { value: "quote", label: "Quote" },
                    { value: "journey", label: "Journey" },
                    { value: "contact", label: "Contact" },
                    { value: "company", label: "Company" },
                  ]}
                />
                <Input
                  label="Entity ID"
                  name="entityId"
                  value={newLink.entityId}
                  onChange={(e) =>
                    setNewLink({ ...newLink, entityId: e.target.value })
                  }
                  required
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary-outline"
                    size="md"
                    onClick={() => {
                      setAddMode(false);
                      setNewLink({ entityType: "quote", entityId: "" });
                    }}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!newLink.entityId}>
                    Save
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PerformanceSheets;
