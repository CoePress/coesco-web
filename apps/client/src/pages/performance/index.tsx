import { useState } from "react";
import Tabs from "@/components/shared/tabs";
import { Card } from "@/components";
import Text from "@/components/shared/text";
import RFQ from "./rfq";
import MaterialSpecs from "./material-specs";
import TDDBHD from "./tddbhd";
import ReelDrive from "./reel-drive";

const PERFORMANCE_TABS = [
  { label: "RFQ", value: "rfq" },
  { label: "Material Specs", value: "material-specs" },
  { label: "TDDBHD", value: "tddbhd" },
  { label: "Reel Drive", value: "reel-drive" },
];

type PerformanceTabValue = "rfq" | "material-specs" | "tddbhd" | "reel-drive";

const Performance = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("rfq");

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
      default:
        return <RFQ />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto">
        <Text as="h1" className="text-center py-8 text-3xl font-bold">
          Performance Engineering
        </Text>
        
        <Card className="mb-6">
          <Tabs
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab as PerformanceTabValue)}
            tabs={PERFORMANCE_TABS}
          />
        </Card>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Performance;
