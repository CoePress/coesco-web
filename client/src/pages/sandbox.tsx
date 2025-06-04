import AdvancedDropdown from "@/components/common/advanced-dropdown";
import { useState } from "react";

const Sandbox = () => {
  const [selectedValue, setSelectedValue] = useState("");

  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ];

  return (
    <div className="flex items-center justify-center flex-1">
      <AdvancedDropdown
        options={options}
        value={selectedValue}
        onChange={(value) => setSelectedValue(value)}
        placeholder="Select an option..."
      />
      ;
    </div>
  );
};

export default Sandbox;
