import { useEffect, useState } from "react";
import Tabs from "@/components/common/tabs";
import RFQ from "./rfq";
import MaterialSpecs from "./material-specs";
import TDDBHD from "./tddbhd";
import ReelDrive from "./reel-drive";
import SummaryReport from "./summary-report";
import PageHeader from "@/components/common/page-header";
import { Save, Lock } from "lucide-react";
import { useGetEntity } from "@/hooks/_base/use-get-entity";
import { useParams } from "react-router-dom";
import { instance } from "@/utils";
import { useSocket } from "@/contexts/socket.context";
import { useAuth } from "@/contexts/auth.context";

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
        actions={[
          {
            type: "button",
            label: isEditing ? "Save" : isLocked ? "Locked" : "Save",
            icon: <Save size={16} />,
            variant: "primary",
            disabled: isLocked && !isEditing,
            onClick: isEditing ? handleSave : () => {},
          },
          {
            type: "button",
            label: "Edit",
            icon: <Lock size={16} />,
            variant: "secondary",
            disabled: isEditing || isLocked,
            onClick: handleEdit,
          },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as PerformanceTabValue)}
        tabs={PERFORMANCE_TABS}
      />

      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default PerformanceDetails;
