import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Mail, Phone, Calendar, User, MapPin, Edit, UserX, Briefcase, Trash2, Camera, Upload, X, ExternalLink } from "lucide-react";
import { PageHeader, Button } from "@/components";
import { DeleteContactModal } from "@/components/modals/delete-contact-modal";
import { formatDate } from "@/utils";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { ContactType } from "@/types/enums";
import { fetchAvailableRsms, Employee } from "@/pages/sales/journeys/utils";

interface EditFormData {
  firstName: string;
  lastName: string;
  title: string;
  type: string;
  phone: string;
  phoneExtension: string;
  email: string;
  addressId: string;
  owner: string;
  imageId: number | null;
  profileUrl: string;
}

interface Image {
  id: number;
  url: string;
  uploadedAt: string;
}

const ContactDetails = () => {
  const { id: contactId } = useParams<{ id: string }>();
  const api = useApi();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [copiedContactId, setCopiedContactId] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: "",
    lastName: "",
    title: "",
    type: "",
    phone: "",
    phoneExtension: "",
    email: "",
    addressId: "",
    owner: "",
    imageId: null,
    profileUrl: ""
  });

  const [availableRsms, setAvailableRsms] = useState<Employee[]>([]);

  const [showImageModal, setShowImageModal] = useState(false);
  const [availableImages, setAvailableImages] = useState<Image[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSearchTerm, setImageSearchTerm] = useState("");

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

  const getValidRSM = (value: string) => {
    if (!value) return "";
    const normalized = availableRsms.find(rsm =>
      rsm.initials.toLowerCase() === value.toLowerCase()
    );
    return normalized ? normalized.initials : value;
  };

  const getRsmDisplayName = (value: string) => {
    if (!value) return "-";
    const rsm = availableRsms.find(r =>
      r.initials.toLowerCase() === value.toLowerCase()
    );
    return rsm ? `${rsm.name} (${rsm.initials})` : value;
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
      addressId: contact?.addressId || "",
      owner: getValidRSM(contact?.owner || ""),
      imageId: contact?.imageId || null,
      profileUrl: contact?.profileUrl || ""
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
        owner: editForm.owner || null,
        imageId: editForm.imageId,
        profileUrl: editForm.profileUrl?.trim() || null,
        companyId: contactData.companyId,
        isPrimary: contactData.isPrimary,
        legacyCompanyId: contactData.legacyCompanyId,
        createdById: contactData.createdById,
        updatedById: contactData.updatedById,
      };

      const result = await api.patch(`/sales/contacts/${contactData.id}`, trimmedData);
      if (result !== null) {
        const selectedImage = trimmedData.imageId
          ? availableImages.find(img => img.id === trimmedData.imageId) || contactData.image
          : null;

        const updatedContactData = {
          ...contactData,
          ...trimmedData,
          image: selectedImage ? (selectedImage.path ? selectedImage : { path: selectedImage.url }) : null
        };
        setContactData(updatedContactData);
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
        if (!rawContact) {
          setError('Contact data is null or undefined');
          return;
        }

        setContactData(rawContact);
        initializeEditForm(rawContact);
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
            console.error("Could not fetch company data:", companyError);
          }
          try {
            const addressResponse = await api.get('/legacy/base/Address/filter/custom', {
              Company_ID: rawContact.legacyCompanyId
            });

            const addresses = addressResponse?.data
              ? (Array.isArray(addressResponse.data) ? addressResponse.data : [])
              : (Array.isArray(addressResponse) ? addressResponse : []);

            if (addresses.length > 0) {
              setAvailableAddresses(addresses);

              if (rawContact.addressId) {
                const currentAddress = addresses.find((addr: any) => {
                  return addr.Address_ID == rawContact.addressId;
                });
                if (currentAddress) {
                  setAddressData(currentAddress);
                }
              }
            }
          } catch (addressError) {
            console.error("Could not fetch address data:", addressError);
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
    let cancelled = false;
    (async () => {
      const rsms = await fetchAvailableRsms(api);
      if (!cancelled) {
        setAvailableRsms(rsms);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchAvailableImages = async () => {
    setLoadingImages(true);
    try {
      const result = await api.get("/core/images");
      if (result) {
        setAvailableImages(result);
      }
    } catch (error) {
      toastError("Failed to load images");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImageModalOpen = () => {
    setShowImageModal(true);
    fetchAvailableImages();
  };

  const handleSelectImage = (imageId: number) => {
    setEditForm(prev => ({ ...prev, imageId }));
    setShowImageModal(false);
    success("Image selected");
  };

  const handleRemoveImage = () => {
    setEditForm(prev => ({ ...prev, imageId: null }));
    success("Image removed");
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const result = await api.post("/core/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (result) {
        success("Image uploaded successfully");
        fetchAvailableImages();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toastError("Failed to upload image");
      }
    } catch (error) {
      toastError("An error occurred during upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const getSelectedImage = () => {
    if (!editForm.imageId) return null;
    return availableImages.find(img => img.id === editForm.imageId);
  };

  const getContactImage = () => {
    if (!contactData?.imageId) return null;
    return contactData.image;
  };

  const filteredImages = availableImages.filter(img =>
    img.id.toString().includes(imageSearchTerm)
  );

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
              {/* Contact Photo */}
              <div>
                <div className="text-sm text-text-muted mb-2">Photo</div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center">
                        {getSelectedImage() || (editForm.imageId && contactData?.image) ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL.replace('/v1', '')}${
                              getSelectedImage()?.url || contactData?.image?.path
                            }`}
                            alt="Contact"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={32} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="secondary-outline"
                          size="sm"
                          onClick={handleImageModalOpen}
                        >
                          <Camera size={14} className="mr-1" />
                          {editForm.imageId ? "Change Photo" : "Select Photo"}
                        </Button>
                        {editForm.imageId && (
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="text-error border-error hover:bg-error/10"
                          >
                            <X size={14} className="mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center">
                      {getContactImage() ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL.replace('/v1', '')}${getContactImage().path}`}
                          alt="Contact"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={32} className="text-text-muted" />
                      )}
                    </div>
                  )}
                </div>
              </div>

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
                <div className="text-sm text-text-muted">Contact Owner</div>
                {isEditing ? (
                  <select
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={editForm.owner}
                    onChange={(e) => setEditForm(s => ({ ...s, owner: e.target.value }))}
                  >
                    <option value="">No Value Selected</option>
                    {editForm.owner && !availableRsms.find(r => r.initials === editForm.owner) && (
                      <option key={editForm.owner} value={editForm.owner}>{editForm.owner}</option>
                    )}
                    {availableRsms.map(rsm => (
                      <option key={rsm.initials} value={rsm.initials}>{rsm.name} ({rsm.initials})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-text">{getRsmDisplayName(contactData.owner)}</div>
                )}
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

              <div>
                <div className="text-sm text-text-muted">Profile URL</div>
                {isEditing ? (
                  <input
                    type="url"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={editForm.profileUrl}
                    onChange={(e) => setEditForm(s => ({ ...s, profileUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                  />
                ) : contactData.profileUrl ? (
                  <a
                    href={
                      contactData.profileUrl.startsWith('http://') || contactData.profileUrl.startsWith('https://')
                        ? contactData.profileUrl
                        : `https://${contactData.profileUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
                  >
                    {contactData.profileUrl}
                    <ExternalLink size={12} className="flex-shrink-0" />
                  </a>
                ) : (
                  <div className="text-text">-</div>
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

            <div className="flex items-center gap-3">
              <User size={16} className="text-text-muted" />
              <div>
                <div className="text-sm text-text-muted">
                  {copiedContactId ? "Copied to clipboard!" : "Contact ID (click to copy)"}
                </div>
                <div
                  className="text-text font-mono cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(contactData.id);
                    setCopiedContactId(true);
                    setTimeout(() => setCopiedContactId(false), 2000);
                  }}
                  title="Click to copy"
                >
                  {contactData.id}
                </div>
              </div>
            </div>
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
                      const startDate = journey?.Journey_Start_Date || journey?.CreateDT;

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

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-foreground rounded shadow-lg border max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Select Contact Photo</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Upload Section */}
              <div className="border border-border rounded p-4 bg-surface">
                <h4 className="text-sm font-semibold text-text mb-3">Upload New Image</h4>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload size={14} className="mr-1" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Images will be converted to WebP format and compressed
                </p>
              </div>

              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search by image ID..."
                  value={imageSearchTerm}
                  onChange={(e) => setImageSearchTerm(e.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text"
                />
              </div>

              {/* Image Grid */}
              <div>
                <h4 className="text-sm font-semibold text-text mb-3">Available Images</h4>
                {loadingImages ? (
                  <div className="text-center py-8 text-text-muted">Loading images...</div>
                ) : filteredImages.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">No images found</div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => handleSelectImage(image.id)}
                        className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          editForm.imageId === image.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL.replace('/v1', '')}${image.url}`}
                          alt={`Image ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            ID: {image.id}
                          </div>
                        </div>
                        {editForm.imageId === image.id && (
                          <div className="absolute top-1 right-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => setShowImageModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetails;