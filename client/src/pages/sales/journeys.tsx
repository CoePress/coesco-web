import { PageHeader } from "@/components";
import { Download } from "lucide-react";
import { Plus } from "lucide-react";

const Journeys = () => {
  const toggleModal = () => {
    console.log("toggleModal");
  };

  const pageTitle = "Journeys";
  const pageDescription = "Manage your journeys";

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "Export",
            icon: <Download size={16} />,
            variant: "secondary-outline",
            onClick: () => {},
          },
          {
            type: "button",
            label: "New Journey",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: toggleModal,
          },
        ]}
      />
    </div>
  );
};

export default Journeys;
