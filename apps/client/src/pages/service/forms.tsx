import { Button, PageHeader } from "@/components"
import { PlusIcon } from "lucide-react";

const Forms = () => {
    const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button>
          <PlusIcon size={16} />
          <span>New Form</span>
        </Button>
      </div>
    );
  };

  return (
        <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Forms"
        description="... forms"
        actions={<Actions />}
      />
      </div>
  )
}

export default Forms