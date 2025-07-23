import { useEffect, useMemo, useState } from "react";
import { Save, Lock, Link, Trash } from "lucide-react";
import { useParams } from "react-router-dom";

import { Select } from "@/components";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import PageHeader from "@/components/common/page-header";
import Tabs from "@/components/common/tabs";
import { useAuth } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { useGetEntity } from "@/hooks/_base/use-get-entity";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { instance } from "@/utils";
import MaterialSpecs from "./material-specs";
import ReelDrive from "./reel-drive";
import RFQ from "./rfq";
import SummaryReport from "./summary-report";
import TDDBHD from "./tddbhd";
import { useCreateEntity } from "@/hooks/_base/use-create-entity";
import { useDeleteEntity } from "@/hooks/_base/use-delete-entity";

type LinksModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LinksModal = (props: LinksModalProps) => {
  const { isOpen, onClose } = props;
  const [mode, setMode] = useState<"view" | "add" | "record">("view");
  const [formData, setFormData] = useState({
    recordType: "",
    recordId: "",
  });

  const { id } = useParams();
  const linksEndpoint = "/performance/links";

  const saveDisabled = formData.recordType === "" || formData.recordId === "";
  const recordDisabled = formData.recordType === "";

  const filter = useMemo(() => ({ performanceSheetId: id }), []);

  const {
    entities: performanceLinks,
    loading: performanceLinksLoading,
    error: performanceLinksError,
    refresh: refreshPerformanceLinks,
  } = useGetEntities(linksEndpoint, {
    filter,
  });

  const {
    createEntity: createPerformanceLink,
    loading: createPerformanceLinkLoading,
  } = useCreateEntity(linksEndpoint);

  const {
    deleteEntity: deletePerformanceLink,
    loading: deletePerformanceLinkLoading,
  } = useDeleteEntity(linksEndpoint);

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
    refresh: refreshRecords,
  } = useGetEntities(recordUrl);

  const loading =
    performanceLinksLoading ||
    createPerformanceLinkLoading ||
    deletePerformanceLinkLoading ||
    recordLoading;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMode("view");
    setFormData({
      recordType: "",
      recordId: "",
    });
  };

  const handleCreateLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const result = await createPerformanceLink({
      entityType: formData.recordType,
      entityId: formData.recordId,
      performanceSheetId: id,
    });

    if (result.success) {
      setMode("view");
      setFormData({
        recordType: "",
        recordId: "",
      });
      refreshPerformanceLinks();
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    const result = await deletePerformanceLink(linkId);
    if (result && result.success) {
      refreshPerformanceLinks();
    }
  };

  const generateRecordSelectLabel = () => {
    if (formData.recordType === "") return "Select a record";
    return `Select a ${formData.recordType}`;
  };

  const renderView = () => {
    switch (mode) {
      case "view":
        return (
          <div>
            <div className="bg-foreground rounded border border-border flex flex-col gap-1 mb-4">
              {loading ? null : performanceLinks &&
                performanceLinks.length > 0 ? (
                performanceLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center p-2 justify-between rounded hover:bg-surface/80 transition text-sm border border-transparent">
                    <div className="flex flex-col">
                      <span className="font-medium capitalize text-text-muted">
                        {link.entityType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {link.entityId}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setMode("record")}>
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}>
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">
                  Not linked to any records.
                </p>
              )}
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
          <form className="flex flex-col gap-2">
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
                  label: entity.name || `${entity.id}`,
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
                disabled={saveDisabled}
                onClick={handleCreateLink}>
                Save
              </Button>
            </div>
          </form>
        );
      case "record":
        return (
          <div>
            Record Preview
            <div className="flex mt-2">
              <Button
                variant="secondary-outline"
                size="md"
                onClick={() => setMode("view")}>
                Back
              </Button>
            </div>
          </div>
        );
      default:
        return <p>Invalid mode</p>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Links"
      size="sm">
      {renderView()}
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
