import { useState } from "react";

import type { Employee } from "@/pages/sales/journeys/utils";

import { Button, Input, Modal, Select } from "@/components";
import { AddContactModal } from "@/components/modals/add-contact-modal";
import { useAuth } from "@/contexts/auth.context";
import { useApi } from "@/hooks/use-api";

interface CreateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJourney?: any) => void;
  availableRsms: Employee[];
  companyId?: string;
  companyName?: string;
}

export function CreateJourneyModal({
  isOpen,
  onClose,
  onSuccess,
  availableRsms,
  companyId,
  companyName,
}: CreateJourneyModalProps) {
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
  const [companySearch, setCompanySearch] = useState<string>(companyName || "");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId);
  const [companyResults, setCompanyResults] = useState<any[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState<boolean>(false);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [contactSearch, setContactSearch] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(undefined);
  const [contactResults, setContactResults] = useState<any[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState<boolean>(false);
  const [isSearchingContacts, setIsSearchingContacts] = useState<boolean>(false);
  const [hasSearchedContacts, setHasSearchedContacts] = useState<boolean>(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false);

  const { post, loading, error, get } = useApi();
  const { employee } = useAuth();

  const searchCompanies = async (query: string) => {
    if (query.length < 2) {
      setCompanyResults([]);
      setShowCompanyDropdown(false);
      setHasSearched(false);
      return;
    }

    setIsSearchingCompanies(true);
    setShowCompanyDropdown(true);
    try {
      const params: any = {
        page: 1,
        limit: 5,
        fields: "Company_ID,CustDlrName",
        filter: JSON.stringify({
          filters: [
            { field: "CustDlrName", operator: "contains", value: query },
          ],
        }),
      };

      const results = await get(`/legacy/base/Company`, params);

      if (results) {
        const isApiResponse = results && typeof results === "object" && "data" in results;

        if (isApiResponse) {
          const companiesArray = Array.isArray(results.data) ? results.data : [];
          const mapped = companiesArray.map((company: any) => ({
            ID: company.Company_ID,
            Name: company.CustDlrName,
          }));
          setCompanyResults(mapped);
        }
        else {
          const companiesArray = Array.isArray(results) ? results : [];
          const mapped = companiesArray.map((company: any) => ({
            ID: company.Company_ID,
            Name: company.CustDlrName,
          }));
          setCompanyResults(mapped);
        }
      }
      setHasSearched(true);
    }
    catch (error) {
      console.error("Error searching companies:", error);
      setCompanyResults([]);
      setHasSearched(true);
    }
    finally {
      setIsSearchingCompanies(false);
    }
  };

  const handleCompanySearchChange = (value: string) => {
    setCompanySearch(value);
    setSelectedCompanyId(undefined);
    searchCompanies(value);
  };

  const handleCompanySelect = (company: any) => {
    setCompanySearch(company.Name);
    setSelectedCompanyId(company.ID?.toString());
    setShowCompanyDropdown(false);
    setHasSearched(false);
  };

  const searchContacts = async (query: string) => {
    if (query.length < 2) {
      setContactResults([]);
      setShowContactDropdown(false);
      setHasSearchedContacts(false);
      return;
    }

    setIsSearchingContacts(true);
    setShowContactDropdown(true);
    try {
      const results = await get(`/sales/contacts`, {
        filter: JSON.stringify({
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
          ],
        }),
        limit: 5,
      });

      if (results?.success && Array.isArray(results.data)) {
        setContactResults(results.data);
      }
      else if (Array.isArray(results)) {
        setContactResults(results);
      }
      else {
        setContactResults([]);
      }
      setHasSearchedContacts(true);
    }
    catch (error) {
      console.error("Error searching contacts:", error);
      setContactResults([]);
      setHasSearchedContacts(true);
    }
    finally {
      setIsSearchingContacts(false);
    }
  };

  const handleContactSearchChange = (value: string) => {
    setContactSearch(value);
    setSelectedContactId(undefined);
    searchContacts(value);
  };

  const handleContactSelect = (contact: any) => {
    setContactSearch(`${contact.firstName} ${contact.lastName}`);
    setSelectedContactId(contact.id);
    setShowContactDropdown(false);
    setHasSearchedContacts(false);
  };

  const handleContactAdded = (contact: any) => {
    const firstName = contact?.firstName || contact?.data?.firstName || "";
    const lastName = contact?.lastName || contact?.data?.lastName || "";
    const contactId = contact?.id || contact?.data?.id;

    setContactSearch(`${firstName} ${lastName}`.trim());
    setSelectedContactId(contactId);
    setIsAddContactModalOpen(false);
  };

  const createJourneyContact = async (journeyId: string, contactId: string) => {
    if (!employee?.id) {
      console.error("Employee ID not found, skipping journey contact creation");
      return;
    }

    try {
      const journeyContactData = {
        journeyId,
        contactId,
        isPrimary: true,
        createdById: employee.id,
        updatedById: employee.id,
      };

      await post("/sales/journey-contacts", journeyContactData);
    }
    catch (error) {
      console.error("Error creating journey contact:", error);
      // Don't throw - we still want the journey creation to succeed
    }
  };

  const handleCreate = async () => {
    if (!name || !journeyType || !rsm || !city || !stateProv || !country || !industry || !leadSource) {
      alert("Please fill in all required fields: Journey Name, Journey Type, RSM, City, State, Country, Industry, and Lead Source");
      return;
    }

    try {
      // Map form fields to database field names
      const payload: any = {
        Project_Name: name,
        Journey_Type: journeyType,
        RSM: rsm,
        City: city,
        State_Province: stateProv,
        Country: country,
        Industry: industry,
        Lead_Source: leadSource,
        Journey_Stage: "Lead",
        Target_Account: companySearch || "",
      };

      if (startDate)
        payload.Journey_Start_Date = startDate;
      if (actionDate)
        payload.Action_Date = actionDate;
      if (equipmentType)
        payload.Equipment_Type = equipmentType;
      if (selectedCompanyId)
        payload.Company_ID = Number.parseInt(selectedCompanyId);

      const result = await post("/legacy/std/Journey", payload);

      if (result && result.ID) {
        // If a contact was selected, create the JourneyContact association
        if (selectedContactId) {
          await createJourneyContact(result.ID.toString(), selectedContactId);
        }

        // If notes were provided, create them in the Postgres notes table
        if (notes && notes.trim()) {
          try {
            await post("/core/notes", {
              body: notes.trim(),
              entityId: result.ID.toString(),
              entityType: "journey",
              type: "note",
              createdBy: `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim() || "Unknown",
            });
          }
          catch (error) {
            console.error("Error creating journey note:", error);
            // Don't fail journey creation if note creation fails
          }
        }
        const today = new Date().toISOString().split("T")[0];
        const newJourney = {
          ...result,
          ...payload,
          ID: result.ID,
          id: result.ID,
          CreateDT: result.CreateDT || new Date().toISOString(),
          Action_Date: result.Action_Date || actionDate || today,
          Journey_Start_Date: result.Journey_Start_Date || startDate || today,
          Journey_Value: result.Journey_Value || 0,
          Priority: result.Priority || "C",
          Journey_Status: result.Journey_Status || "Active",
          Quote_Number: result.Quote_Number || "",
          Chance_To_Secure_order: result.Chance_To_Secure_order || null,
          Expected_Decision_Date: result.Expected_Decision_Date || null,
          Quote_Presentation_Date: result.Quote_Presentation_Date || null,
          Date_PO_Received: result.Date_PO_Received || null,
          RSM_Territory: result.RSM_Territory || "",
          Dealer: result.Dealer || "",
          Dealer_Name: result.Dealer_Name || "",
          Dealer_ID: result.Dealer_ID || null,
          Qty_of_Items: result.Qty_of_Items || 0,
        };
        onSuccess?.(newJourney);
        onClose();
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
        setCompanySearch("");
        setSelectedCompanyId(undefined);
        setCompanyResults([]);
        setShowCompanyDropdown(false);
        setHasSearched(false);
        setIsSearchingCompanies(false);
        setContactSearch("");
        setSelectedContactId(undefined);
        setContactResults([]);
        setShowContactDropdown(false);
        setHasSearchedContacts(false);
        setIsSearchingContacts(false);
      }
      else {
        console.error("Journey creation failed:", error);
      }
    }
    catch (error) {
      console.error("Error creating journey:", error);
      alert("Failed to create journey. Please try again.");
    }
  };

  return (
    <>
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
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-sm font-medium text-text">Company</label>
              <input
                type="text"
                className="w-full rounded border border-border px-3 py-2 text-sm"
                placeholder="Search for company or enter new name"
                value={companySearch}
                onChange={e => handleCompanySearchChange(e.target.value)}
                onFocus={() => (companyResults.length > 0 || hasSearched) && setShowCompanyDropdown(true)}
                onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
              />
              {showCompanyDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded shadow-lg max-h-48 overflow-y-auto">
                  {isSearchingCompanies
                    ? (
                        <div className="px-3 py-2 text-sm text-text-muted">
                          Searching...
                        </div>
                      )
                    : companyResults.length > 0
                      ? (
                          companyResults.map(company => (
                            <div
                              key={company.ID}
                              className="px-3 py-2 hover:bg-surface cursor-pointer text-sm"
                              onClick={() => handleCompanySelect(company)}
                            >
                              {company.Name}
                            </div>
                          ))
                        )
                      : hasSearched
                        ? (
                            <div className="px-3 py-2 text-sm text-text-muted">
                              No companies found
                            </div>
                          )
                        : null}
                </div>
              )}
            </div>

            <div className="space-y-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text">Primary Contact</label>
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Create New
                </button>
              </div>
              <input
                type="text"
                className="w-full rounded border border-border px-3 py-2 text-sm"
                placeholder="Search for contact by name"
                value={contactSearch}
                onChange={e => handleContactSearchChange(e.target.value)}
                onFocus={() => (contactResults.length > 0 || hasSearchedContacts) && setShowContactDropdown(true)}
                onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
              />
              {showContactDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded shadow-lg max-h-48 overflow-y-auto">
                  {isSearchingContacts
                    ? (
                        <div className="px-3 py-2 text-sm text-text-muted">
                          Searching...
                        </div>
                      )
                    : contactResults.length > 0
                      ? (
                          contactResults.map(contact => (
                            <div
                              key={contact.id}
                              className="px-3 py-2 hover:bg-surface cursor-pointer text-sm"
                              onClick={() => handleContactSelect(contact)}
                            >
                              <div className="font-medium">
                                {contact.firstName}
                                {" "}
                                {contact.lastName}
                              </div>
                              {contact.email && <div className="text-xs text-text-muted">{contact.email}</div>}
                            </div>
                          ))
                        )
                      : hasSearchedContacts
                        ? (
                            <div className="px-3 py-2 text-sm text-text-muted">
                              No contacts found
                            </div>
                          )
                        : null}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text">Start Date</label>
              <input
                type="date"
                className="w-full rounded border border-border px-3 py-2 text-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Select
                label="Journey Type"
                placeholder="Select a journey type"
                required
                value={journeyType}
                onChange={e => setJourneyType(e.target.value)}
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
                onChange={e => setRsm(e.target.value)}
                options={availableRsms.map(rsm => ({
                  value: rsm.initials,
                  label: `${rsm.name} (${rsm.initials})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="City"
                className="w-full rounded border border-border px-3 py-2 text-sm"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
              />
              <Input
                label="State"
                className="w-full rounded border border-border px-3 py-2 text-sm"
                required
                value={stateProv}
                onChange={e => setStateProv(e.target.value)}
              />
              <Select
                label="Country"
                placeholder="Select a country"
                required
                value={country}
                onChange={e => setCountry(e.target.value)}
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
                onChange={e => setIndustry(e.target.value)}
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
                onChange={e => setLeadSource(e.target.value)}
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
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text">Action Date</label>
              <input
                type="date"
                className="w-full rounded border border-border px-3 py-2 text-sm"
                value={actionDate}
                onChange={e => setActionDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Select
                label="Equipment Type"
                placeholder="Select an equipment type"
                value={equipmentType}
                onChange={e => setEquipmentType(e.target.value)}
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

      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onContactAdded={handleContactAdded}
        companyId={selectedCompanyId}
      />
    </>
  );
}
