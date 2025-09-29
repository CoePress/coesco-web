import { MoreHorizontal, Lock, RefreshCcw, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Input, Modal, PageHeader, VirtualTableAdapter } from "@/components";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { useState, useEffect } from "react";
import { instance } from "@/utils";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { initialPerformanceData } from "@/contexts/performance.context";

const PerformanceSheets = () => {
  const { entities: performanceSheets, refresh } = useGetEntities("/performance/sheets");
  const [isModalOpen, setModalOpen] = useState(false);
  const [locks, setLocks] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    sheetId: string;
    sheetName: string;
  }>({ isOpen: false, sheetId: "", sheetName: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const api = useApi();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handler to delete a performance sheet
  const handleDeleteSheet = async (sheetId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/performance/sheets/${sheetId}`);

      // Close confirmation modal
      setDeleteConfirmation({ isOpen: false, sheetId: "", sheetName: "" });

      // Refresh the list to remove the deleted sheet
      refresh();

    } catch (error) {
      console.error("Failed to delete performance sheet:", error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler to show delete confirmation
  const showDeleteConfirmation = (sheetId: string, sheetName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      sheetId,
      sheetName
    });
    setOpenDropdownId(null); // Close dropdown
  };

  // Handler to create a new performance sheet
  const handleCreateSheet = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      // Create a performance sheet version first (required by the data model)
      const versionResponse = await api.post("/performance/versions", {
        sections: {}, // Empty sections for now
        createdById: user?.id,
        updatedById: user?.id
      });

      if (!versionResponse?.data?.id) {
        throw new Error("Failed to create performance sheet version");
      }

      // Create the performance sheet with the version ID
      const performanceData = {
        ...initialPerformanceData,
        referenceNumber: name.trim() // Use the name as the reference number
      };

      const sheetResponse = await api.post("/performance/sheets", {
        name: name.trim(),
        versionId: versionResponse.data.id,
        data: performanceData,
        createdById: user?.id,
        updatedById: user?.id
      });

      if (sheetResponse?.data?.id) {
        // Close modal and reset form
        setModalOpen(false);
        setName("");

        // Refresh the list to show the new sheet
        refresh();

        // Navigate to the new performance sheet
        navigate(`/sales/performance-sheets/${sheetResponse.data.id}`);
      }
    } catch (error) {
      console.error("Failed to create performance sheet:", error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsCreating(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

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
        <Link to={`/sales/performance-sheets/${row.id}`}>
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
      render: (_, row) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === row.id ? null : row.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal size={16} />
          </button>

          {openDropdownId === row.id && (
            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showDeleteConfirmation(row.id, row.name || "Untitled Performance Sheet");
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const pageTitle = "Performance Sheets";
  const pageDescription = performanceSheets
    ? `${performanceSheets?.length} total performance sheets`
    : "";

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={() => { setModalOpen(true) }}>
          <RefreshCcw size={16} /> New Performance Sheet
        </Button>
      </div>
    );
  };

  // Sort sheets alphabetically by name (case-insensitive)
  const sortedSheets = (performanceSheets || []).slice().sort((a, b) => {
    const nameA = (a.name || "Untitled Performance Sheet").toLowerCase();
    const nameB = (b.name || "Untitled Performance Sheet").toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={<Actions />}
      />
      {/* ...existing code... */}
      <VirtualTableAdapter<any>
        columns={columns}
        data={sortedSheets}
        total={sortedSheets.length}
        idField="id"
        pagination
        enableVirtualScrolling={true}
        virtualScrollThreshold={50}
        rowHeight={60}
        containerHeight={500}
      />
      {/* ...existing code for modals... */}
    </div>
  );
};

export default PerformanceSheets;
