import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Mail, Phone, Globe, Calendar, User, MapPin, Edit, Trash2 } from "lucide-react";
import { PageHeader, Button } from "@/components";
import { formatDate } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { ContactType } from "@/types/enums";

interface EditFormData {
  FirstName: string;
  LastName: string;
  ConTitle: string;
  Type: string;
  PhoneNumber: string;
  PhoneExt: string;
  Email: string;
  Website: string;
  FaxPhoneNum: string;
  AltPhone: string;
  AltDesc: string;
  Notes: string;
  MoreAddress: string;
  Address_ID: string;
}

const ContactDetails = () => {
  const { id: contactId } = useParams<{ id: string }>();
  const [contactData, setContactData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [availableAddresses, setAvailableAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    FirstName: "",
    LastName: "",
    ConTitle: "",
    Type: "",
    PhoneNumber: "",
    PhoneExt: "",
    Email: "",
    Website: "",
    FaxPhoneNum: "",
    AltPhone: "",
    AltDesc: "",
    Notes: "",
    MoreAddress: "",
    Address_ID: ""
  });
  
  const api = useApi();

  const getContactTypeName = (type: ContactType | string | null | undefined): string => {
    switch (type?.toUpperCase()) {
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
    switch (type?.toUpperCase()) {
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
      FirstName: contact?.FirstName || "",
      LastName: contact?.LastName || "",
      ConTitle: contact?.ConTitle || "",
      Type: contact?.Type || "",
      PhoneNumber: contact?.PhoneNumber || "",
      PhoneExt: contact?.PhoneExt || "",
      Email: contact?.Email || "",
      Website: contact?.Website || "",
      FaxPhoneNum: contact?.FaxPhoneNum || "",
      AltPhone: contact?.AltPhone || "",
      AltDesc: contact?.AltDesc || "",
      Notes: contact?.Notes || "",
      MoreAddress: contact?.MoreAddress || "",
      Address_ID: contact?.Address_ID || ""
    });
  };

  const handleSave = async () => {
    if (!contactData?.Cont_Id || !contactData?.Company_ID) return;

    setIsSaving(true);
    try {
      const trimmedData = {
        ...editForm,
        FirstName: editForm.FirstName.trim(),
        LastName: editForm.LastName.trim(),
      };

      const result = await api.patch(`/legacy/std/Contacts/filter/custom?Cont_Id=${contactData.Cont_Id}&Company_ID=${contactData.Company_ID}`, trimmedData);
      if (result !== null) {
        // Update local contact data with new values
        const updatedContactData = { ...contactData, ...trimmedData };
        setContactData(updatedContactData);

        // Update address data based on the new Address_ID
        if (trimmedData.Address_ID) {
          const selectedAddress = availableAddresses.find((addr: any) =>
            String(addr.Address_ID) === String(trimmedData.Address_ID)
          );
          setAddressData(selectedAddress || null);
        } else {
          setAddressData(null);
        }

        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    initializeEditForm(contactData);

    // Reset address data to original
    if (contactData.Address_ID) {
      const originalAddress = availableAddresses.find((addr: any) => addr.Address_ID === contactData.Address_ID);
      setAddressData(originalAddress || null);
    } else {
      setAddressData(null);
    }
  };

  const handleEdit = () => {
    initializeEditForm(contactData);
    setIsEditing(true);
  };

  const handleMakeInactive = async () => {
    if (!contactData?.Cont_Id || !contactData?.Company_ID) return;

    setIsSaving(true);
    try {
      const result = await api.patch(`/legacy/std/Contacts/filter/custom?Cont_Id=${contactData.Cont_Id}&Company_ID=${contactData.Company_ID}`, {
        Type: ContactType.Inactive
      });
      
      if (result !== null) {
        setContactData({ ...contactData, Type: ContactType.Inactive });
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error making contact inactive:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contactData?.Cont_Id || !contactData?.Company_ID) return;

    setIsSaving(true);
    try {
      const result = await api.delete(`/legacy/std/Contacts/filter/custom`, {
        params: {
          Cont_Id: contactData.Cont_Id,
          Company_ID: contactData.Company_ID
        }
      });
      
      if (result !== null) {
        // Navigate back to the company page after successful deletion
        window.history.back();
      } else {
        alert('Failed to delete contact. Please try again.');
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert('Error deleting contact. Please try again.');
    } finally {
      setIsSaving(false);
      setShowDeleteModal(false);
    }
  };

  const fetchContactData = async () => {
    if (!contactId) return;

    setLoading(true);
    setError(null);

    try {
      // Parse composite ID format: "companyId_contId"
      const parts = contactId.includes('_') ? contactId.split('_') : [contactId];
      const expectedCompanyId = parts.length === 2 ? parts[0] : null;
      const actualContactId = parts.length === 2 ? parts[1] : parts[0];

      const queryParams: Record<string, string> = {
        Cont_Id: actualContactId
      };

      if (expectedCompanyId) {
        queryParams.Company_ID = expectedCompanyId;
      }

      const rawContactResponse = await api.get('/legacy/std/Contacts/filter/custom', queryParams);
      
      if (rawContactResponse) {
        // Handle response format - custom filter always returns array
        const rawContact = Array.isArray(rawContactResponse) 
          ? rawContactResponse[0] 
          : rawContactResponse;
        
        // Handle null/undefined contact data
        if (!rawContact) {
          setError('Contact data is null or undefined');
          return;
        }
        
        setContactData(rawContact);
        initializeEditForm(rawContact);
        
        // Fetch company data if we have a Company_ID
        if (rawContact?.Company_ID) {
          try {
            const companyRaw = await api.get(`/legacy/base/Company/${rawContact.Company_ID}`);
            if (companyRaw) {
              setCompanyData(companyRaw);
            }
          } catch (companyError) {
            console.warn("Could not fetch company data:", companyError);
          }
        }

        // Fetch all addresses for the company
        if (rawContact?.Company_ID) {
          try {
            const allAddresses = await api.get('/legacy/base/Address/filter/custom', {
              Company_ID: rawContact.Company_ID
            });

            if (allAddresses && allAddresses.length > 0) {
              setAvailableAddresses(allAddresses);

              // Set the current address data if Address_ID exists
              if (rawContact.Address_ID) {
                const currentAddress = allAddresses.find((addr: any) => addr.Address_ID === rawContact.Address_ID);
                if (currentAddress) {
                  setAddressData(currentAddress);
                }
              }
            }
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

  useEffect(() => {
    fetchContactData();
  }, [contactId]);

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

  const fullName = `${contactData?.FirstName || ""} ${contactData?.LastName || ""}`.trim() || "Unnamed Contact";
  const companyName = companyData?.CustDlrName || (contactData?.Company_ID ? `Company ${contactData.Company_ID}` : 'Unknown Company');

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={fullName}
        description={`Contact ID: ${contactData.Cont_Id} • ${getContactTypeName(contactData.Type)} • ${companyName}`}
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
                  className="text-error border-error hover:bg-error/10"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        }
      />
      
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
                        value={editForm.FirstName}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length === 0 || value[0] !== ' ') {
                            setEditForm(s => ({ ...s, FirstName: value }));
                          }
                        }}
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                        value={editForm.LastName}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length === 0 || value[0] !== ' ') {
                            setEditForm(s => ({ ...s, LastName: value }));
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
                    value={editForm.ConTitle}
                    onChange={(e) => setEditForm(s => ({ ...s, ConTitle: e.target.value }))}
                    placeholder="Contact Title"
                  />
                ) : (
                  <div className="text-text">{contactData.ConTitle || "-"}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Type</div>
                {isEditing ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={editForm.Type}
                    onChange={(e) => setEditForm(s => ({ ...s, Type: e.target.value }))}
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
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getContactTypeColor(contactData.Type)}`}>
                    {getContactTypeName(contactData.Type)}
                  </span>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Contact ID</div>
                <div className="text-text font-mono">{contactData.Cont_Id}</div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Address ID</div>
                {isEditing && availableAddresses.length > 0 ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text font-mono"
                    value={editForm.Address_ID}
                    onChange={(e) => {
                      const newAddressId = e.target.value;
                      setEditForm(s => ({ ...s, Address_ID: newAddressId }));

                      // Update addressData preview
                      const selectedAddress = availableAddresses.find((addr: any) => addr.Address_ID === newAddressId);
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
                  <div className="text-text font-mono">{contactData.Address_ID || "-"}</div>
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
                    to={`/sales/companies/${contactData.Company_ID}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {companyName}
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Company ID</div>
                <div className="text-text font-mono">{contactData.Company_ID}</div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Additional Address</div>
                {isEditing ? (
                  <textarea
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text resize-none"
                    value={editForm.MoreAddress}
                    onChange={(e) => setEditForm(s => ({ ...s, MoreAddress: e.target.value }))}
                    placeholder="Additional address information"
                    rows={2}
                  />
                ) : (
                  <div className="text-text">{contactData.MoreAddress || "-"}</div>
                )}
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
            ) : contactData.Address_ID ? (
              <div className="text-text-muted text-sm">Address data not available</div>
            ) : (
              <div className="text-text-muted text-sm">No address assigned</div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Contact Details */}
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
                        value={editForm.PhoneNumber}
                        onChange={(e) => setEditForm(s => ({ ...s, PhoneNumber: e.target.value }))}
                        placeholder="Phone number"
                      />
                      <input
                        type="text"
                        className="rounded border border-border px-2 py-1 text-sm bg-background text-text"
                        value={editForm.PhoneExt}
                        onChange={(e) => setEditForm(s => ({ ...s, PhoneExt: e.target.value }))}
                        placeholder="Ext"
                      />
                    </div>
                  ) : contactData.PhoneNumber ? (
                    <Link to={`tel:${contactData.PhoneNumber}`} className="text-primary hover:underline">
                      {contactData.PhoneNumber}
                      {contactData.PhoneExt && ` x${contactData.PhoneExt}`}
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
                      value={editForm.Email}
                      onChange={(e) => setEditForm(s => ({ ...s, Email: e.target.value }))}
                      placeholder="Email address"
                    />
                  ) : contactData.Email ? (
                    <Link to={`mailto:${contactData.Email}`} className="text-primary hover:underline">
                      {contactData.Email}
                    </Link>
                  ) : (
                    <div className="text-text">-</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe size={16} className="text-text-muted mt-1" />
                <div className="flex-1">
                  <div className="text-sm text-text-muted">Website</div>
                  {isEditing ? (
                    <input
                      type="url"
                      className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                      value={editForm.Website}
                      onChange={(e) => setEditForm(s => ({ ...s, Website: e.target.value }))}
                      placeholder="Website URL"
                    />
                  ) : contactData.Website ? (
                    <Link to={contactData.Website} target="_blank" className="text-primary hover:underline">
                      {contactData.Website}
                    </Link>
                  ) : (
                    <div className="text-text">-</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Fax</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={editForm.FaxPhoneNum}
                    onChange={(e) => setEditForm(s => ({ ...s, FaxPhoneNum: e.target.value }))}
                    placeholder="Fax number"
                  />
                ) : (
                  <div className="text-text">{contactData.FaxPhoneNum || "-"}</div>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Contact Information */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Alternative Contact</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-text-muted">Alternative Phone</div>
                {isEditing ? (
                  <textarea
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text resize-none"
                    value={editForm.AltPhone}
                    onChange={(e) => setEditForm(s => ({ ...s, AltPhone: e.target.value }))}
                    placeholder="Alternative phone numbers"
                    rows={3}
                  />
                ) : contactData.AltPhone ? (
                  <div className="text-text whitespace-pre-wrap bg-surface rounded p-2 text-sm">
                    {contactData.AltPhone}
                  </div>
                ) : (
                  <div className="text-text-muted text-sm">No alternative phone numbers</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Description</div>
                {isEditing ? (
                  <textarea
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text resize-none"
                    value={editForm.AltDesc}
                    onChange={(e) => setEditForm(s => ({ ...s, AltDesc: e.target.value }))}
                    placeholder="Alternative contact description"
                    rows={3}
                  />
                ) : contactData.AltDesc ? (
                  <div className="text-text whitespace-pre-wrap bg-surface rounded p-2 text-sm">
                    {contactData.AltDesc}
                  </div>
                ) : (
                  <div className="text-text-muted text-sm">No alternative description</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Notes</h3>
            {isEditing ? (
              <textarea
                className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text resize-none"
                value={editForm.Notes}
                onChange={(e) => setEditForm(s => ({ ...s, Notes: e.target.value }))}
                placeholder="Contact notes"
                rows={6}
              />
            ) : contactData.Notes ? (
              <div className="text-text bg-surface rounded p-2">
                {contactData.Notes}
              </div>
            ) : (
              <div className="text-text-muted text-sm">No notes available</div>
            )}
          </div>

          {/* Audit Information */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Record Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-text-muted" />
                <div>
                  <div className="text-sm text-text-muted">Created</div>
                  <div className="text-text">
                    {contactData.CreateDate ? formatDate(contactData.CreateDate) : "Unknown"}
                    {contactData.CreateInit && ` by ${contactData.CreateInit}`}
                  </div>
                </div>
              </div>

              {contactData.ModifyDate && (
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Last Modified</div>
                    <div className="text-text">
                      {formatDate(contactData.ModifyDate)}
                      {contactData.ModifyInit && ` by ${contactData.ModifyInit}`}
                    </div>
                  </div>
                </div>
              )}

              {contactData.PrevModDate && (
                <div>
                  <div className="text-sm text-text-muted">Previous Modification</div>
                  <div className="text-text text-sm">
                    {formatDate(contactData.PrevModDate)}
                    {contactData.PrevModInit && ` by ${contactData.PrevModInit}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-foreground rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                <Trash2 size={20} className="text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Delete Contact</h3>
                <p className="text-text-muted text-sm">Are you sure you want to delete this contact?</p>
              </div>
            </div>
            
            <div className="bg-surface rounded-lg p-4 mb-4 border border-warning/20">
              <p className="text-sm text-text mb-2">
                <strong>Recommendation:</strong> Instead of deleting, consider making this contact "Inactive" or "Left Company" to preserve historical records.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary-outline" 
                  size="sm"
                  onClick={handleMakeInactive}
                  disabled={isSaving}
                  className="text-warning border-warning hover:bg-warning/10"
                >
                  Make Inactive
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const result = await api.patch(`/legacy/std/Contacts/filter/custom?Cont_Id=${contactData.Cont_Id}&Company_ID=${contactData.Company_ID}`, {
                        Type: ContactType.Left_Company
                      });
                      
                      if (result !== null) {
                        setContactData({ ...contactData, Type: ContactType.Left_Company });
                        setShowDeleteModal(false);
                      }
                    } catch (error) {
                      console.error("Error updating contact:", error);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="text-info border-info hover:bg-info/10"
                >
                  Mark Left Company
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary-outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                disabled={isSaving}
                className="bg-error border-error hover:bg-error/90"
              >
                {isSaving ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetails;