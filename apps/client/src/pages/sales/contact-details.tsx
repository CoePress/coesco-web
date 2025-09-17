import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Mail, Phone, Globe, Calendar, User, MapPin } from "lucide-react";
import { PageHeader } from "@/components";
import { formatDate } from "@/utils";

const ContactDetails = () => {
  const { id: contactId } = useParams<{ id: string }>();
  const [contactData, setContactData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getContactTypeName = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'A': return 'Administrative';
      case 'E': return 'Engineering';
      case 'S': return 'Sales';
      default: return type || 'Unknown';
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'A': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'E': return 'bg-green-100 text-green-800 border-green-200';
      case 'S': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const fetchContactData = async () => {
    if (!contactId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse composite ID format: "contId_companyId_addressId" or "contId_addressId" or just "contId"
      const parts = contactId.includes('_') ? contactId.split('_') : [contactId];
      const actualContactId = parts[0];
      const expectedCompanyId = parts.length === 3 ? parts[1] : null;
      const expectedAddressId = parts.length === 3 ? parts[2] : (parts.length === 2 ? parts[1] : null);
      
      // Build fetch URL with available parameters for most precise matching
      let fetchUrl = `http://localhost:8080/api/legacy/std/Contacts/filter/custom?Cont_Id=${actualContactId}`;
      
      if (expectedCompanyId) {
        fetchUrl += `&Company_ID=${expectedCompanyId}`;
      }
      
      if (expectedAddressId) {
        fetchUrl += `&Address_ID=${expectedAddressId}`;
      }
      
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (response.ok) {
        const rawContactResponse = await response.json();
        
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
        
        // Fetch company data if we have a Company_ID
        if (rawContact?.Company_ID) {
          try {
            const companyResponse = await fetch(
              `http://localhost:8080/api/legacy/base/Company/${rawContact.Company_ID}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              }
            );
            
            if (companyResponse.ok) {
              const companyRaw = await companyResponse.json();
              setCompanyData(companyRaw);
            }
          } catch (companyError) {
            console.warn("Could not fetch company data:", companyError);
          }
        }

        // Fetch address data if we have an Address_ID
        if (rawContact?.Address_ID) {
          try {
            const addressResponse = await fetch(
              `http://localhost:8080/api/legacy/base/Address/filter/custom?Address_ID=${rawContact.Address_ID}&Company_ID=${rawContact.Company_ID}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              }
            );
            
            if (addressResponse.ok) {
              const addressResults = await addressResponse.json();
              // The custom filter returns an array, so take the first result
              if (addressResults && addressResults.length > 0) {
                setAddressData(addressResults[0]);
              }
            }
          } catch (addressError) {
            console.warn("Could not fetch address data:", addressError);
          }
        }
      } else {
        setError(`Failed to load contact: ${response.statusText}`);
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
      />
      
      <div className="p-4 flex flex-1 flex-col gap-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={16} className="text-text-muted" />
                <div>
                  <div className="text-sm text-text-muted">Name</div>
                  <div className="text-text font-medium">{fullName}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-text-muted">Title</div>
                <div className="text-text">{contactData.ConTitle || "-"}</div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Type</div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getContactTypeColor(contactData.Type)}`}>
                  {getContactTypeName(contactData.Type)}
                </span>
              </div>

              <div>
                <div className="text-sm text-text-muted">Contact ID</div>
                <div className="text-text font-mono">{contactData.Cont_Id}</div>
              </div>

              <div>
                <div className="text-sm text-text-muted">Address ID</div>
                <div className="text-text font-mono">{contactData.Address_ID || "-"}</div>
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

              {contactData.MoreAddress && (
                <div>
                  <div className="text-sm text-text-muted">Additional Address</div>
                  <div className="text-text">{contactData.MoreAddress}</div>
                </div>
              )}
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
                
                <div>
                  <div className="text-sm text-text-muted">Address ID</div>
                  <div className="text-text font-mono">{contactData.Address_ID}</div>
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
              {contactData.PhoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Phone</div>
                    <Link to={`tel:${contactData.PhoneNumber}`} className="text-primary hover:underline">
                      {contactData.PhoneNumber}
                      {contactData.PhoneExt && ` x${contactData.PhoneExt}`}
                    </Link>
                  </div>
                </div>
              )}

              {contactData.Email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Email</div>
                    <Link to={`mailto:${contactData.Email}`} className="text-primary hover:underline">
                      {contactData.Email}
                    </Link>
                  </div>
                </div>
              )}

              {contactData.Website && (
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-text-muted" />
                  <div>
                    <div className="text-sm text-text-muted">Website</div>
                    <Link to={contactData.Website} target="_blank" className="text-primary hover:underline">
                      {contactData.Website}
                    </Link>
                  </div>
                </div>
              )}

              {contactData.FaxPhoneNum && (
                <div>
                  <div className="text-sm text-text-muted">Fax</div>
                  <div className="text-text">{contactData.FaxPhoneNum}</div>
                </div>
              )}
            </div>
          </div>

          {/* Alternative Contact Information */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Alternative Contact</h3>
            <div className="space-y-3">
              {contactData.AltPhone ? (
                <div>
                  <div className="text-sm text-text-muted">Alternative Phone</div>
                  <div className="text-text whitespace-pre-wrap bg-surface rounded p-2 text-sm">
                    {contactData.AltPhone}
                  </div>
                </div>
              ) : (
                <div className="text-text-muted text-sm">No alternative phone numbers</div>
              )}

              {contactData.AltDesc ? (
                <div>
                  <div className="text-sm text-text-muted">Description</div>
                  <div className="text-text whitespace-pre-wrap bg-surface rounded p-2 text-sm">
                    {contactData.AltDesc}
                  </div>
                </div>
              ) : (
                <div className="text-text-muted text-sm">No alternative description</div>
              )}
            </div>
          </div>
        </div>

        {/* Notes and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="bg-foreground rounded shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Notes</h3>
            {contactData.Notes ? (
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
    </div>
  );
};

export default ContactDetails;