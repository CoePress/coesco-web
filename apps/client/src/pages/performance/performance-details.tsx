import { useState } from "react";
import Tabs from "@/components/common/tabs";
import RFQ from "./rfq";
import MaterialSpecs from "./material-specs";
import TDDBHD from "./tddbhd";
import ReelDrive from "./reel-drive";
import SummaryReport from "./summary-report";
import PageHeader from "@/components/common/page-header";
import { Save } from "lucide-react";
import { useGetEntity } from "@/hooks/_base/use-get-entity";
import { useParams } from "react-router-dom";

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

  const { id: performanceSheetId } = useParams();

  const { entity: performanceSheet } = useGetEntity(
    `/performance/sheets`,
    performanceSheetId
  );

  console.log(performanceSheet);

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
            label: "Save  ",
            icon: <Save size={16} />,
            variant: "primary",
            onClick: () => {},
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
