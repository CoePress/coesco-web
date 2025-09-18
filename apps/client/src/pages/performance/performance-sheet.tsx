import { useEffect, useState } from "react";
import MaterialSpecs from "./material-specs";
import TDDBHD from "./tddbhd";
import ReelDrive from "./reel-drive";
import StrUtility from "./str-utility";
import RollStrBackbend from "./roll-str-backbend";
import Feed from "./feed";
import Shear from "./shear";
import SummaryReport from "./summary-report";
import { Save, Lock, Link } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { instance } from "@/utils";
import { useAuth } from "@/contexts/auth.context";
import { Button, Modal, PageHeader, Select, Tabs } from "@/components";
import RFQ from "./rfq";
import { useApi } from "@/hooks/use-api";
import { PerformanceSheetProvider, usePerformanceSheet } from "@/contexts/performance.context";

const PERFORMANCE_TABS = [
  { label: "RFQ", value: "rfq" },
  { label: "Material Specs", value: "material-specs" },
  { label: "TDDBHD", value: "tddbhd" },
  { label: "Reel Drive", value: "reel-drive" },
  { label: "Str Utility", value: "str-utility" },
  { label: "Roll Str Backbend", value: "roll-str-backbend" },
  { label: "Feed", value: "feed" },
  { label: "Shear", value: "shear" },
  { label: "Summary Report", value: "summary-report" },
];

type PerformanceTabValue =
  | "rfq"
  | "material-specs"
  | "tddbhd"
  | "reel-drive"
  | "str-utility"
  | "roll-str-backbend"
  | "feed"
  | "shear"
  | "summary-report";


const PerformanceSheetContent = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("rfq");
  const location = useLocation();
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newLink, setNewLink] = useState<{
    entityType: string;
    entityId: string;
  }>({ entityType: "quote", entityId: "" });
  const [links, setLinks] = useState<
    Array<{ entityType: string; entityId: string }>
  >([
    { entityType: "quote", entityId: "123" },
    { entityType: "journey", entityId: "456" },
    { entityType: "company", entityId: "789" },
  ]);
  const { id: performanceSheetId } = useParams();
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use global performance context
  const { performanceData, setPerformanceData } = usePerformanceSheet();

  useEffect(() => {
    const fetchPerformanceSheet = async () => {
      if (!performanceSheetId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`performance/sheets/${performanceSheetId}`);
        if (response && response.data) {
          // Update global context with fetched data
          setPerformanceData(response.data.data || response.data);
        }
      } catch (err) {
        setError("Failed to load performance sheet");
      } finally {
        setLoading(false);
      }
    };
    fetchPerformanceSheet();
  }, [performanceSheetId]); // Only depend on performanceSheetId
  // const { emit, isConnected } = useSocket();
  const { user } = useAuth();

  const visibleTabs = [
    { label: "RFQ", value: "rfq" },
    { label: "Material Specs", value: "material-specs" },
    { label: "Summary Report", value: "summary-report" },
    { label: "TDDBHD", value: "tddbhd" },
    { label: "Str Utility", value: "str-utility" },
    { label: "Roll Str Backbend", value: "roll-str-backbend" },
    { label: "Feed", value: "feed" },
  ];

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
    setIsEditing(!isEditing);
    // if (!performanceSheetId || !isConnected) return;
    // emit(
    //   "lock:acquire",
    //   {
    //     recordType: "performance-sheets",
    //     recordId: performanceSheetId,
    //     userId: user?.id,
    //   },
    //   (result: any) => {
    //     if (result?.success) {
    //       setIsEditing(true);
    //       setIsLocked(false);
    //       setLockInfo(result.lockInfo);
    //     } else {
    //       setIsLocked(true);
    //       setIsEditing(false);
    //     }
    //   }
    // );
  };

  const handleSave = () => {
    setIsEditing(false);
    // if (!performanceSheetId || !isConnected) return;
    // emit(
    //   "lock:release",
    //   {
    //     recordType: "performance-sheets",
    //     recordId: performanceSheetId,
    //     userId: user?.id,
    //   },
    //   (result: any) => {
    //     setIsEditing(false);
    //     setIsLocked(false);
    //     setLockInfo(null);
    //   }
    // );
  };

  const renderTabContent = () => {
    const commonProps = {
      data: performanceData || null,
      isEditing
    };

    if (loading) {
      return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error) {
      return <div className="flex justify-center items-center h-64 text-red-500">Error loading performance sheet</div>;
    }

    if (!performanceData) {
      return <div className="flex justify-center items-center h-64">No data available</div>;
    }

    switch (activeTab) {
      case "rfq":
        return <RFQ {...commonProps} />;
      case "material-specs":
        return <MaterialSpecs {...commonProps} />;
      case "tddbhd":
        return <TDDBHD {...commonProps} />;
      case "reel-drive":
        return <ReelDrive {...commonProps} />;
      case "str-utility":
        return <StrUtility {...commonProps} />;
      case "roll-str-backbend":
        return <RollStrBackbend {...commonProps} />;
      case "feed":
        return <Feed {...commonProps} />;
      case "shear":
        return <Shear {...commonProps} />;
      case "summary-report":
        return <SummaryReport {...commonProps} />;
      default:
        return <RFQ {...commonProps} />;
    }
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={isEditing ? handleSave : handleEdit}>
          {isEditing ? <Save size={16} /> : <Lock size={16} />}
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Performance Details"
        description="Performance Details"
        actions={<Actions />}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as PerformanceTabValue)}
        tabs={visibleTabs}
      />

      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>

      <Modal
        isOpen={showLinksModal}
        onClose={() => {
          setShowLinksModal(false);
          setAddMode(false);
          setNewLink({ entityType: "quote", entityId: "" });
        }}
        title="Links"
        size="sm">
        {!addMode ? (
          <div>
            <div className="bg-foreground rounded border border-border p-2 flex flex-col gap-1 mb-4">
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
            <Button
              variant="primary"
              size="md"
              onClick={() => setAddMode(true)}
              className="w-full">
              Add
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLinks([...links, newLink]);
              setAddMode(false);
              setNewLink({ entityType: "quote", entityId: "" });
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
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Entity ID
              </label>
              <input
                className="w-full border rounded px-2 py-1"
                type="text"
                value={newLink.entityId}
                onChange={(e) =>
                  setNewLink({ ...newLink, entityId: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
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
                onClick={() => {
                  setLinks([...links, newLink]);
                  setAddMode(false);
                  setNewLink({ entityType: "quote", entityId: "" });
                }}
                disabled={!newLink.entityId}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const PerformanceSheet = () => {
  return (
    <PerformanceSheetProvider>
      <PerformanceSheetContent />
    </PerformanceSheetProvider>
  );
};

export default PerformanceSheet;