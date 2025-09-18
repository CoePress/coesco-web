import {
  MoreHorizontal,
  PlusCircleIcon,
  Building2,
  List as ListIcon,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

import { Table, Button, PageHeader, AddContactModal } from "@/components";
import { TableColumn } from "@/components/ui/table";

const Contacts = () => {
  const [legacyContacts, setLegacyContacts] = useState<any[] | null>(null);
  const [legacyCompanies, setLegacyCompanies] = useState<any[] | null>(null);
  
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  const handleContactAdded = (newContact: any) => {
    // Adapt the new contact to our format and add it to the list
    const adaptedContact = adaptLegacyContact(newContact, legacyCompanies || [], (legacyContacts?.length || 0));
    if (adaptedContact) {
      setLegacyContacts(prev => [adaptedContact, ...(prev || [])]);
    }
  };

  const getContactTypeName = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'A': return 'Accounting';
      case 'E': return 'Engineering';
      case 'S': return 'Sales';
      default: return type || 'Unknown';
    }
  };

  const adaptLegacyContact = (raw: any, companies: any[] = [], index: number = 0) => {
    // Handle null/undefined raw data
    if (!raw) {
      console.warn('Received null/undefined contact data');
      return null;
    }

    // Find the company for this contact
    const company = companies.find(comp => comp?.Company_ID === raw?.Company_ID);
    
    // Create unique ID using Cont_Id and fallback to index for duplicates
    const contactId = raw.Cont_Id || `contact_${index}`;
    const uniqueId = `${contactId}_${raw.Company_ID || 0}_${index}`;
    
    return {
      id: uniqueId, // Use unique composite ID
      originalId: raw.Cont_Id || 0,
      companyId: raw.Company_ID || 0,
      companyName: company?.CustDlrName || (raw.Company_ID ? `Company ${raw.Company_ID}` : 'Unknown Company'),
      addressId: raw.Address_ID || 0,
      firstName: raw.FirstName || "",
      lastName: raw.LastName || "",
      fullName: `${raw.FirstName || ""} ${raw.LastName || ""}`.trim() || "Unnamed Contact",
      type: raw.Type || "",
      typeName: getContactTypeName(raw.Type),
      notes: raw.Notes || "",
      phoneNumber: raw.PhoneNumber || "",
      phoneExt: raw.PhoneExt || "",
      faxPhoneNum: raw.FaxPhoneNum || "",
      email: raw.Email || "",
      website: raw.Website || "",
      title: raw.ConTitle || "",
      altPhone: raw.AltPhone || "",
      altDesc: raw.AltDesc || "",
      moreAddress: raw.MoreAddress || "",
      createDate: raw.CreateDate,
      createInit: raw.CreateInit || "",
      modifyDate: raw.ModifyDate,
      modifyInit: raw.ModifyInit || "",
      // Keep all original fields
      ...raw
    };
  };

  // Fetch contacts with addresses for map view
  const fetchContactsWithAddresses = async (limit: number = 50) => {
    try {
      // Step 1: Fetch contacts from std.Contacts table
      const contactsResponse = await fetch(
        `http://localhost:8080/api/legacy/std/Contacts?sort=Cont_Id&order=desc&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!contactsResponse.ok) {
        throw new Error(`Contacts fetch failed: ${contactsResponse.status}`);
      }

      const rawContacts = await contactsResponse.json();
      const contacts = Array.isArray(rawContacts) ? rawContacts.filter(contact => contact != null) : [];
      
      // Step 2: Get unique combinations of Address_ID and Company_ID from contacts
      const addressContactPairs = contacts
        .filter(contact => contact?.Address_ID && contact?.Address_ID > 0 && contact?.Company_ID)
        .map(contact => ({
          addressId: contact.Address_ID,
          companyId: contact.Company_ID,
          key: `${contact.Address_ID}_${contact.Company_ID}`
        }));
      
      // Remove duplicates based on the key
      const uniqueAddressPairs = addressContactPairs.filter((pair, index, arr) => 
        index === arr.findIndex(p => p.key === pair.key)
      );
      
      // Step 3: Fetch addresses from base.Address table using custom filter with both Address_ID and Company_ID
      const addressPromises = uniqueAddressPairs.map(async (pair) => {
        try {
          const addressResponse = await fetch(
            `http://localhost:8080/api/legacy/base/Address/filter/custom?Address_ID=${pair.addressId}&Company_ID=${pair.companyId}&limit=1`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          );

          if (addressResponse.ok) {
            const rawAddress = await addressResponse.json();
            const addresses = Array.isArray(rawAddress) ? rawAddress : [];
            return addresses.length > 0 ? { id: pair.addressId, companyId: pair.companyId, key: pair.key, data: addresses[0] } : null;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching address ${pair.addressId} for company ${pair.companyId}:`, error);
          return null;
        }
      });

      const addressResults = await Promise.all(addressPromises);
      const addressMap = new Map();
      
      addressResults.forEach(result => {
        if (result) {
          // Use composite key for accurate address lookup
          addressMap.set(result.key, result.data);
          // Also set by Address_ID for backward compatibility
          addressMap.set(result.id, result.data);
        }
      });

      return { contacts, addressMap };
    } catch (error) {
      console.error('Error fetching contacts with addresses:', error);
      return { contacts: [], addressMap: new Map() };
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch contacts and companies in parallel
        const [contactsResponse, companiesResponse] = await Promise.all([
          fetch(
            `http://localhost:8080/api/legacy/std/Contacts?sort=Cont_Id&order=desc&limit=50`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          ),
          fetch(
            `http://localhost:8080/api/legacy/base/Company?sort=Company_ID&order=desc&limit=10`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          )
        ]);

        let companiesData = [];
        if (companiesResponse.ok) {
          const rawCompanies = await companiesResponse.json();
          companiesData = Array.isArray(rawCompanies) ? rawCompanies : [];
          if (!cancelled) setLegacyCompanies(companiesData);
        } else {
          console.error("Legacy companies fetch failed:", companiesResponse.status, await companiesResponse.text());
        }

        if (contactsResponse.ok) {
          const rawContacts = await contactsResponse.json();
          const validContacts = Array.isArray(rawContacts) ? rawContacts.filter(contact => contact != null) : [];
          const mapped = validContacts.map((contact, index) => adaptLegacyContact(contact, companiesData, index)).filter(contact => contact != null);
          if (!cancelled) {
            setLegacyContacts(mapped);
            // If we got fewer than 50 contacts, we've loaded all available contacts
            setAllContactsLoaded(mapped.length < 50);
          }
        } else {
          console.error("Legacy contacts fetch failed:", contactsResponse.status, await contactsResponse.text());
        }
      } catch (error) {
        console.error("Error fetching Contacts and Companies:", error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const baseContacts = legacyContacts || [];

  // Batch loading state
  const [batchSize, setBatchSize] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allContactsLoaded, setAllContactsLoaded] = useState(false);
  
  const displayedContacts = baseContacts.slice(0, batchSize);
  const hasMoreContacts = baseContacts.length > batchSize || !allContactsLoaded;

  const loadMoreContacts = useCallback(async () => {
    if (isLoadingMore || !hasMoreContacts) return;
    
    setIsLoadingMore(true);
    
    try {
      // If we have more contacts locally, just increase batch size
      if (baseContacts.length > batchSize) {
        setBatchSize(prev => prev + 50);
      } else {
        // Fetch more contacts from API
        const contactsResponse = await fetch(
          `http://localhost:8080/api/legacy/std/Contacts?sort=Cont_Id&order=desc&limit=50&offset=${baseContacts.length}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (contactsResponse.ok) {
          const rawContacts = await contactsResponse.json();
          const newContacts = Array.isArray(rawContacts) ? rawContacts : [];
          
          if (newContacts.length === 0) {
            // No more contacts available
            setAllContactsLoaded(true);
          } else {
            // Map new contacts and add to existing list
            const validNewContacts = newContacts.filter(contact => contact != null);
            const mappedNewContacts = validNewContacts.map((contact, index) => adaptLegacyContact(contact, legacyCompanies || [], baseContacts.length + index)).filter(contact => contact != null);
            setLegacyContacts(prev => [...(prev || []), ...mappedNewContacts]);
            setBatchSize(prev => prev + mappedNewContacts.length);
          }
        } else {
          console.error("Failed to load more contacts:", contactsResponse.status);
        }
      }
    } catch (error) {
      console.error("Error loading more contacts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreContacts, baseContacts.length, batchSize, legacyCompanies]);

  // Scroll detection for auto-loading
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    
    if (isNearBottom && hasMoreContacts && !isLoadingMore) {
      loadMoreContacts();
    }
  }, [hasMoreContacts, isLoadingMore, loadMoreContacts]);

  // Add scroll listener
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const scrollContainer = containerRef.current;

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = (e: Event) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleScroll(e), 100);
    };

    scrollContainer.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  const columns: TableColumn<any>[] = [
    {
      key: "fullName",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/contacts/${row.originalId}_${row.companyId}_${row.addressId}`}>
          <div className="font-medium">{row.fullName}</div>
          {row.title && <div className="text-xs text-text-muted">{row.title}</div>}
        </Link>
      ),
    },
    {
      key: "companyName",
      header: "Company",
      className: "hover:underline",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.companyId}`} className="flex items-center gap-1">
          <Building2 size={14} />
          {row.companyName}
        </Link>
      ),
    },
    {
      key: "typeName",
      header: "Type",
      render: (_, row) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
          row.type === 'A' ? 'bg-blue-100 text-blue-800' :
          row.type === 'E' ? 'bg-green-100 text-green-800' :
          row.type === 'S' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.typeName}
        </span>
      ),
    },
    {
      key: "phoneNumber",
      header: "Phone",
      className: "hover:underline",
      render: (_, row) => {
        const phone = row.phoneNumber;
        const ext = row.phoneExt;
        const displayPhone = phone ? `${phone}${ext ? ` x${ext}` : ''}` : '';
        return displayPhone ? <Link to={`tel:${phone}`}>{displayPhone}</Link> : "-";
      },
    },
    {
      key: "email",
      header: "Email",
      className: "hover:underline",
      render: (_, row) =>
        row.email ? <Link to={`mailto:${row.email}`}>{row.email}</Link> : "-",
    },
    {
      key: "notes",
      header: "Notes",
      render: (_, row) => (
        <div className="text-sm max-w-xs truncate" title={row.notes}>
          {row.notes || "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ];

  const HeaderActions = () => (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "list" ? "secondary" : "secondary-outline"}
        size="sm"
        onClick={() => setViewMode("list")}
      >
        <ListIcon size={16} />
        List
      </Button>
      <Button
        variant={viewMode === "map" ? "secondary" : "secondary-outline"}
        size="sm"
        onClick={() => setViewMode("map")}
      >
        <MapPin size={16} />
        Map
      </Button>
      <Button 
        variant="primary" 
        size="sm"
        onClick={() => setShowAddContactModal(true)}
      >
        <PlusCircleIcon size={16} />
        Create New
      </Button>
    </div>
  );

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Contacts"
        description={baseContacts ? `${baseContacts?.length} total contacts` : "Loading contacts..."}
        actions={<HeaderActions />}
      />

      {viewMode === "list" && (
        <div ref={containerRef} className="flex-1 overflow-auto">
          <div className="flex flex-col h-full">
            <Table<any>
              columns={columns}
              data={displayedContacts || []}
              total={baseContacts?.length || 0}
              idField="id"
              className="bg-foreground rounded shadow-sm border flex-shrink-0"
            />
            {hasMoreContacts && (
              <div className="p-4 bg-foreground flex justify-center flex-shrink-0">
                <Button
                  variant="secondary-outline"
                  onClick={loadMoreContacts}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : `Load More (${displayedContacts.length} of ${allContactsLoaded ? baseContacts.length : baseContacts.length + '+'} contacts)`}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "map" && (
        <ContactsMapView 
          contacts={baseContacts || []}
          onFetchAddresses={fetchContactsWithAddresses}
        />
      )}

      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onContactAdded={handleContactAdded}
      />
    </div>
  );
};

// Contacts Map View Component
const ContactsMapView = ({ 
  contacts, 
  onFetchAddresses 
}: { 
  contacts: any[]; 
  onFetchAddresses: (limit?: number) => Promise<any> 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [contactsWithAddresses, setContactsWithAddresses] = useState<any[]>([]);
  const [selectedContactType, setSelectedContactType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapView, setMapView] = useState({ center: [39.8283, -98.5795], zoom: 4 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Cache for postal code coordinates to avoid redundant API calls
  const postalCodeCacheRef = useRef<Map<string, [number, number] | null>>(new Map());
  const geocodeCache = useRef<Map<string, [number, number]>>(new Map());

  // Fallback coordinate computation (no API calls)
  const computeFallbackCoordinates = (address: any): [number, number] => {
    // Major city coordinates for fallback positioning
    const majorCities: Record<string, [number, number]> = {
      'NEW YORK': [40.7128, -74.0060], 'LOS ANGELES': [34.0522, -118.2437], 'CHICAGO': [41.8781, -87.6298],
      'HOUSTON': [29.7604, -95.3698], 'PHOENIX': [33.4484, -112.0740], 'PHILADELPHIA': [39.9526, -75.1652],
      'SAN ANTONIO': [29.4241, -98.4936], 'SAN DIEGO': [32.7157, -117.1611], 'DALLAS': [32.7767, -96.7970],
      'TORONTO': [43.6532, -79.3832], 'MONTREAL': [45.5017, -73.5673], 'VANCOUVER': [49.2827, -123.1207],
    };

    // State/province center coordinates
    const stateCoords: Record<string, [number, number]> = {
      'CA': [36.116203, -119.681564], 'TX': [31.054487, -97.563461], 'NY': [42.165726, -74.948051],
      'FL': [27.766279, -81.686783], 'IL': [40.349457, -88.986137], 'ON': [51.253775, -85.323214],
    };

    const state = (address.State || address.state || address.stateProvince || '').toUpperCase();
    const city = (address.City || address.city || '').toUpperCase();

    // Try city lookup first
    if (city && majorCities[city]) {
      return majorCities[city];
    }
    // Fall back to state/province center
    else if (state && stateCoords[state]) {
      return stateCoords[state];
    }

    // Default to US center
    return [39.8283, -98.5795];
  };

  // Batch postal code lookup to reduce API calls
  const batchLookupPostalCodes = async (postalCodes: Array<{country: string, postalCode: string}>) => {
    const uniqueCodes = [...new Set(postalCodes.map(p => `${p.country}_${p.postalCode}`))];
    const uncachedCodes = uniqueCodes.filter(key => !postalCodeCacheRef.current.has(key));
    
    if (uncachedCodes.length === 0) return;
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < uncachedCodes.length; i += batchSize) {
      const batch = uncachedCodes.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (key) => {
        const [country, postalCode] = key.split('_');
        const cacheKey = `${country}_${postalCode}`;
        
        if (postalCodeCacheRef.current.has(cacheKey)) return;
        
        try {
          const response = await fetch(`http://localhost:8080/api/postal-codes/coordinates/${country}/${postalCode}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              postalCodeCacheRef.current.set(cacheKey, [result.data.latitude, result.data.longitude]);
            } else {
              postalCodeCacheRef.current.set(cacheKey, null);
            }
          } else {
            postalCodeCacheRef.current.set(cacheKey, null);
          }
        } catch (error) {
          console.log('Batch postal code lookup failed for', key, ':', error);
          postalCodeCacheRef.current.set(cacheKey, null);
        }
      }));
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < uncachedCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  // Load addresses when map view is opened (only once)
  useEffect(() => {
    const loadAddressData = async () => {
      try {
        const result = await onFetchAddresses(50);
        if (result && result.contacts && result.addressMap) {
          // Combine contacts with their addresses
          const validContacts = result.contacts.filter((contact: any) => contact != null);
          const combined = validContacts.map((contact: any, index: number) => {
            // Try composite key first, fallback to Address_ID for backward compatibility
            const compositeKey = `${contact?.Address_ID}_${contact?.Company_ID}`;
            const address = result.addressMap.get(compositeKey) || result.addressMap.get(contact?.Address_ID);
            return {
              contact,
              address,
              fullName: `${contact?.FirstName || ''} ${contact?.LastName || ''}`.trim() || 'Unnamed Contact',
              formattedAddress: address ? [
                address.Address1 || address.addressLine1,
                address.Address2 || address.addressLine2,
                address.City || address.city,
                address.State || address.state || address.stateProvince,
                address.ZipCode || address.zipCode || address.postalCode
              ].filter(Boolean).join(', ') : 'No address available',
              uniqueId: `map_contact_${contact?.Cont_Id || index}_${index}` // Unique ID for map
            };
          });
          setContactsWithAddresses(combined);
          console.log('ContactsMapView: Loaded contacts with addresses:', combined.length);
          console.log('ContactsMapView: Sample contact with address:', combined[0]);
          console.log('ContactsMapView: Address map keys:', Array.from(result.addressMap.keys()));
          console.log('ContactsMapView: Sample address data:', combined.find((c: any) => c.address));
        }
      } catch (error) {
        console.error('Error loading address data:', error);
      }
    };

    // Only load data if we don't have any yet
    if (contactsWithAddresses.length === 0) {
      loadAddressData();
    }
  }, []); // Empty dependency array to run only once

  // Listen for map view changes from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'mapViewChange') {
        setMapView({
          center: event.data.center,
          zoom: event.data.zoom
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // More restrictive fuzzy search function
  const fuzzySearch = (query: string, text: string): boolean => {
    if (!query) return true;
    
    const queryLower = query.toLowerCase().trim();
    const textLower = text.toLowerCase();
    
    // If query is 3 characters or less, require exact substring match
    if (queryLower.length <= 3) {
      return textLower.includes(queryLower);
    }
    
    // For longer queries, use fuzzy matching but require at least 70% of characters to match
    const words = queryLower.split(' ').filter(word => word.length > 0);
    
    // Each word must have a good fuzzy match in the text
    return words.every(word => {
      if (word.length <= 2) {
        // Short words need exact substring match
        return textLower.includes(word);
      }
      
      // Fuzzy match for longer words - allow some gaps but not too many
      let matchedChars = 0;
      let wordIndex = 0;
      let maxGap = Math.floor(word.length * 0.3); // Allow 30% gap
      let currentGap = 0;
      
      for (let i = 0; i < textLower.length && wordIndex < word.length; i++) {
        if (textLower[i] === word[wordIndex]) {
          matchedChars++;
          wordIndex++;
          currentGap = 0;
        } else {
          currentGap++;
          if (currentGap > maxGap) {
            // Reset if gap is too large
            wordIndex = 0;
            matchedChars = 0;
            currentGap = 0;
          }
        }
      }
      
      // Require at least 80% of the word characters to match
      return matchedChars >= Math.ceil(word.length * 0.8);
    });
  };

  // Filter contacts based on type and search query
  const filteredContactsWithAddresses = contactsWithAddresses.filter(item => {
    // Filter by contact type
    if (selectedContactType !== 'all' && item.contact?.Type?.toUpperCase() !== selectedContactType.toUpperCase()) {
      return false;
    }
    
    // Filter by search query (fuzzy search on full name)
    if (searchQuery && !fuzzySearch(searchQuery, item.fullName)) {
      return false;
    }
    
    return item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince);
  });

  // Initialize map only once when contact data is loaded
  useEffect(() => {
    if (!mapContainerRef.current || contactsWithAddresses.length === 0 || !isInitialLoad) return;

    const initializeMapWithPreloadedData = async () => {
      // Use all contacts data for initial map creation
      const contactsData = contactsWithAddresses.filter(item => 
        item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince)
      );

      // Pre-load postal code coordinates for all contacts
      const normalizeCountryCode = (country: string) => {
        if (!country) return 'US';
        const normalized = country.toUpperCase().trim();
        switch (normalized) {
          case 'USA':
          case 'UNITED STATES':
          case 'UNITED STATES OF AMERICA':
            return 'US';
          case 'CANADA':
          case 'CAN':
            return 'CA';
          case 'MEXICO':
          case 'MEX':
            return 'MX';
          default:
            return normalized.length === 2 ? normalized : 'US';
        }
      };

      const postalCodesToLookup = contactsData.map(item => {
        const address = item.address;
        const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
        const country = normalizeCountryCode(address.Country || address.country);
        return { country, postalCode: zipCode };
      }).filter(p => p.postalCode);

      // Batch lookup all postal codes before creating the map
      await batchLookupPostalCodes(postalCodesToLookup);

      // Pre-compute all coordinates to avoid API calls in the map
      const contactsWithCoordinates = contactsData.map(item => {
        const address = item.address;
        const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
        const country = normalizeCountryCode(address.Country || address.country);
        const cacheKey = `${country}_${zipCode}`;
        
        // Get coordinates from cache (postal code API result) - use exact coordinates without spread
        let coords = postalCodeCacheRef.current.get(cacheKey);
        
        // If no postal code coords, use geocode cache or compute fallback
        if (!coords) {
          const geocodeKey = JSON.stringify({
            city: address.City || address.city,
            state: address.State || address.state || address.stateProvince,
            country: country,
            zipCode: zipCode
          });
          
          coords = geocodeCache.current.get(geocodeKey);
          if (!coords) {
            coords = computeFallbackCoordinates(address);
            geocodeCache.current.set(geocodeKey, coords);
          }
        }
        
        return {
          ...item,
          coordinates: coords
        };
      });

    console.log('ContactsMapView: Creating map with pre-computed coordinates:', contactsWithCoordinates.length);
    console.log('ContactsMapView: Postal code cache size:', postalCodeCacheRef.current.size);

    const mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contacts Map</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #map { height: 100vh; width: 100%; }
        .contact-popup {
            max-width: 300px;
        }
        .contact-popup h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 16px;
        }
        .contact-popup .contact-details {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }
        .contact-popup .contact-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .contact-popup .type-a { background: #e3f2fd; color: #1976d2; }
        .contact-popup .type-e { background: #e8f5e8; color: #388e3c; }
        .contact-popup .type-s { background: #fff3e0; color: #f57c00; }
        .contact-popup .type-default { background: #f5f5f5; color: #757575; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialize map with preserved view state
        const mapCenter = ${JSON.stringify(mapView.center)};
        const mapZoom = ${mapView.zoom};
        
        const map = L.map('map', {
            center: mapCenter,
            zoom: mapZoom,
            minZoom: 3,
            maxZoom: 18,
            maxBounds: [
                [-90, -180],
                [90, 180]
            ],
            maxBoundsViscosity: 0.5
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Save map view state when user interacts with map
        let viewChangeTimeout;
        map.on('moveend zoomend', function() {
            clearTimeout(viewChangeTimeout);
            viewChangeTimeout = setTimeout(() => {
                const center = map.getCenter();
                const zoom = map.getZoom();
                // Send view state to parent window
                window.parent.postMessage({
                    type: 'mapViewChange',
                    center: [center.lat, center.lng],
                    zoom: zoom
                }, '*');
            }, 250); // Debounce to avoid too many updates
        });

        // Contact data with pre-computed coordinates (no API calls needed)
        const contactsData = ${JSON.stringify(contactsWithCoordinates)};
        
        // Color palette for different contact types
        const typeColors = {
            'A': '#1976d2', // Accounting - Blue
            'E': '#388e3c', // Engineering - Green  
            'S': '#f57c00', // Sales - Orange
            'default': '#757575' // Unknown - Gray
        };

        const typeLabels = {
            'A': 'Accounting',
            'E': 'Engineering',
            'S': 'Sales',
            'default': 'Unknown'
        };

        // Simple hash function for consistent random generation
        function simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash);
        }

        // Function to normalize country codes
        function normalizeCountryCode(country) {
            if (!country) return 'US'; // Default to US
            
            const normalized = country.toUpperCase().trim();
            
            switch (normalized) {
                case 'USA':
                case 'UNITED STATES':
                case 'UNITED STATES OF AMERICA':
                    return 'US';
                case 'CANADA':
                case 'CAN':
                    return 'CA';
                case 'MEXICO':
                case 'MEX':
                    return 'MX';
                default:
                    return normalized.length === 2 ? normalized : 'US';
            }
        }

        // Optimized coordinate lookup (no API calls - coordinates are pre-computed)
        function getCoordinatesFromPrecomputed(item) {
            // Return pre-computed coordinates directly
            return item.coordinates || [39.8283, -98.5795]; // Default to US center if no coordinates
        }

        // Initial markers will be created by createMarkersFromData function

        // Add legend
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'legend');
            div.style.background = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            
            div.innerHTML = \`
                <h4 style="margin: 0 0 5px 0;">Contact Types</h4>
                <div><span style="color: \${typeColors.A};">●</span> Accounting</div>
                <div><span style="color: \${typeColors.E};">●</span> Engineering</div>
                <div><span style="color: \${typeColors.S};">●</span> Sales</div>
                <div><span style="color: \${typeColors.default};">●</span> Unknown</div>
                <div style="margin-top: 8px;">
                    <div><span style="color: #9c27b0;">●</span> Multiple Contacts</div>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    Total Contacts: \${contactsData.length}
                </div>
            \`;
            return div;
        };
        legend.addTo(map);
        
        // Store markers and circles for dynamic updates
        let allMarkers = [];
        let allCircles = [];
        
        // Function to create markers from contact data with clustering (optimized - no API calls)
        function createMarkersFromData(contactsData) {
            // Clear existing markers and circles
            allMarkers.forEach(marker => map.removeLayer(marker));
            allCircles.forEach(circle => map.removeLayer(circle));
            allMarkers = [];
            allCircles = [];
            
            // Group contacts by coordinates (clustering)
            const locationGroups = new Map();
            
            for (const item of contactsData) {
                const { contact, address, fullName, formattedAddress } = item;
                
                if (!address || !(address.City || address.city) || !(address.State || address.state || address.stateProvince)) continue;
                
                const coords = getCoordinatesFromPrecomputed(item);
                const coordKey = coords[0].toFixed(6) + ',' + coords[1].toFixed(6); // Round to ~0.1m precision
                
                if (!locationGroups.has(coordKey)) {
                    locationGroups.set(coordKey, {
                        coordinates: coords,
                        contacts: []
                    });
                }
                
                locationGroups.get(coordKey).contacts.push({
                    contact,
                    address,
                    fullName,
                    formattedAddress,
                    contactType: contact.Type?.toUpperCase() || 'default'
                });
            }
            
            // Create markers for each location group
            for (const [coordKey, group] of locationGroups) {
                const coords = group.coordinates;
                const contacts = group.contacts;
                const contactCount = contacts.length;
                
                // Determine marker appearance based on contact count and types
                let markerColor, markerRadius;
                if (contactCount === 1) {
                    // Single contact - use contact type color
                    const contactType = contacts[0].contactType;
                    markerColor = typeColors[contactType] || typeColors.default;
                    markerRadius = 8;
                } else {
                    // Multiple contacts - use purple for clusters
                    markerColor = '#9c27b0';
                    markerRadius = Math.min(12 + contactCount * 2, 20); // Scale with count, max 20px
                }
                
                // Create cluster marker
                const marker = L.circleMarker(coords, {
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.7,
                    radius: markerRadius,
                    weight: 2
                }).addTo(map);
                
                // Add 30-mile radius circle (only for single contacts or primary contact in cluster)
                const radiusCircle = L.circle(coords, {
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.1,
                    weight: 1,
                    radius: 48280,
                    interactive: false
                }).addTo(map);
                
                if (contactCount === 1) {
                    // Single contact - show individual contact popup
                    const contact = contacts[0];
                    const popupContent = \`
                        <div class="contact-popup">
                            <h3>\${contact.fullName}</h3>
                            <div class="contact-type type-\${contact.contactType.toLowerCase()}">\${typeLabels[contact.contactType] || typeLabels.default}</div>
                            <div class="contact-details">
                                <strong>Title:</strong> \${contact.contact.ConTitle || 'N/A'}<br>
                                <strong>Phone:</strong> \${contact.contact.PhoneNumber || 'N/A'}\${contact.contact.PhoneExt ? ' x' + contact.contact.PhoneExt : ''}<br>
                                <strong>Email:</strong> \${contact.contact.Email || 'N/A'}<br>
                                <strong>Address:</strong> \${contact.formattedAddress}<br>
                                \${contact.contact.Notes ? '<strong>Notes:</strong> ' + contact.contact.Notes : ''}<br>
                            </div>
                            <div style="margin-top: 10px; text-align: center;">
                                <a href="/sales/contacts/\${contact.contact.Cont_Id}_\${contact.contact.Company_ID}_\${contact.contact.Address_ID || 0}" target="_parent" style="background: #007cba; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block;">
                                    View Full Contact Details
                                </a>
                            </div>
                        </div>
                    \`;
                    
                    marker.bindPopup(popupContent);
                    marker.bindTooltip(contact.fullName);
                } else {
                    // Multiple contacts - show cluster popup with selection
                    let clusterPopupContent = \`
                        <div class="contact-popup" style="max-width: 400px;">
                            <h3>\${contactCount} Contacts at this Location</h3>
                            <div style="max-height: 300px; overflow-y: auto; margin: 10px 0;">
                    \`;
                    
                    contacts.forEach((contact, index) => {
                        const typeLabel = typeLabels[contact.contactType] || typeLabels.default;
                        clusterPopupContent += \`
                            <div style="border-bottom: 1px solid #eee; padding: 8px 0; \${index === contacts.length - 1 ? 'border-bottom: none;' : ''}">
                                <div style="font-weight: bold; margin-bottom: 4px;">\${contact.fullName}</div>
                                <div class="contact-type type-\${contact.contactType.toLowerCase()}" style="margin-bottom: 4px;">\${typeLabel}</div>
                                <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
                                    \${contact.contact.ConTitle || 'N/A'} • \${contact.contact.PhoneNumber || 'N/A'}\${contact.contact.PhoneExt ? ' x' + contact.contact.PhoneExt : ''}
                                </div>
                                <div style="text-align: center;">
                                    <a href="/sales/contacts/\${contact.contact.Cont_Id}_\${contact.contact.Company_ID}_\${contact.contact.Address_ID || 0}" target="_parent" style="background: #007cba; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 10px; display: inline-block;">
                                        View Details
                                    </a>
                                </div>
                            </div>
                        \`;
                    });
                    
                    clusterPopupContent += \`
                            </div>
                        </div>
                    \`;
                    
                    marker.bindPopup(clusterPopupContent);
                    marker.bindTooltip(\`\${contactCount} contacts at this location\`);
                }
                
                allMarkers.push(marker);
                allCircles.push(radiusCircle);
            }
            
            // Update legend count
            const legendDiv = document.querySelector('.legend div:last-child');
            if (legendDiv) {
                legendDiv.innerHTML = 'Total Contacts: ' + contactsData.length;
            }
        }
        
        // Create initial markers (synchronous - no API calls)
        createMarkersFromData(contactsData);
        
        // Listen for marker update messages from parent
        window.addEventListener('message', function(event) {
            if (event.data.type === 'updateMarkers') {
                createMarkersFromData(event.data.contactsData);
            }
        });
        
        console.log('Contacts map loaded with', contactsData.length, 'contacts');
    </script>
</body>
</html>`;

    // Create iframe and inject HTML
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.srcdoc = mapHTML;
    
    if (mapContainerRef.current) {
      mapContainerRef.current.appendChild(iframe);
      setMapLoaded(true);
    }
    
      // Mark as no longer initial load after first render
      setIsInitialLoad(false);
    };

    // Execute the initialization
    initializeMapWithPreloadedData();
  }, [contactsWithAddresses, isInitialLoad]);

  // Update map markers when filters change (without recreating iframe)
  useEffect(() => {
    if (!mapContainerRef.current || contactsWithAddresses.length === 0 || isInitialLoad) return;

    const iframe = mapContainerRef.current.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    // Pre-compute coordinates for filtered data to avoid API calls
    const normalizeCountryCode = (country: string) => {
      if (!country) return 'US';
      const normalized = country.toUpperCase().trim();
      switch (normalized) {
        case 'USA': case 'UNITED STATES': case 'UNITED STATES OF AMERICA': return 'US';
        case 'CANADA': case 'CAN': return 'CA';
        case 'MEXICO': case 'MEX': return 'MX';
        default: return normalized.length === 2 ? normalized : 'US';
      }
    };

    const filteredDataWithCoords = filteredContactsWithAddresses.map(item => {
      const address = item.address;
      const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
      const country = normalizeCountryCode(address.Country || address.country);
      const cacheKey = `${country}_${zipCode}`;
      
      // Get coordinates from cache or compute fallback - use exact coordinates without spread
      let coords = postalCodeCacheRef.current.get(cacheKey);
      if (!coords) {
        const geocodeKey = JSON.stringify({
          city: address.City || address.city,
          state: address.State || address.state || address.stateProvince,
          country: country,
          zipCode: zipCode
        });
        
        coords = geocodeCache.current.get(geocodeKey);
        if (!coords) {
          coords = computeFallbackCoordinates(address);
          geocodeCache.current.set(geocodeKey, coords);
        }
      }
      
      return {
        ...item,
        coordinates: coords
      };
    });
    
    iframe.contentWindow.postMessage({
      type: 'updateMarkers',
      contactsData: filteredDataWithCoords
    }, '*');

    console.log('ContactsMapView: Updating map with filtered contacts:', filteredDataWithCoords.length);
  }, [selectedContactType, searchQuery, filteredContactsWithAddresses, contactsWithAddresses, isInitialLoad]);

  const contactsWithValidAddresses = contactsWithAddresses.filter(item => 
    item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince)
  );

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
      {/* Map Stats and Filter Header */}
      <div className="border-b px-6 py-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-16">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">Total Contacts:</span>
              <span className="text-xl font-semibold text-primary">{contacts.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">With Addresses:</span>
              <span className="text-xl font-semibold text-primary">{contactsWithValidAddresses.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">Showing:</span>
              <span className="text-xl font-semibold text-primary">{filteredContactsWithAddresses.length}</span>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex flex-col">
              <label className="text-xs text-neutral-400 mb-1">Search by Name</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type contact name..."
                className="px-3 py-1 text-sm font-normal text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                style={{ minWidth: '200px' }}
              />
            </div>
            
            {/* Contact Type Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-neutral-400 mb-1">Contact Type</label>
              <select
                value={selectedContactType}
                onChange={(e) => setSelectedContactType(e.target.value)}
                className="px-3 py-1 text-sm font-normal text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="A">Accounting</option>
                <option value="E">Engineering</option>
                <option value="S">Sales</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 min-h-0 w-full relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600 mb-2">Loading Map...</div>
              <div className="text-sm text-gray-500">Fetching contact addresses and plotting locations</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;