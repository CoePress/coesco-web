import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Modal } from "@/components";
import { useApi } from "@/hooks/use-api";

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdded?: (address: any) => void;
  companyId?: string | number;
}

export function AddAddressModal({
  isOpen,
  onClose,
  onAddressAdded,
  companyId,
}: AddAddressModalProps) {
  const api = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Company_ID: companyId || 0,
    AddressName: "",
    Address1: "",
    Address2: "",
    Address3: "",
    City: "",
    State: "",
    Country: "USA",
    ZipCode: "",
    PhoneNumber: "",
    FaxPhoneNum: "",
    CanShip: 0,
    CanBill: 0,
    Notes: "",
    BillToNum: 0,
    BillToId: 0,
    ShipInstr: "",
    Directions: "",
    OriginalVia: "",
    EmailInvoiceTo: "",
    SystemNotes: "",
  });

  // Zip code lookup states
  const [zipLookupResults, setZipLookupResults] = useState<{
    city: string[];
    stateProv: string[];
    country: string[];
  }>({ city: [], stateProv: [], country: [] });
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);

  const lookupZipCode = async (zipCode: string) => {
    if (!zipCode || zipCode.length < 5) {
      setZipLookupResults({ city: [], stateProv: [], country: [] });
      return;
    }

    try {
      setIsLookingUpZip(true);

      const zipData = await api.get(`/legacy/std/ZipCode/filter/custom`, {
        filterField: "ZipCode",
        filterValue: zipCode,
        limit: 100,
      });

      if (zipData && Array.isArray(zipData) && zipData.length > 0) {
        // Extract unique values for each field
        const cities = [
          ...new Set(zipData.map(item => item.City).filter(Boolean)),
        ];
        const stateProvs = [
          ...new Set(zipData.map(item => item.StateProv).filter(Boolean)),
        ];
        const countries = [
          ...new Set(zipData.map(item => item.Country).filter(Boolean)),
        ];

        const results = {
          city: cities,
          stateProv: stateProvs,
          country: countries,
        };

        setZipLookupResults(results);

        // Auto-populate fields - single option locks field, multiple options default to first
        setFormData(prev => ({
          ...prev,
          City: cities.length >= 1 ? cities[0] : prev.City,
          State: stateProvs.length >= 1 ? stateProvs[0] : prev.State,
          Country: countries.length >= 1 ? countries[0] : prev.Country,
        }));
      }
      else {
        setZipLookupResults({ city: [], stateProv: [], country: [] });
      }
    }
    catch (error) {
      console.error("Error looking up zip code:", error);
      setZipLookupResults({ city: [], stateProv: [], country: [] });
    }
    finally {
      setIsLookingUpZip(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Trigger zip code lookup when zip code changes
    if (field === "ZipCode") {
      lookupZipCode(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const resetForm = () => {
    setFormData({
      Company_ID: companyId || 0,
      AddressName: "",
      Address1: "",
      Address2: "",
      Address3: "",
      City: "",
      State: "",
      Country: "USA",
      ZipCode: "",
      PhoneNumber: "",
      FaxPhoneNum: "",
      CanShip: 0,
      CanBill: 0,
      Notes: "",
      BillToNum: 0,
      BillToId: 0,
      ShipInstr: "",
      Directions: "",
      OriginalVia: "",
      EmailInvoiceTo: "",
      SystemNotes: "",
    });
    setZipLookupResults({ city: [], stateProv: [], country: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const companyAddresses = await api.get("/legacy/std/Address/filter/custom", {
        filterField: "Company_ID",
        filterValue: companyId,
        limit: 1000,
      });

      let maxAddressId = 0;
      if (companyAddresses && Array.isArray(companyAddresses) && companyAddresses.length > 0) {
        maxAddressId = Math.max(...companyAddresses.map((addr: any) => addr.Address_ID || 0));
      }

      const nextAddressId = maxAddressId + 1;

      const addressDataToSave = {
        ...formData,
        Company_ID: Number.parseInt(String(companyId)) || 0,
        Address_ID: nextAddressId,
      };

      await api.post("/legacy/std/Address", addressDataToSave);

      if (api.success && !api.error) {
        // Reset form
        resetForm();

        // Notify parent component
        if (onAddressAdded) {
          onAddressAdded(addressDataToSave);
        }

        onClose();
      }
      else {
        console.error("Failed to create address:", api.error);
        alert("Failed to create address. Please check the console for details.");
      }
    }
    catch (error) {
      console.error("Error creating address:", error);
      alert("Error creating address. Please try again.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Update company ID when prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, Company_ID: companyId || 0 }));
  }, [companyId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add New Address"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Address Name
            </label>
            <input
              type="text"
              value={formData.AddressName}
              onChange={e => handleFieldChange("AddressName", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="e.g., Main Office, Warehouse"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              ZIP Code *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.ZipCode}
                onChange={e => handleFieldChange("ZipCode", e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary pr-8"
                placeholder="Enter ZIP code to auto-populate"
                required
              />
              {isLookingUpZip && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              value={formData.Address1}
              onChange={e => handleFieldChange("Address1", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Street address"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.Address2}
              onChange={e => handleFieldChange("Address2", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Suite, unit, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Address Line 3
            </label>
            <input
              type="text"
              value={formData.Address3}
              onChange={e => handleFieldChange("Address3", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Additional address info"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              City
            </label>
            {zipLookupResults.city.length > 1
              ? (
                  <select
                    value={formData.City}
                    onChange={e => handleFieldChange("City", e.target.value)}
                    className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {zipLookupResults.city.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                )
              : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.City}
                      className="w-full rounded border border-border px-3 py-2 pr-8 text-sm bg-surface text-text-muted focus:outline-none cursor-not-allowed"
                      placeholder="City"
                      readOnly
                      title="City is automatically populated from ZIP code"
                    />
                    <Lock size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  </div>
                )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              State/Province
            </label>
            {zipLookupResults.stateProv.length > 1
              ? (
                  <select
                    value={formData.State}
                    onChange={e => handleFieldChange("State", e.target.value)}
                    className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {zipLookupResults.stateProv.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                )
              : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.State}
                      className="w-full rounded border border-border px-3 py-2 pr-8 text-sm bg-surface text-text-muted focus:outline-none cursor-not-allowed"
                      placeholder="State or Province"
                      readOnly
                      title="State is automatically populated from ZIP code"
                    />
                    <Lock size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  </div>
                )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Country
            </label>
            {zipLookupResults.country.length > 1
              ? (
                  <select
                    value={formData.Country}
                    onChange={e => handleFieldChange("Country", e.target.value)}
                    className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {zipLookupResults.country.map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                )
              : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.Country}
                      className="w-full rounded border border-border px-3 py-2 pr-8 text-sm bg-surface text-text-muted focus:outline-none cursor-not-allowed"
                      placeholder="Country"
                      readOnly
                      title="Country is automatically populated from ZIP code"
                    />
                    <Lock size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  </div>
                )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.PhoneNumber}
              onChange={e => handleFieldChange("PhoneNumber", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Fax Number
            </label>
            <input
              type="tel"
              value={formData.FaxPhoneNum}
              onChange={e => handleFieldChange("FaxPhoneNum", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Fax number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Invoice Email
            </label>
            <input
              type="email"
              value={formData.EmailInvoiceTo}
              onChange={e => handleFieldChange("EmailInvoiceTo", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Email for invoices"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Bill To Number
            </label>
            <input
              type="number"
              value={formData.BillToNum || ""}
              onChange={e => handleFieldChange("BillToNum", Number.parseInt(e.target.value) || 0)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Bill to number"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              checked={formData.CanShip === 1}
              onChange={e => handleFieldChange("CanShip", e.target.checked ? 1 : 0)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>Can Ship</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              checked={formData.CanBill === 1}
              onChange={e => handleFieldChange("CanBill", e.target.checked ? 1 : 0)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>Can Bill</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Notes
          </label>
          <textarea
            value={formData.Notes}
            onChange={e => handleFieldChange("Notes", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
            rows={3}
            placeholder="Additional notes"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Shipping Instructions
            </label>
            <textarea
              value={formData.ShipInstr}
              onChange={e => handleFieldChange("ShipInstr", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              rows={2}
              placeholder="Special shipping instructions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Directions
            </label>
            <textarea
              value={formData.Directions}
              onChange={e => handleFieldChange("Directions", e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              rows={2}
              placeholder="Directions to this address"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary-outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max px-3 py-1.5 border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Address"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
