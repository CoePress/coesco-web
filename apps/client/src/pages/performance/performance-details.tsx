import { useEffect, useState } from "react";
import Tabs from "@/components/common/tabs";
import RFQ from "./rfq";
import MaterialSpecs from "./material-specs";
import TDDBHD from "./tddbhd";
import ReelDrive from "./reel-drive";
import SummaryReport from "./summary-report";
import PageHeader from "@/components/common/page-header";
import { Save, Lock, Link } from "lucide-react";
import { useGetEntity } from "@/hooks/_base/use-get-entity";
import { useParams } from "react-router-dom";
import { instance } from "@/utils";
import { useSocket } from "@/contexts/socket.context";
import { useAuth } from "@/contexts/auth.context";
import Modal from "@/components/common/modal";
import { Select } from "@/components";
import Button from "@/components/common/button";
import { useGetEntities } from "@/hooks/_base/use-get-entities";

type LinksModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LinksModal = (props: LinksModalProps) => {
  const { isOpen, onClose } = props;
  const [mode, setMode] = useState<"view" | "add" | "record">("view");
  const [formData, setFormData] = useState({
    recordType: "" as string | "",
    recordId: "" as string | "",
  });

  const saveDisabled = formData.recordType === "" || formData.recordId === "";
  const recordDisabled =
    formData.recordType === "" || formData.recordType === "";

  const {
    entities: links,
    loading,
    error,
    refresh,
  } = useGetEntities("/performance/links");

  const recordTypeUrlMap: Record<string, string> = {
    quote: "quotes",
    journey: "journeys",
    contact: "contacts",
    company: "companies",
  };

  const recordUrl =
    formData.recordType && recordTypeUrlMap[formData.recordType]
      ? `/${recordTypeUrlMap[formData.recordType]}`
      : null;
  const {
    entities: recordEntities,
    loading: recordLoading,
    error: recordError,
    refresh: refreshRecords,
  } = useGetEntities(recordUrl);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMode("view");
    refresh();
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMode("view");
    setFormData({
      recordType: "",
      recordId: "",
    });
  };

  const generateRecordSelectLabel = () => {
    if (formData.recordType === null || formData.recordType === "")
      return "Select a record";
    return `Select a ${formData.recordType}`;
  };

  const renderView = (mode: string) => {
    switch (mode) {
      case "view":
        return (
          <div>
            <div className="bg-foreground rounded border border-border p-2 flex flex-col gap-1 mb-4">
              {links &&
                links.map((link, idx) => (
                  <div
                    onClick={() => setMode("record")}
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
            <Button
              variant="primary"
              size="md"
              onClick={() => setMode("add")}
              className="w-full">
              Add
            </Button>
          </div>
        );
      case "add":
        return (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2">
            <Select
              label="Record Type"
              name="recordType"
              value={formData.recordType}
              onChange={handleChange}
              options={[
                { value: "", label: "Select a record type" },
                { value: "quote", label: "Quote" },
                { value: "journey", label: "Journey" },
                { value: "contact", label: "Contact" },
                { value: "company", label: "Company" },
              ]}
            />
            <Select
              label="Record"
              name="recordId"
              value={formData.recordId}
              onChange={handleChange}
              disabled={recordDisabled}
              options={[
                { value: "", label: generateRecordSelectLabel() },
                ...(recordEntities || []).map((entity) => ({
                  value: entity.id,
                  label: entity.name || `#${entity.id}`,
                })),
              ]}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                size="md"
                onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={saveDisabled}>
                Save
              </Button>
            </div>
          </form>
        );
      case "record":
        return (
          <div>
            Record Preview
            <div className="flex">
              <Button
                variant="secondary-outline"
                size="md"
                onClick={handleCancel}>
                Back
              </Button>
            </div>
          </div>
        );
      default:
        return <p>Invalid mode</p>;
    }
  };

  // Remove the useEffect - not needed anymore
  // The hook will automatically re-run when formData.recordType changes

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Links"
      size="sm">
      {renderView(mode)}
    </Modal>
  );
};

const PERFORMANCE_TABS = [
  { label: "RFQ", value: "rfq" },
  { label: "Material Specs", value: "material-specs" },
  { label: "TDDBHD", value: "tddbhd" },
  { label: "Reel Drive", value: "reel-drive" },
  { label: "Summary Report", value: "summary-report" },
];

type PerformanceTabValue =
  | "rfq"
  | "material-specs"
  | "tddbhd"
  | "reel-drive"
  | "summary-report";

const PerformanceDetails = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("rfq");
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [linksModalOpen, setLinksModalOpen] = useState(false);

  const { id: performanceSheetId } = useParams();
  const { entity: performanceSheet } = useGetEntity(
    `/performance/sheets`,
    performanceSheetId
  );
  const { emit, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!performanceSheetId) return;

    const fetchLockStatus = async () => {
      try {
        const { data } = await instance.get(
          `/lock/status/performance-sheets/${performanceSheetId}`
        );
        setIsLocked(data?.isLocked ?? false);
        setLockInfo(data?.lockInfo || null);
      } catch (err) {
        console.error("Failed to fetch lock status:", err);
      }
    };

    fetchLockStatus();
  }, [performanceSheetId]);

  const handleEdit = () => {
    if (!performanceSheetId || !isConnected) return;
    emit(
      "lock:acquire",
      {
        recordType: "performance-sheets",
        recordId: performanceSheetId,
        userId: user?.id,
      },
      (result: any) => {
        if (result?.success) {
          setIsEditing(true);
          setIsLocked(false);
          setLockInfo(result.lockInfo);
        } else {
          setIsLocked(true);
          setIsEditing(false);
        }
      }
    );
  };

  const handleSave = () => {
    if (!performanceSheetId || !isConnected) return;
    emit(
      "lock:release",
      {
        recordType: "performance-sheets",
        recordId: performanceSheetId,
        userId: user?.id,
      },
      (result: any) => {
        setIsEditing(false);
        setIsLocked(false);
        setLockInfo(null);
      }
    );
  };

  const getHeaderActions = () => {
    if (isEditing) {
      return [
        {
          type: "button",
          label: "Save",
          icon: <Save size={16} />,
          variant: "primary",
          disabled: false,
          onClick: handleSave,
        },
      ];
    }
    if (isLocked && lockInfo?.userId && lockInfo.userId !== user?.id) {
      return [
        {
          type: "button",
          label: "Locked",
          icon: <Lock size={16} />,
          variant: "secondary",
          disabled: true,
          onClick: () => {},
        },
      ];
    }
    if (isLocked && lockInfo?.userId === user?.id) {
      return [
        {
          type: "button",
          label: "Save",
          icon: <Save size={16} />,
          variant: "primary",
          disabled: false,
          onClick: handleSave,
        },
      ];
    }
    if (!isLocked) {
      return [
        {
          type: "button",
          label: null,
          icon: <Link size={16} />,
          variant: "secondary-outline",
          disabled: false,
          onClick: () => setLinksModalOpen(true),
        },
        {
          type: "button",
          label: "Edit",
          icon: <Lock size={16} />,
          variant: "secondary",
          disabled: false,
          onClick: handleEdit,
        },
      ];
    }
    return [];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "rfq":
        return <RFQ />;
      case "material-specs":
        return <MaterialSpecs />;
      case "tddbhd":
        return <TDDBHD />;
      case "reel-drive":
        return <ReelDrive />;
      case "summary-report":
        return <SummaryReport />;
      default:
        return <RFQ />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Performance Details"
        description="Performance Details"
        actions={getHeaderActions() as any}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as PerformanceTabValue)}
        tabs={PERFORMANCE_TABS}
      />

      <div className="tab-content">{renderTabContent()}</div>

      {linksModalOpen && (
        <LinksModal
          isOpen={linksModalOpen}
          onClose={() => setLinksModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PerformanceDetails;
