import { useState, useEffect } from "react";
import { Button } from "@/components";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

type MachineFormProps = {
  machine?: any;
  onClose: () => void;
};

const MachineForm = ({ machine, onClose }: MachineFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    controllerType: "",
    connectionUrl: "",
    enabled: true,
  });

  useEffect(() => {
    if (machine) {
      setFormData({
        name: machine.name || "",
        type: machine.type || "",
        controllerType: machine.controllerType || "",
        connectionUrl: machine.connectionUrl || "",
        enabled: machine.enabled ?? true,
      });
    }
  }, [machine]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add API call to create/update machine
    console.log("Form submitted:", formData);
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Enter machine name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <Input
          value={formData.type}
          onChange={(e) => handleChange("type", e.target.value)}
          placeholder="Enter machine type"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Controller Type</label>
        <Select
          options={[
            { value: "PLC", label: "PLC" },
            { value: "DCS", label: "DCS" },
            { value: "SCADA", label: "SCADA" },
            { value: "HMI", label: "HMI" }
          ]}
          value={formData.controllerType}
          onChange={(e) => handleChange("controllerType", e.target.value)}
          placeholder="Select controller type"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Connection URL</label>
        <Input
          value={formData.connectionUrl}
          onChange={(e) => handleChange("connectionUrl", e.target.value)}
          placeholder="Enter connection URL"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) => handleChange("enabled", e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="enabled" className="text-sm font-medium">
          Enable machine
        </label>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {machine ? "Update" : "Create"} Machine
        </Button>
      </div>
    </form>
  );
};

export default MachineForm;