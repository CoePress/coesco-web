import AdvancedDropdown from "@/components/common/advanced-dropdown";
import { useState, useRef } from "react";

const Sandbox = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedJourney, setSelectedJourney] = useState("");
  const customerRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);

  const customers = [
    { value: "1", label: "Customer 1" },
    { value: "2", label: "Customer 2" },
    { value: "3", label: "Customer 3" },
  ];

  const journeys = [
    { value: "1", label: "Journey 1" },
    { value: "2", label: "Journey 2" },
    { value: "3", label: "Journey 3" },
  ];

  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
  };

  const handleJourneyChange = (value: string) => {
    setSelectedJourney(value);
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center flex-1">
      <AdvancedDropdown
        ref={customerRef}
        options={customers}
        value={selectedCustomer}
        onChange={handleCustomerChange}
        placeholder="Select a customer"
        createPlaceholder="Customer name"
      />
      <AdvancedDropdown
        ref={journeyRef}
        options={journeys}
        value={selectedJourney}
        onChange={handleJourneyChange}
        placeholder="Select a journey"
        createPlaceholder="Journey name"
      />
    </div>
  );
};

export default Sandbox;
