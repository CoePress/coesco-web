import { Button } from "@/components";
import AddressAutocomplete from "@/components/common/address-input";
import { useState } from "react";

const Sandbox = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);

  const GOOGLE_API_KEY = "AIzaSyAggNUxlA-WkP5yvP_l3kCIQckeQBPEyOU";

  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
  };

  const logSelectedAddress = () => {
    if (selectedAddress) {
      console.log("Selected Address:", selectedAddress);
    } else {
      console.log("No address selected");
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center flex-1">
      <div className="w-full max-w-sm">
        <label className="block text-sm font-medium text-text-muted mb-2">
          Shipping Address
        </label>
        <AddressAutocomplete
          apiKey={GOOGLE_API_KEY}
          onAddressSelect={handleAddressSelect}
          placeholder="Customer Address"
        />
      </div>

      <Button onClick={logSelectedAddress}>Log Address</Button>
    </div>
  );
};

export default Sandbox;
