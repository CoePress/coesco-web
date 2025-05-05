import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Link } from "lucide-react";
import { IMachine, IMachineConnection } from "@machining/types";
import { useState } from "react";

interface MachineModalProps {
  machine: IMachine | null;
  connection?: IMachineConnection;
  onUpdate: (machine: IMachine, connection?: IMachineConnection) => void;
  onClose: () => void;
}

const MachineModal = ({
  machine,
  connection,
  onUpdate,
  onClose,
}: MachineModalProps) => {
  if (!machine) return null;

  const [editMachine, setEditMachine] = useState<IMachine>({ ...machine });
  const [editConnection, setEditConnection] = useState<
    IMachineConnection | undefined
  >(connection ? { ...connection } : undefined);

  const handleSubmit = () => {
    onUpdate(editMachine, editConnection);
    onClose();
  };

  return (
    <DialogContent className="max-w-md p-2 pb-0">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          {machine.id ? "Edit Machine" : "New Machine"}: {machine.name}
        </DialogTitle>
        <DialogDescription>
          Configure machine settings and connection
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <Settings className="h-4 w-4 mr-1" />
            Machine Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editMachine.name}
                  onChange={(e) =>
                    setEditMachine({ ...editMachine, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={editMachine.slug}
                  onChange={(e) =>
                    setEditMachine({ ...editMachine, slug: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={editMachine.type}
                  onChange={(e) =>
                    setEditMachine({ ...editMachine, type: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Grid Position
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="row">Grid Row</Label>
                <Input
                  id="row"
                  type="number"
                  value={editMachine.row || 0}
                  onChange={(e) =>
                    setEditMachine({
                      ...editMachine,
                      row: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="column">Grid Column</Label>
                <Input
                  id="column"
                  type="number"
                  value={editMachine.column || 0}
                  onChange={(e) =>
                    setEditMachine({
                      ...editMachine,
                      column: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div> */}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium flex items-center mb-3">
          <Link className="h-4 w-4 mr-1" />
          Connection Settings
        </h3>
        <div className="space-y-4">
          <RadioGroup
            value={editConnection?.type || "none"}
            onValueChange={(value) => {
              if (value === "none") {
                setEditConnection(undefined);
              } else {
                setEditConnection({
                  ...(editConnection || {
                    id: "",
                    machineId: editMachine.id,
                    url: "",
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }),
                  type: value as "mazak" | "fanuc",
                } as IMachineConnection);
              }
            }}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="none"
                id="connection-none"
              />
              <Label htmlFor="connection-none">No Connection</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="mazak"
                id="connection-mazak"
              />
              <Label htmlFor="connection-mazak">Mazak Connection</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="fanuc"
                id="connection-fanuc"
              />
              <Label htmlFor="connection-fanuc">Fanuc Connection</Label>
            </div>
          </RadioGroup>

          {editConnection && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="ip">IP Address</Label>
                <Input
                  id="ip"
                  value={editConnection.ip}
                  onChange={(e) =>
                    setEditConnection({
                      ...editConnection,
                      ip: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={editConnection.port}
                  onChange={(e) =>
                    setEditConnection({
                      ...editConnection,
                      port: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="connectionActive"
                  checked={editConnection.isActive}
                  onCheckedChange={(checked) =>
                    setEditConnection({
                      ...editConnection,
                      isActive: !!checked,
                    })
                  }
                />
                <Label htmlFor="connectionActive">Connection is active</Label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </div>
    </DialogContent>
  );
};

export default MachineModal;
