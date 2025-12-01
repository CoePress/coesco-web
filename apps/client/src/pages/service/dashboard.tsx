import { RefreshCcw } from "lucide-react";

import { Button } from "@/components";
import PageHeader from "@/components/layout/page-header";

function ServiceDashboard() {
  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button>
          <RefreshCcw size={20} />
          {" "}
          Refresh
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Service Dashboard"
        description="Track your service tasks"
        actions={<Actions />}
      />
    </div>
  );
}

export default ServiceDashboard;
