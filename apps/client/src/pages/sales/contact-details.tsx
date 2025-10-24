import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Mail, Phone, Calendar, User, MapPin, Edit, UserX, Briefcase, Trash2 } from "lucide-react";
import { PageHeader, Button } from "@/components";
import { DeleteContactModal } from "@/components/modals/delete-contact-modal";
import { formatDate } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { ContactType } from "@/types/enums";

interface EditFormData {
  firstName: string;
  lastName: string;
  title: string;
  type: string;
  phone: string;
  phoneExtension: string;
  email: string;
  addressId: string;
}

const ContactDetails = () => {
  const { id: contactId } = useParams<{ id: string }>();
  const api = useApi();

  const [contactData, setContactData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [availableAddresses, setAvailableAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"details" | "journeys">("details");
  const [journeysData, setJourneysData] = useState<any[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);

  const [contactNotes, setContactNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: "",
    lastName: "",
    title: "",
    type: "",
    phone: "",
    phoneExtension: "",
    email: "",
    addressId: ""
  });

  const getContactTypeName = (type: ContactType | string | null | undefined): string => {
    switch (type) {
      case ContactType.Accounting: return 'Accounting';
      case ContactType.Engineering: return 'Engineering';
      case ContactType.Inactive: return 'Inactive';
      case ContactType.Left_Company: return 'Left Company';
      case ContactType.Parts_Service: return 'Parts/Service';
      case ContactType.Sales: return 'Sales';
      default: return type || 'Unknown';
    }
  };

  const getContactTypeColor = (type: ContactType | string | null | undefined): string => {
    switch (type) {
      case ContactType.Accounting: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ContactType.Engineering: return 'bg-green-100 text-green-800 border-green-200';
      case ContactType.Inactive: return 'bg-gray-100 text-gray-800 border-gray-200';
      case ContactType.Left_Company: return 'bg-red-100 text-red-800 border-red-200';
      case ContactType.Parts_Service: return 'bg-purple-100 text-purple-800 border-purple-200';
      case ContactType.Sales: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const initializeEditForm = (contact: any) => {
    setEditForm({
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      title: contact?.title || "",
      type: contact?.type || "",
      phone: contact?.phone || "",
      phoneExtension: contact?.phoneExtension || "",
      email: contact?.email || "",
      addressId: contact?.addressId || ""
    });
  };

  const handleSave = async () => {
    if (!contactData?.id) return;

    setIsSaving(true);
    try {
      const trimmedData = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        title: editForm.title,
        type: editForm.type,
        phone: editForm.phone,
        phoneExtension: editForm.phoneExtension,
        email: editForm.email,
        addressId: editForm.addressId || null,
        companyId: contactData.companyId,
        isPrimary: contactData.isPrimary,
        legacyCompanyId: contactData.legacyCompanyId,
        createdById: contactData.createdById,
        updatedById: contactData.updatedById,
      };

      const result = await api.patch(`/sales/contacts/${contactData.id}`, trimmedData);
      if (result !== null) {
        // Update local contact data with new values
        const updatedContactData = { ...contactData, ...trimmedData };
        setContactData(updatedContactData);

        // Update address data based on the new addressId
        if (trimmedData.addressId) {
          const selectedAddress = availableAddresses.find((addr: any) =>
            addr.Address_ID == trimmedData.addressId
          );
          setAddressData(selectedAddress || null);
        } else {
          setAddressData(null);
        }

        setIsEditing(false);
      }
    } catch (error: any) {
      console.error("Error updating contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    initializeEditForm(contactData);

    // Reset address data to original
    if (contactData.addressId) {
      const originalAddress = availableAddresses.find((addr: any) => addr.Address_ID == contactData.addressId);
      setAddressData(originalAddress || null);
    } else {
      setAddressData(null);
    }
  };

  const handleEdit = () => {
    initializeEditForm(contactData);
    setIsEditing(true);
  };

  const handleDisableContact = async (type: ContactType) => {
    if (!contactData?.id) return;

    setIsSaving(true);
    try {
      const result = await api.patch(`/sales/contacts/${contactData.id}`, {
        type: type
      });

      if (result !== null) {
        setContactData({ ...contactData, type: type });
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchContactData = async () => {
    if (!contactId) return;

    setLoading(true);
    setError(null);

    try {
      const rawContactResponse = await api.get(`/sales/contacts/${contactId}`);

      if (rawContactResponse) {
        const rawContact = rawContactResponse.data || rawContactResponse;

        // Handle null/undefined contact data
        if (!rawContact) {
          setError('Contact data is null or undefined');
          return;
        }

        setContactData(rawContact);
        initializeEditForm(rawContact);

        // Fetch company name from legacy database
        if (rawContact?.legacyCompanyId) {
          try {
            const companyResponse = await api.get('/legacy/base/Company', {
              filter: JSON.stringify({
                operator: "in",
                field: "Company_ID",
                values: [parseInt(rawContact.legacyCompanyId, 10)]
              }),
              fields: 'Company_ID,CustDlrName',
              limit: 1
            });

            const companies = companyResponse?.data
              ? (Array.isArray(companyResponse.data) ? companyResponse.data : [])
              : (Array.isArray(companyResponse) ? companyResponse : []);

            if (companies.length > 0 && companies[0]?.CustDlrName) {
              setCompanyData({ name: companies[0].CustDlrName });
            }
          } catch (companyError) {
            console.warn("Could not fetch company data:", companyError);
          }

          // Fetch all addresses for the company
          try {
            const addressResponse = await api.get('/legacy/base/Address/filter/custom', {
              Company_ID: rawContact.legacyCompanyId
            });

            console.log('=== ADDRESS DEBUG ===');
            console.log('Raw address response:', addressResponse);

            const addresses = addressResponse?.data
              ? (Array.isArray(addressResponse.data) ? addressResponse.data : [])
              : (Array.isArray(addressResponse) ? addressResponse : []);

            console.log('Extracted addresses array:', addresses);
            console.log('Number of addresses:', addresses.length);

            if (addresses.length > 0) {
              console.log('First address sample:', addresses[0]);
              console.log('Address_ID values:', addresses.map((a: any) => a.Address_ID));

              setAvailableAddresses(addresses);

              // Set the current address data if addressId exists
              console.log('rawContact.addressId:', rawContact.addressId);
              console.log('rawContact.addressId type:', typeof rawContact.addressId);

              if (rawContact.addressId) {
                const currentAddress = addresses.find((addr: any) => {
                  console.log(`Comparing addr.Address_ID (${addr.Address_ID}, type: ${typeof addr.Address_ID}) === rawContact.addressId (${rawContact.addressId}, type: ${typeof rawContact.addressId})`);
                  return addr.Address_ID == rawContact.addressId;
                });
                console.log('Found matching address:', currentAddress);
                if (currentAddress) {
                  setAddressData(currentAddress);
                  console.log('Set addressData to:', currentAddress);
                } else {
                  console.log('No matching address found');
                }
              } else {
                console.log('No addressId on contact');
              }
            } else {
              console.log('No addresses returned from API');
            }
            console.log('=== END ADDRESS DEBUG ===');
          } catch (addressError) {
            console.warn("Could not fetch address data:", addressError);
          }
        }
      } else {
        setError('Failed to load contact data');
      }
    } catch (err) {
      setError(`Error loading contact: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchJourneys = async () => {
    if (!contactId) return;

    setJourneysLoading(true);
    try {
      const journeyContactsResponse = await api.get('/sales/journey-contacts', {
        filter: JSON.stringify({ contactId }),
        limit: 1000
      });

      const journeyContacts = Array.isArray(journeyContactsResponse?.data)
        ? journeyContactsResponse.data
        : [];

      const journeyIds = journeyContacts.map((jc: any) => jc.journeyId).filter(Boolean);

      if (journeyIds.length === 0) {
        setJourneysData([]);
        return;
      }

      const journeysResponse = await api.get('/legacy/base/Journey', {
        filter: JSON.stringify({
          field: 'ID',
          operator: 'in',
          values: journeyIds
        }),
        fields: 'ID,Project_Name,Target_Account,Journey_Stage,Journey_Status,Journey_Start_Date,Expected_Decision_Date,CreateDT,Priority'
      });

      const journeysArray = journeysResponse?.data
        ? journeysResponse.data
        : (Array.isArray(journeysResponse) ? journeysResponse : []);

      setJourneysData(journeysArray);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      setJourneysData([]);
    } finally {
      setJourneysLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, [contactId]);

  useEffect(() => {
    if (activeTab === 'journeys' && journeysData.length === 0 && !journeysLoading) {
      fetchJourneys();
    }
  }, [activeTab, contactId]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!contactId) return;
      setIsLoadingNotes(true);
      try {
        const noteData = await api.get('/core/notes', {
          filter: JSON.stringify({
            entityId: contactId,
            entityType: "contact",
            type: "note"
          }),
          sort: 'createdAt',
          order: 'desc'
        });
        if (noteData?.success && Array.isArray(noteData.data)) {
          setContactNotes(noteData.data);
        }
      } catch (error) {
        console.error('Error fetching contact notes:', error);
        setContactNotes([]);
      } finally {
        setIsLoadingNotes(false);
      }
    };
    fetchNotes();
  }, [contactId]);

  const handleCreateNote = async () => {
    if (!newNoteBody.trim() || !contactId) return;
    setIsCreatingNote(true);
    try {
      const newNote = await api.post('/core/notes', {
        body: newNoteBody.trim(),
        entityId: contactId,
        entityType: "contact",
        type: "note",
        createdBy: "system"
      });
      if (newNote?.success && newNote.data) {
        setContactNotes(prev => [newNote.data, ...prev]);
        setNewNoteBody("");
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body || "");
  };

  const handleSaveNote = async () => {
    if (!editingNoteId || !editingNoteBody.trim()) return;
    setIsSaving(true);
    try {
      const result = await api.patch(`/core/notes/${editingNoteId}`, {
        body: editingNoteBody.trim()
      });
      if (result?.success && result.data) {
        setContactNotes(prev => prev.map(note =>
          note.id === editingNoteId ? result.data : note
        ));
        setEditingNoteId(null);
        setEditingNoteBody("");
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteBody("");
  };

  const handleDeleteNote = (note: any) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsSaving(true);
    try {
      const result = await api.delete(`/core/notes/${noteToDelete.id}`);
      if (result !== null) {
        setContactNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
        setNoteToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading contact details...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  if (!contactId) {
    return (
      <div className="w-full flex flex-1 flex-col">
        <PageHeader
          title="Invalid Contact"
          description="No contact ID provided in the URL."
          goBack
        />
      </div>
    );
  }

  if (!contactData) {
    return (
      <div className="w-full flex flex-1 flex-col">
        <PageHeader
          title="Contact not found"
          description="This contact may have been removed or is unavailable."
          goBack
        />
      </div>
    );
  }

  const fullName = `${contactData?.firstName || ""} ${contactData?.lastName || ""}`.trim() || "Unnamed Contact";
  const companyName = companyData?.name || (contactData?.legacyCompanyId ? `Company ${contactData.legacyCompanyId}` : 'Unknown Company');

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={fullName}
        description={`Contact ID: ${contactData.id} • ${getContactTypeName(contactData.type)} • ${companyName}`}
        goBack
        actions={
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-warning border-warning hover:bg-warning/10"
                >
                  <UserX size={16} />
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="border-b border-border">
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("journeys")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "journeys"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Journeys
          </button>
        </div>
      </div>

      {activeTab === "details" && (
        <div className="p-4 flex flex-1 flex-col gap-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User size={16} className="text-text-muted mt-1" />
                <div className="flex-1">
                  <div className="text-sm text-text-muted mb-1">Name</div>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                        value={editForm.firstName}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length === 0 || value[0] !== ' ') {
                            setEditForm(s => ({ ...s, firstName: value }));
                          }
                        }}
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                        value={editForm.lastName}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length === 0 || value[0] !== ' ') {
                            setEditForm(s => ({ ...s, lastName: value }));
                          }
                        }}
                        placeholder="Last Name"
                      />
                    </div>
                  ) : (
                    <div className="text-text font-medium">{fullName}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Title</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(s => ({ ...s, title: e.target.value }))}
                    placeholder="Contact Title"
                  />
                ) : (
                  <div className="text-text">{contactData.title || "-"}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Type</div>
                {isEditing ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={editForm.type}
                    onChange={(e) => setEditForm(s => ({ ...s, type: e.target.value }))}
                  >
                    <option value="">Select Type</option>
                    <option value={ContactType.Accounting}>Accounting</option>
                    <option value={ContactType.Engineering}>Engineering</option>
                    <option value={ContactType.Inactive}>Inactive</option>
                    <option value={ContactType.Left_Company}>Left Company</option>
                    <option value={ContactType.Parts_Service}>Parts/Service</option>
                    <option value={ContactType.Sales}>Sales</option>
                  </select>
                ) : (
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getContactTypeColor(contactData.type)}`}>
                    {getContactTypeName(contactData.type)}
                  </span>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Contact ID</div>
                <div className="text-text font-mono">{contactData.id}</div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Address ID</div>
                {isEditing && availableAddresses.length > 0 ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text font-mono"
                    value={editForm.addressId}
                    onChange={(e) => {
                      const newAddressId = e.target.value;
                      setEditForm(s => ({ ...s, addressId: newAddressId }));

                      // Update addressData preview
                      const selectedAddress = availableAddresses.find((addr: any) => addr.Address_ID == newAddressId);
                      if (selectedAddress) {
                        setAddressData(selectedAddress);
                      } else {
                        setAddressData(null);
                      }
                    }}
                  >
                    <option value="">No Address</option>
                    {availableAddresses.map((addr: any) => (
                      <option key={addr.Address_ID} value={addr.Address_ID}>
                        {addr.Address_ID} - {[addr.Address1, addr.City, addr.State].filter(Boolean).join(', ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-text font-mono">{contactData.addressId || "-"}</div>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Company Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-text-muted" />
                <div>
                  <div className="text-sm text-text-muted">Company</div>
                  <Link
                    to={`/sales/companies/${contactData.legacyCompanyId}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {companyName}
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Company ID</div>
                <div className="text-text font-mono">{contactData.legacyCompanyId}</div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Contact Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-text-muted mt-1" />
                <div className="flex-1">
                  <div className="text-sm text-text-muted">Phone</div>
                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        className="col-span-2 rounded border border-border px-2 py-1 text-sm bg-background text-text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(s => ({ ...s, phone: e.target.value }))}
                        placeholder="Phone number"
                      />
                      <input
                        type="text"
                        className="rounded border border-border px-2 py-1 text-sm bg-background text-text"
                        value={editForm.phoneExtension}
                        onChange={(e) => setEditForm(s => ({ ...s, phoneExtension: e.target.value }))}
                        placeholder="Ext"
                      />
                    </div>
                  ) : contactData.phone ? (
                    <Link to={`tel:${contactData.phone}`} className="text-primary hover:underline">
                      {contactData.phone}
                      {contactData.phoneExtension && ` x${contactData.phoneExtension}`}
                    </Link>
                  ) : (
                    <div className="text-text">-</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={16} className="text-text-muted mt-1" />
                <div className="flex-1">
                  <div className="text-sm text-text-muted">Email</div>
                  {isEditing ? (
                    <input
                      type="email"
                      className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                      value={editForm.email}
                      onChange={(e) => setEditForm(s => ({ ...s, email: e.target.value }))}
                      placeholder="Email address"
                    />
                  ) : contactData.email ? (
                    <Link to={`mailto:${contactData.email}`} className="text-primary hover:underline">
                      {contactData.email}
                    </Link>
                  ) : (
                    <div className="text-text">-</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Address Information</h3>
          {addressData ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-text-muted mt-1" />
                <div className="flex-1">
                  <div className="text-sm text-text-muted">Address</div>
                  <div className="text-text">
                    {addressData.Address1 && (
                      <div>{addressData.Address1}</div>
                    )}
                    {addressData.Address2 && (
                      <div>{addressData.Address2}</div>
                    )}
                    {addressData.Address3 && (
                      <div>{addressData.Address3}</div>
                    )}
                    {(addressData.City || addressData.State || addressData.ZipCode) && (
                      <div>
                        {[addressData.City, addressData.State, addressData.ZipCode].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {addressData.Country && addressData.Country !== 'USA' && (
                      <div>{addressData.Country}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : contactData.addressId ? (
            <div className="text-text-muted text-sm">Address data not available</div>
          ) : (
            <div className="text-text-muted text-sm">No address assigned</div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-foreground rounded shadow-sm border p-4 flex flex-col" style={{ maxHeight: '500px' }}>
          <h3 className="text-lg font-semibold text-text mb-4">Notes</h3>

          <div className="flex gap-2 mb-4">
            <textarea
              className="flex-1 p-2 bg-background rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={newNoteBody}
              onChange={(e) => setNewNoteBody(e.target.value)}
              placeholder="Enter a new note..."
              rows={2}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNote}
              disabled={isCreatingNote || !newNoteBody.trim()}
            >
              {isCreatingNote ? "Adding..." : "Add Note"}
            </Button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
            {isLoadingNotes ? (
              <div className="text-sm text-text-muted text-center py-4">Loading notes...</div>
            ) : contactNotes.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-4">No notes yet</div>
            ) : (
              contactNotes.map((note) => (
                <div key={note.id} className="p-3 bg-background rounded border border-border">
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 bg-surface rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editingNoteBody}
                        onChange={(e) => setEditingNoteBody(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveNote}
                          disabled={isSaving || !editingNoteBody.trim()}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="secondary-outline"
                          size="sm"
                          onClick={handleCancelEditNote}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-text">
                            {note.createdBy || "Unknown"}
                          </span>
                          <span className="text-xs text-text-muted">
                            {note.createdAt ? new Date(note.createdAt).toLocaleString() : "N/A"}
                          </span>
                          {note.updatedAt && note.updatedAt !== note.createdAt && (
                            <span className="text-xs text-text-muted">
                              Updated: {new Date(note.updatedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            disabled={isSaving || editingNoteId !== null}
                            className="!p-1 !h-6 !w-6"
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={() => handleDeleteNote(note)}
                            disabled={isSaving || editingNoteId !== null}
                            className="!p-1 !h-6 !w-6 border-red-300 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 size={12} className="text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-text whitespace-pre-wrap">
                        {note.body || ""}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Record Information */}
        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Record Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-text-muted" />
              <div>
                <div className="text-sm text-text-muted">Created</div>
                <div className="text-text">
                  {contactData.createdAt ? formatDate(contactData.createdAt) : "Unknown"}
                </div>
              </div>
            </div>

            {contactData.updatedAt && (
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-text-muted" />
                <div>
                  <div className="text-sm text-text-muted">Last Modified</div>
                  <div className="text-text">
                    {formatDate(contactData.updatedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {activeTab === "journeys" && (
        <div className="p-4 flex flex-1 flex-col gap-6">
          {journeysLoading ? (
            <div className="flex justify-center items-center h-64">Loading journeys...</div>
          ) : journeysData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted">
              <Briefcase size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No Journeys</p>
              <p className="text-sm">This contact is not linked to any journeys.</p>
            </div>
          ) : (
            <div className="bg-foreground rounded shadow-sm border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-text">Journey</th>
                      <th className="text-left p-4 text-sm font-semibold text-text">Stage</th>
                      <th className="text-left p-4 text-sm font-semibold text-text">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-text">Priority</th>
                      <th className="text-left p-4 text-sm font-semibold text-text">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journeysData.map((journey: any) => {
                      const displayName = journey?.Project_Name ||
                        journey?.Target_Account ||
                        `Journey #${journey?.ID || 'Unknown'}`;

                      const journeyStage = journey?.Journey_Stage || '-';
                      const journeyStatus = journey?.Journey_Status || 'Active';
                      const priority = journey?.Priority || '-';
                      const startDate = journey?.Journey_Start_Date || journey?.Expected_Decision_Date || journey?.CreateDT;

                      return (
                        <tr key={journey?.ID || Math.random()} className="border-b border-border last:border-b-0 hover:bg-background/50">
                          <td className="p-4">
                            {journey?.ID ? (
                              <Link
                                to={`/sales/pipeline/${journey.ID}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {displayName}
                              </Link>
                            ) : (
                              <div className="font-medium text-text">{displayName}</div>
                            )}
                            {journey?.Target_Account && journey?.Target_Account !== displayName && (
                              <div className="text-xs text-text-muted mt-1">
                                {journey.Target_Account}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-text-muted">{journeyStage}</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              journeyStatus?.toLowerCase().includes('active') ? 'bg-success/20 text-success' :
                              journeyStatus?.toLowerCase().includes('complete') ? 'bg-info/20 text-info' :
                              journeyStatus?.toLowerCase().includes('cancel') ? 'bg-error/20 text-error' :
                              journeyStatus?.toLowerCase().includes('lost') ? 'bg-error/20 text-error' :
                              journeyStatus?.toLowerCase().includes('won') ? 'bg-success/20 text-success' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {journeyStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              priority === 'A' ? 'bg-error/20 text-error' :
                              priority === 'B' ? 'bg-warning/20 text-warning' :
                              priority === 'C' ? 'bg-info/20 text-info' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-text-muted">
                              {startDate ? formatDate(startDate) : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <DeleteContactModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDisableContact}
        contact={contactData}
        isUpdating={isSaving}
      />

      {/* Delete Note Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-foreground rounded shadow-lg border p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Delete Note</h3>
            <p className="text-sm text-text-muted mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => setNoteToDelete(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmDeleteNote}
                disabled={isSaving}
                className="bg-error hover:bg-error/90"
              >
                {isSaving ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetails;