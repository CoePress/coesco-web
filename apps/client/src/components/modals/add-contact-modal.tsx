import { useState, useEffect } from "react";
import { Modal, Button } from "@/components";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { ContactType } from "@/types/enums";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded?: (contact: any) => void;
  companyId?: string | number;
  addressId?: string | number;
  journeyId?: string;
  showPrimaryOption?: boolean;
}

export const AddContactModal = ({
  isOpen,
  onClose,
  onContactAdded,
  companyId,
  addressId,
  journeyId,
  showPrimaryOption = false
}: AddContactModalProps) => {
  const api = useApi();
  const { employee } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "search">("create");
  const [isPrimary, setIsPrimary] = useState(false);

  const [formData, setFormData] = useState({
    legacyCompanyId: companyId || "",
    addressId: addressId || "",
    firstName: "",
    lastName: "",
    type: "",
    phone: "",
    phoneExtension: "",
    email: "",
    title: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  useEffect(() => {
    if (companyId || addressId) {
      setFormData(prev => ({
        ...prev,
        legacyCompanyId: companyId || prev.legacyCompanyId,
        addressId: addressId || prev.addressId,
      }));
    }
  }, [companyId, addressId]);

  useEffect(() => {
    if (!searchQuery.trim() || activeTab !== "search") {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.get("/sales/contacts", {
          filter: JSON.stringify({
            OR: [
              { firstName: { contains: searchQuery, mode: "insensitive" } },
              { lastName: { contains: searchQuery, mode: "insensitive" } }
            ]
          }),
          limit: 10
        });

        if (results?.success && Array.isArray(results.data)) {
          const contactsWithCompanyNames = await Promise.all(
            results.data.map(async (contact: any) => {
              if (contact.legacyCompanyId) {
                try {
                  const companyData = await api.get(`/legacy/std/Company/${contact.legacyCompanyId}`);
                  return {
                    ...contact,
                    companyName: companyData?.CustDlrName || null
                  };
                } catch (error) {
                  console.error(`Error fetching company for contact ${contact.id}:`, error);
                  return contact;
                }
              }
              return contact;
            })
          );
          setSearchResults(contactsWithCompanyNames);
        }
      } catch (error) {
        console.error("Error searching contacts:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const DUMMY_LEGACY_COMPANY_UUID = '00000000-0000-0000-0000-000000000000';

      const trimmedData = {
        companyId: companyId || DUMMY_LEGACY_COMPANY_UUID,
        legacyCompanyId: formData.legacyCompanyId,
        addressId: formData.addressId || null,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        type: formData.type,
        phone: formData.phone,
        phoneExtension: formData.phoneExtension,
        email: formData.email,
        title: formData.title,
        isPrimary: false,
      };

      const newContact = await api.post("/sales/contacts", trimmedData);

      if (newContact?.data) {
        if (journeyId) {
          await createJourneyContact(newContact.data.id);
        }

        resetForm();

        if (onContactAdded) {
          onContactAdded(newContact.data);
        }

        onClose();
      } else {
        alert("Failed to create contact. Please try again.");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error creating contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkContact = async () => {
    if (!selectedContact || !journeyId) return;

    setIsSubmitting(true);
    try {
      await createJourneyContact(selectedContact.id);

      resetForm();

      if (onContactAdded) {
        onContactAdded(selectedContact);
      }

      onClose();
    } catch (error) {
      console.error("Error linking contact:", error);
      alert("Error linking contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createJourneyContact = async (contactId: string) => {
    if (!employee?.id) {
      throw new Error("Employee ID not found");
    }

    const journeyContactData = {
      journeyId: journeyId!,
      contactId,
      isPrimary,
      createdById: employee.id,
      updatedById: employee.id,
    };

    const result = await api.post("/sales/journey-contacts", journeyContactData);

    if (!result) {
      throw new Error("Failed to create journey contact");
    }

    return result;
  };

  const resetForm = () => {
    setFormData({
      legacyCompanyId: companyId || "",
      addressId: addressId || "",
      firstName: "",
      lastName: "",
      type: "",
      phone: "",
      phoneExtension: "",
      email: "",
      title: "",
    });
    setSearchQuery("");
    setSearchResults([]);
    setSelectedContact(null);
    setIsPrimary(false);
    setActiveTab("create");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add Contact"
      size="md"
    >
      {journeyId && (
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text"
            }`}
          >
            Create New
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "search"
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text"
            }`}
          >
            Search Existing
          </button>
        </div>
      )}

      {activeTab === "create" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              First Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length === 0 || value[0] !== ' ') {
                  setFormData(prev => ({ ...prev, firstName: value }));
                }
              }}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Last Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length === 0 || value[0] !== ' ') {
                  setFormData(prev => ({ ...prev, lastName: value }));
                }
              }}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={100}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Contact Type <span className="text-error">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Select Type</option>
              <option value={ContactType.Accounting}>Accounting</option>
              <option value={ContactType.Engineering}>Engineering</option>
              <option value={ContactType.Sales}>Sales</option>
              <option value={ContactType.Parts_Service}>Parts/Service</option>
              <option value={ContactType.Inactive}>Inactive</option>
              <option value={ContactType.Left_Company}>Left Company</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={50}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Phone Extension
            </label>
            <input
              type="text"
              value={formData.phoneExtension}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneExtension: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Address ID
            </label>
            <input
              type="text"
              value={formData.addressId}
              onChange={(e) => setFormData(prev => ({ ...prev, addressId: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {showPrimaryOption && journeyId && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="text-primary focus:ring-primary"
            />
            <label htmlFor="isPrimary" className="text-sm text-text">
              Set as Primary Contact
            </label>
          </div>
        )}

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
            {isSubmitting ? "Creating..." : "Create Contact"}
          </button>
        </div>
      </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Search by Name
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter first or last name..."
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {isSearching && (
            <div className="text-center py-4 text-text-muted">
              Searching...
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? "border-primary bg-gray"
                      : "border-border hover:bg-gray"
                  }`}
                >
                  <div className="font-medium text-text">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <div className="text-xs text-text-muted">
                    {contact.companyName && <div>Company: {contact.companyName}</div>}
                    {contact.email && <div>Email: {contact.email}</div>}
                    {contact.phone && <div>Phone: {contact.phone}</div>}
                    {contact.type && <div>Type: {contact.type}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-4 text-text-muted">
              No contacts found
            </div>
          )}

          {showPrimaryOption && journeyId && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimarySearch"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="text-primary focus:ring-primary"
              />
              <label htmlFor="isPrimarySearch" className="text-sm text-text">
                Set as Primary Contact
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary-outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLinkContact}
              disabled={isSubmitting || !selectedContact}
            >
              {isSubmitting ? "Linking..." : "Link Contact"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};