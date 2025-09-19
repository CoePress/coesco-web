import { useEffect, useState } from "react";
// import MaterialSpecs from "./material-specs";
// import TDDBHD from "./tddbhd";
// import ReelDrive from "./reel-drive";
// import StrUtility from "./str-utility";
// import RollStrBackbend from "./roll-str-backbend";
// import Feed from "./feed";
// import Shear from "./shear";
// import SummaryReport from "./summary-report";
import { Save, Lock, Link } from "lucide-react";
import { useParams } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { Button, Modal, PageHeader, Select, Tabs } from "@/components";
// import RFQ from "./rfq";

// const PERFORMANCE_TABS = [
//   { label: "RFQ", value: "rfq" },
//   { label: "Material Specs", value: "material-specs" },
//   { label: "TDDBHD", value: "tddbhd" },
//   { label: "Reel Drive", value: "reel-drive" },
//   { label: "Str Utility", value: "str-utility" },
//   { label: "Roll Str Backbend", value: "roll-str-backbend" },
//   { label: "Feed", value: "feed" },
//   { label: "Shear", value: "shear" },
//   { label: "Summary Report", value: "summary-report" },
// ];

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


const PerformanceSheet = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("rfq");
  // const location = useLocation();
  // const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, _setIsEditing] = useState(false);
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
  // const { entity: performanceSheet, loading, error } = useGetEntity(
  //   `/performance/sheets`,
  //   performanceSheetId
  // );
  // const { emit, isConnected } = useSocket();
  const { user } = useAuth();
  const { get, patch } = useApi();

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
        const response = await get(
          `/lock/status/performance-sheets/${performanceSheetId}`
        );
        if (response) {
          setIsLocked((response as any)?.isLocked ?? false);
          setLockInfo((response as any)?.lockInfo || null);
        }
      } catch (err) {
        console.error("Failed to fetch lock status:", err);
      }
    };

    fetchLockStatus();
  }, [performanceSheetId]);

  const handleEdit = () => {
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

  const handleSave = async () => {
    if (!performanceSheetId) return;

    try {
      // Update performance sheet data here using patch
      // await patch(`/performance/sheets/${performanceSheetId}`, updatedData);

      // Release lock after save
      // if (!isConnected) return;
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
    } catch (error) {
      console.error("Failed to save performance sheet:", error);
    }
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
          onClick: () => setShowLinksModal(true),
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

  // const renderTabContent = () => {
  //   // const commonProps = {
  //   //   data: performanceSheet?.data || null,
  //   //   isEditing
  //   // };

  //   // // const getActiveTabFromUrl = (): PerformanceTabValue => {
  //   // //   const pathSegments = location.pathname.split('/');
  //   // //   const tabFromUrl = pathSegments[pathSegments.length - 1] as PerformanceTabValue;
      
  //   // //   const validTabs = PERFORMANCE_TABS.map(tab => tab.value);
  //   // //   return validTabs.includes(tabFromUrl) ? tabFromUrl : 'rfq';
  //   // // };

  //   // if (loading) {
  //   //   return <div className="flex justify-center items-center h-64">Loading...</div>;
  //   // }

  //   // if (error) {
  //   //   return <div className="flex justify-center items-center h-64 text-red-500">Error loading performance sheet</div>;
  //   // }

  //   // if (!performanceSheet?.data) {
  //   //   return <div className="flex justify-center items-center h-64">No data available</div>;
  //   // }

  //   // switch (activeTab) {
  //   //   case "rfq":
  //   //     return <RFQ {...commonProps} />;
  //   //   case "material-specs":
  //   //     return <MaterialSpecs {...commonProps} />;
  //   //   case "tddbhd":
  //   //     return <TDDBHD {...commonProps} />;
  //   //   case "reel-drive":
  //   //     return <ReelDrive {...commonProps} />;
  //   //   case "str-utility":
  //   //     return <StrUtility {...commonProps} />;
  //   //   case "roll-str-backbend":
  //   //     return <RollStrBackbend {...commonProps} />;
  //   //   case "feed":
  //   //     return <Feed {...commonProps} />;
  //   //   case "shear":
  //   //     return <Shear {...commonProps} />;
  //   //   case "summary-report":
  //   //     return <SummaryReport {...commonProps} />;
  //   //   default:
  //   //     return <RFQ {...commonProps} />;
  //   // }
  // };

  // const handleTabChange = (tab: PerformanceTabValue) => {
  //   navigate(`/performance/${performanceSheetId}/${tab}`);
  // };

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
        tabs={visibleTabs}
      />

      {/* <div className="tab-content">{renderTabContent()}</div> */}

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

export default PerformanceSheet;