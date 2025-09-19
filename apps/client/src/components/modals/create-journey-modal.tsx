import { useState } from "react";
import { Modal, Button, Input, Select } from "@/components";
import { generateUniqueId } from "@/utils/unique-id-generator";
import { useApi } from "@/hooks/use-api";

interface CreateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJourney?: any) => void;
  availableRsms: string[];
  companyId?: string;
  companyName?: string;
}

export const CreateJourneyModal = ({
  isOpen,
  onClose,
  onSuccess,
  availableRsms,
  companyId,
  companyName,
}: CreateJourneyModalProps) => {
  const [name, setName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [journeyType, setJourneyType] = useState<string>("");
  const [rsm, setRsm] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [stateProv, setStateProv] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [leadSource, setLeadSource] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [actionDate, setActionDate] = useState<string>("");
  const [equipmentType, setEquipmentType] = useState<string>("");

  const { post, loading, error } = useApi();

  const handleCreate = async () => {
    // Validate required fields
    if (!name || !journeyType || !rsm || !city || !stateProv || !country || !industry || !leadSource) {
      alert("Please fill in all required fields: Journey Name, Journey Type, RSM, City, State, Country, Industry, and Lead Source");
      return;
    }

    try {
      // Generate a unique ID for the Journey
      const uniqueId = await generateUniqueId("Journey", "ID", "std");

      // Map form fields to database field names
      const payload = {
        ID: uniqueId,
        Project_Name: name,
        Journey_Start_Date: startDate,
        Journey_Type: journeyType,
        RSM: rsm,
        City: city,
        State_Province: stateProv,
        Country: country,
        Industry: industry,
        Lead_Source: leadSource,
        Journey_Stage: "Lead", // Default to Lead
        Notes: notes,
        Action_Date: actionDate,
        Equipment_Type: equipmentType,
        Company_ID: companyId ? parseInt(companyId) : undefined,
        Target_Account: companyName || '',
      };

      console.log("Journey payload:", payload);

      const result = await post("/legacy/std/Journey", payload);

      if (result) {
        // Create the journey object for immediate display
        const newJourney = {
          ...payload,
          // Use the generated ID as the primary identifier
          CreateDT: new Date().toISOString(),
          Action_Date: actionDate || new Date().toISOString(),
          Journey_Value: 0, // Default value
          Priority: 'C', // Default priority
          Quote_Number: '', // Default empty
          Chance_To_Secure_order: null, // Default empty
          // Add other fields that might be expected
          Expected_Decision_Date: null,
          Quote_Presentation_Date: null,
          Date_PO_Received: null,
          Journey_Start_Date: startDate || new Date().toISOString(),
          Journey_Status: 'Active',
          RSM_Territory: '',
          Dealer: '',
          Dealer_Name: '',
          Dealer_ID: null,
          Qty_of_Items: 0,
        };
        onSuccess?.(newJourney);
        onClose();
        // Reset form
        setName("");
        setStartDate("");
        setJourneyType("");
        setRsm("");
        setCity("");
        setStateProv("");
        setCountry("");
        setIndustry("");
        setLeadSource("");
        setNotes("");
        setActionDate("");
        setEquipmentType("");
      } else {
        console.error("Journey creation failed:", error);
      }
    } catch (error) {
      console.error("Error generating unique ID or creating journey:", error);
      alert("Failed to create journey. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Journey" size="md">
      <div className="flex flex-col max-h-[60vh]">
        <div className="overflow-y-auto pr-2 space-y-3 mb-2">
          <div className="space-y-1">
            <Input
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="Enter journey name"
              label="Journey Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Start Date</label>
            <input
              type="date"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Journey Type"
              placeholder="Select a journey type"
              required
              value={journeyType}
              onChange={(e) => setJourneyType(e.target.value)}
              options={[
                { value: "stamping", label: "Stamping" },
                { value: "CTL", label: "CTL" },
                { value: "roll_forming", label: "Roll Forming" },
                { value: "upgrade", label: "Upgrade" },
                { value: "parts", label: "Parts" },
                { value: "service", label: "Service" },
                { value: "retrofit", label: "Retrofit" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="RSM"
              placeholder="Select an RSM"
              required
              value={rsm}
              onChange={(e) => setRsm(e.target.value)}
              options={availableRsms.filter(rsm => rsm && rsm.trim()).map(rsm => ({ 
                value: rsm, 
                label: rsm 
              }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="City"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              required
              value={stateProv}
              onChange={(e) => setStateProv(e.target.value)}
            />
            <Select
              label="Country"
              placeholder="Select a country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: "usa", label: "USA" },
                { value: "canada", label: "Canada" },
                { value: "mexico", label: "Mexico" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Industry"
              placeholder="Select an industry"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={[
                { value: "Contract Stamping", label: "Contract Stamping" },
                { value: "Press OEM", label: "Press OEM" },
                { value: "Construction", label: "Construction" },
                { value: "Energy / Motors / Transformers", label: "Energy / Motors / Transformers" },
                { value: "Integrator", label: "Integrator" },
                { value: "Auto Tier 1 & 2", label: "Auto Tier 1 & 2" },
                { value: "Auto OEM", label: "Auto OEM" },
                { value: "Marine", label: "Marine" },
                { value: "Appliances", label: "Appliances" },
                { value: "Lawn Equipment", label: "Lawn Equipment" },
                { value: "Contract Rollforming", label: "Contract Rollforming" },
                { value: "HVAC / Air Handling", label: "HVAC / Air Handling" },
                { value: "Packaging", label: "Packaging" },
                { value: "Mobile Heavy Equipment / Locomotive", label: "Mobile Heavy Equipment / Locomotive" },
                { value: "Other", label: "Other" },
                { value: "Storage / Lockers / Hardware", label: "Storage / Lockers / Hardware" },
                { value: "Contract Fabricating", label: "Contract Fabricating" },
                { value: "Furniture & Components", label: "Furniture & Components" },
                { value: "Electrical Components / Lighting", label: "Electrical Components / Lighting" },
                { value: "RV / Trailers", label: "RV / Trailers" },
                { value: "Military / Defense", label: "Military / Defense" },
                { value: "Medical", label: "Medical" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Lead Source"
              placeholder="Select a lead source"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              required
              options={[
                { value: "coe_service", label: "Coe Service" },
                { value: "coe_website_contact_form", label: "Coe Website (contact form)" },
                { value: "coe_website_email_inquiry", label: "Coe Website (Email Inquiry)" },
                { value: "cold_call_new_customer", label: "Cold Call - New Customer" },
                { value: "cold_call_prior_customer", label: "Cold Call - Prior Customer" },
                { value: "customer_visit_current_customer", label: "Customer Visit (current customer)" },
                { value: "customer_visit_prior_customer", label: "Customer Visit (prior customer)" },
                { value: "dealer_lead", label: "Dealer Lead" },
                { value: "email_existing_customer", label: "Email - Existing Customer" },
                { value: "email_new_customer", label: "Email - New Customer" },
                { value: "event_fabtech", label: "Event - Fabtech" },
                { value: "event_fema", label: "Event - FEMA" },
                { value: "event_pma", label: "Event - PMA" },
                { value: "event_natm", label: "Event - NATM" },
                { value: "oem_lead", label: "OEM Lead" },
                { value: "other", label: "Other" },
                { value: "phone_in_existing_customer", label: "Phone In - Existing Customer" },
                { value: "phone_in_new_customer", label: "Phone In - New Customer" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Journey Notes</label>
            <textarea
              className="w-full rounded border border-border px-3 py-2 text-sm"
              rows={3}
              placeholder="Enter any relevant notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Action Date</label>
            <input
              type="date"
              className="w-full rounded border border-border px-3 py-2 text-sm"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Equipment Type"
              placeholder="Select an equipment type"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              options={[
                { value: "standard", label: "Standard" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </div>

          <div className="pt-2 border-t">
            <Button
              onClick={handleCreate}
              disabled={!name || !journeyType || !rsm || !city || !stateProv || !country || !industry || !leadSource || loading}
              variant="primary"
              className="w-full"
            >
              {loading ? "Creating..." : "Create Journey"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};