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
  const [legacyAddresses, setLegacyAddresses] = useState<any[] | null>(null);
  
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
      case 'A': return 'Administrative';
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

      setLegacyAddresses(Array.from(addressMap.values()));
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
          addresses={legacyAddresses || []}
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
  addresses, 
  onFetchAddresses 
}: { 
  contacts: any[]; 
  addresses: any[]; 
  onFetchAddresses: (limit?: number) => Promise<any> 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [contactsWithAddresses, setContactsWithAddresses] = useState<any[]>([]);
  const [selectedContactType, setSelectedContactType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapView, setMapView] = useState({ center: [39.8283, -98.5795], zoom: 4 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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
          console.log('ContactsMapView: Sample address data:', combined.find(c => c.address));
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

    // Use all contacts data for initial map creation
    const contactsData = contactsWithAddresses.filter(item => 
      item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince)
    );

    console.log('ContactsMapView: Creating map with filtered contacts:', contactsData.length);
    console.log('ContactsMapView: Total contacts with addresses:', contactsWithAddresses.length);
    console.log('ContactsMapView: Sample filtered contact for map:', contactsData[0]);
    console.log('ContactsMapView: Sample address from filtered contact:', contactsData[0]?.address);

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
        .contact-popup .type-admin { background: #e3f2fd; color: #1976d2; }
        .contact-popup .type-engineering { background: #e8f5e8; color: #388e3c; }
        .contact-popup .type-sales { background: #fff3e0; color: #f57c00; }
        .contact-popup .type-unknown { background: #f5f5f5; color: #757575; }
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

        // Contact data
        const contactsData = ${JSON.stringify(contactsData)};
        
        // Color palette for different contact types
        const typeColors = {
            'A': '#1976d2', // Admin - Blue
            'E': '#388e3c', // Engineering - Green  
            'S': '#f57c00', // Sales - Orange
            'default': '#757575' // Unknown - Gray
        };

        const typeLabels = {
            'A': 'Administrative',
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

        // Function to get coordinates from postal code API
        async function getCoordinatesFromPostalCodeAPI(address) {
            // Handle both legacy address format and Address table format
            const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
            const country = normalizeCountryCode(address.Country || address.country);
            
            if (!zipCode) return null;
            
            try {
                // Try to get coordinates from our postal code database
                const response = await fetch(\`http://localhost:8080/api/postal-codes/coordinates/\${country}/\${zipCode}\`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        return [result.data.latitude, result.data.longitude];
                    }
                }
            } catch (error) {
                console.log('PostalCode API lookup failed for', zipCode, ':', error.message);
            }
            
            return null;
        }

        // Enhanced geocoding using ZIP codes and city data for more accurate positioning
        async function getCoordinatesFromAddress(address, contactId) {
            // First, try to get exact coordinates from our postal code database
            const apiCoords = await getCoordinatesFromPostalCodeAPI(address);
            if (apiCoords) {
                // Add small random offset to prevent exact overlap
                const hash = simpleHash(contactId + (address.Address1 || address.addressLine1 || ''));
                const offsetLat = ((hash % 1000) / 50000) - 0.01; // Very small offset (~0.01 degrees, ~0.7 miles)
                const offsetLng = (((hash >> 10) % 1000) / 50000) - 0.01;
                
                return [
                    apiCoords[0] + offsetLat,
                    apiCoords[1] + offsetLng
                ];
            }
            
            // Fallback to existing geocoding logic
            // Major city coordinates for more accurate positioning
            const majorCities = {
                // US Major Cities
                'NEW YORK': [40.7128, -74.0060], 'LOS ANGELES': [34.0522, -118.2437], 'CHICAGO': [41.8781, -87.6298],
                'HOUSTON': [29.7604, -95.3698], 'PHOENIX': [33.4484, -112.0740], 'PHILADELPHIA': [39.9526, -75.1652],
                'SAN ANTONIO': [29.4241, -98.4936], 'SAN DIEGO': [32.7157, -117.1611], 'DALLAS': [32.7767, -96.7970],
                'SAN JOSE': [37.3382, -121.8863], 'AUSTIN': [30.2672, -97.7431], 'JACKSONVILLE': [30.3322, -81.6557],
                'FORT WORTH': [32.7555, -97.3308], 'COLUMBUS': [39.9612, -82.9988], 'SAN FRANCISCO': [37.7749, -122.4194],
                'CHARLOTTE': [35.2271, -80.8431], 'INDIANAPOLIS': [39.7684, -86.1581], 'SEATTLE': [47.6062, -122.3321],
                'DENVER': [39.7392, -104.9903], 'BOSTON': [42.3601, -71.0589], 'EL PASO': [31.7619, -106.4850],
                'DETROIT': [42.3314, -83.0458], 'NASHVILLE': [36.1627, -86.7816], 'PORTLAND': [45.5152, -122.6784],
                'MEMPHIS': [35.1495, -90.0490], 'OKLAHOMA CITY': [35.4676, -97.5164], 'LAS VEGAS': [36.1699, -115.1398],
                'LOUISVILLE': [38.2027, -85.7585], 'BALTIMORE': [39.2904, -76.6122], 'MILWAUKEE': [43.0389, -87.9065],
                'ALBUQUERQUE': [35.0844, -106.6504], 'TUCSON': [32.2226, -110.9747], 'FRESNO': [36.7378, -119.7871],
                'MESA': [33.4152, -111.8315], 'SACRAMENTO': [38.5816, -121.4944], 'ATLANTA': [33.7490, -84.3880],
                'KANSAS CITY': [39.0997, -94.5786], 'COLORADO SPRINGS': [38.8339, -104.8214], 'MIAMI': [25.7617, -80.1918],
                'RALEIGH': [35.7796, -78.6382], 'OMAHA': [41.2565, -95.9345], 'LONG BEACH': [33.7701, -118.1937],
                'VIRGINIA BEACH': [36.8529, -75.9780], 'OAKLAND': [37.8044, -122.2712], 'MINNEAPOLIS': [44.9778, -93.2650],
                'TULSA': [36.1540, -95.9928], 'TAMPA': [27.9506, -82.4572], 'ARLINGTON': [32.7357, -97.1081],
                'NEW ORLEANS': [29.9511, -90.0715], 'WICHITA': [37.6872, -97.3301], 'CLEVELAND': [41.4993, -81.6944],
                // Canada Major Cities
                'TORONTO': [43.6532, -79.3832], 'MONTREAL': [45.5017, -73.5673], 'VANCOUVER': [49.2827, -123.1207],
                'CALGARY': [51.0447, -114.0719], 'EDMONTON': [53.5461, -113.4938], 'OTTAWA': [45.4215, -75.6972],
                'WINNIPEG': [49.8951, -97.1384], 'QUEBEC CITY': [46.8139, -71.2080], 'HAMILTON': [43.2557, -79.8711],
                'KITCHENER': [43.4516, -80.4925], 'LONDON': [42.9849, -81.2453], 'HALIFAX': [44.6488, -63.5752]
            };

            // ZIP code to coordinate mapping for more precise locations (sample of common ZIP codes)
            const zipCoords = {
                // New York area
                '10001': [40.7505, -73.9934], '10002': [40.7158, -73.9864], '10003': [40.7316, -73.9890],
                '10004': [40.6890, -74.0165], '10005': [40.7063, -74.0086], '10006': [40.7084, -74.0123],
                // Los Angeles area
                '90210': [34.0901, -118.4065], '90211': [34.0837, -118.4001], '90212': [34.1030, -118.4171],
                '90401': [34.0195, -118.4912], '90402': [34.0236, -118.4804], '90403': [34.0112, -118.4958],
                // Chicago area
                '60601': [41.8825, -87.6232], '60602': [41.8796, -87.6312], '60603': [41.8739, -87.6298],
                '60604': [41.8781, -87.6298], '60605': [41.8708, -87.6172], '60606': [41.8781, -87.6387],
                // Houston area
                '77001': [29.7320, -95.3983], '77002': [29.7549, -95.3694], '77003': [29.7405, -95.3444],
                '77004': [29.7085, -95.3833], '77005': [29.7199, -95.4032], '77006': [29.7405, -95.3902],
                // Miami area
                '33101': [25.7839, -80.2102], '33102': [25.7879, -80.2264], '33109': [25.8659, -80.1204],
                '33111': [25.6837, -80.3155], '33112': [25.7906, -80.3245], '33114': [25.6903, -80.3155],
                // Texas major cities
                '75201': [32.7831, -96.8067], '75202': [32.7831, -96.7967], '78701': [30.2691, -97.7431],
                // California
                '94102': [37.7849, -122.4094], '94103': [37.7699, -122.4103], '90028': [34.0969, -118.3267],
                // Canada postal codes (sample)
                'M5V': [43.6426, -79.3871], 'H3A': [45.5048, -73.5747], 'V6B': [49.2827, -123.1207]
            };

            const state = (address.State || address.state || address.stateProvince || '').toUpperCase();
            const city = (address.City || address.city || '').toUpperCase();
            const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
            const country = normalizeCountryCode(address.Country || address.country);

            let baseCoords = null;

            // 1. Try ZIP/Postal code lookup first (most accurate)
            if (zipCode) {
                // For US ZIP codes, try full 5-digit match first
                if (country === 'US' && zipCode.length >= 5) {
                    const zip5 = zipCode.substring(0, 5);
                    if (zipCoords[zip5]) {
                        baseCoords = zipCoords[zip5];
                    }
                }
                // For Canada, try first 3 characters of postal code
                else if (country === 'CA' && zipCode.length >= 3) {
                    const postal3 = zipCode.substring(0, 3);
                    if (zipCoords[postal3]) {
                        baseCoords = zipCoords[postal3];
                    }
                }
            }

            // 2. Try city lookup (good accuracy)
            if (!baseCoords && city) {
                if (majorCities[city]) {
                    baseCoords = majorCities[city];
                }
                // Try city with state for disambiguation
                else if (majorCities[city + ', ' + state]) {
                    baseCoords = majorCities[city + ', ' + state];
                }
            }

            // 3. Fall back to state/province center (low accuracy)
            if (!baseCoords) {
                const stateCoords = {
                    'AL': [32.806671, -86.791130], 'AK': [61.370716, -152.404419], 'AZ': [33.729759, -111.431221],
                    'AR': [34.969704, -92.373123], 'CA': [36.116203, -119.681564], 'CO': [39.059811, -105.311104],
                    'CT': [41.597782, -72.755371], 'DE': [39.318523, -75.507141], 'FL': [27.766279, -81.686783],
                    'GA': [33.040619, -83.643074], 'HI': [21.094318, -157.498337], 'ID': [44.240459, -114.478828],
                    'IL': [40.349457, -88.986137], 'IN': [39.849426, -86.258278], 'IA': [42.011539, -93.210526],
                    'KS': [38.526600, -96.726486], 'KY': [37.668140, -84.670067], 'LA': [31.169546, -91.867805],
                    'ME': [44.323535, -69.765261], 'MD': [39.063946, -76.802101], 'MA': [42.230171, -71.530106],
                    'MI': [43.326618, -84.536095], 'MN': [45.694454, -93.900192], 'MS': [32.741646, -89.678696],
                    'MO': [38.572954, -92.189283], 'MT': [47.052952, -110.454353], 'NE': [41.125370, -98.268082],
                    'NV': [38.313515, -117.055374], 'NH': [43.452492, -71.563896], 'NJ': [40.298904, -74.521011],
                    'NM': [34.840515, -106.248482], 'NY': [42.165726, -74.948051], 'NC': [35.630066, -79.806419],
                    'ND': [47.528912, -99.784012], 'OH': [40.388783, -82.764915], 'OK': [35.565342, -96.928917],
                    'OR': [44.572021, -122.070938], 'PA': [40.590752, -77.209755], 'RI': [41.680893, -71.511780],
                    'SC': [33.856892, -80.945007], 'SD': [44.299782, -99.438828], 'TN': [35.747845, -86.692345],
                    'TX': [31.054487, -97.563461], 'UT': [40.150032, -111.862434], 'VT': [44.045876, -72.710686],
                    'VA': [37.769337, -78.169968], 'WA': [47.400902, -121.490494], 'WV': [38.491226, -80.954570],
                    'WI': [44.268543, -89.616508], 'WY': [42.755966, -107.302490],
                    // Canada provinces
                    'ON': [51.253775, -85.323214], 'QC': [52.9399, -73.5491], 'BC': [53.7267, -127.6476],
                    'AB': [53.9333, -116.5765], 'MB': [53.7609, -98.8139], 'SK': [52.9399, -106.4509],
                    'NS': [44.6820, -63.7443], 'NB': [46.5653, -66.4619], 'NL': [53.1355, -57.6604],
                    'PE': [46.5107, -63.4168], 'NT': [61.9370, -113.6710], 'YT': [64.0685, -139.0686],
                    'NU': [70.2998, -83.1076]
                };
                baseCoords = stateCoords[state] || [39.8283, -98.5795]; // Default to US center
            }

            // Create deterministic offset based on full address for fine-grained positioning
            const fullAddressString = [
                contactId,
                address.Address1 || address.addressLine1 || '',
                address.Address2 || address.addressLine2 || '',
                address.Address3 || address.addressLine3 || '',
                city,
                state,
                zipCode
            ].join('|');
            
            const hash = simpleHash(fullAddressString);
            
            // Create smaller, more precise offsets based on address precision
            let spreadRadius = 0.2; // Default spread (~14 miles)
            
            // Reduce spread radius for more precise locations
            if (zipCode && zipCoords[zipCode.substring(0, 5)] || zipCoords[zipCode.substring(0, 3)]) {
                spreadRadius = 0.005; // Very precise for exact ZIP matches (~0.3 miles)
            } else if (majorCities[city]) {
                spreadRadius = 0.02; // Moderately precise for major cities (~1.4 miles)
            } else {
                spreadRadius = 0.1; // Broader spread for state-level positioning (~7 miles)
            }
            
            // Convert hash to consistent pseudo-random values
            const offsetLat = ((hash % 1000) / 500) - 1; // -1 to 1
            const offsetLng = (((hash >> 10) % 1000) / 500) - 1; // -1 to 1
            
            return [
                baseCoords[0] + offsetLat * spreadRadius,
                baseCoords[1] + offsetLng * spreadRadius
            ];
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
                <div><span style="color: \${typeColors.A};">●</span> Administrative</div>
                <div><span style="color: \${typeColors.E};">●</span> Engineering</div>
                <div><span style="color: \${typeColors.S};">●</span> Sales</div>
                <div><span style="color: \${typeColors.default};">●</span> Unknown</div>
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
        
        // Function to create markers from contact data
        async function createMarkersFromData(contactsData) {
            // Clear existing markers and circles
            allMarkers.forEach(marker => map.removeLayer(marker));
            allCircles.forEach(circle => map.removeLayer(circle));
            allMarkers = [];
            allCircles = [];
            
            // Create new markers
            for (const item of contactsData) {
                const { contact, address, fullName, formattedAddress } = item;
                
                if (!address || !(address.City || address.city) || !(address.State || address.state || address.stateProvince)) continue;
                
                const coords = await getCoordinatesFromAddress(address, contact.Cont_Id);
                const contactType = contact.Type?.toUpperCase() || 'default';
                const color = typeColors[contactType] || typeColors.default;
                const typeLabel = typeLabels[contactType] || typeLabels.default;
                
                // Create custom marker
                const marker = L.circleMarker(coords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    radius: 8,
                    weight: 2
                }).addTo(map);
                
                // Add 30-mile radius circle
                const radiusCircle = L.circle(coords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    weight: 1,
                    radius: 48280,
                    interactive: false
                }).addTo(map);
                
                // Create popup content
                const popupContent = \`
                    <div class="contact-popup">
                        <h3>\${fullName}</h3>
                        <div class="contact-type type-\${contactType.toLowerCase()}">\${typeLabel}</div>
                        <div class="contact-details">
                            <strong>Title:</strong> \${contact.ConTitle || 'N/A'}<br>
                            <strong>Phone:</strong> \${contact.PhoneNumber || 'N/A'}\${contact.PhoneExt ? ' x' + contact.PhoneExt : ''}<br>
                            <strong>Email:</strong> \${contact.Email || 'N/A'}<br>
                            <strong>Address:</strong> \${formattedAddress}<br>
                            \${contact.Notes ? '<strong>Notes:</strong> ' + contact.Notes : ''}<br>
                        </div>
                        <div style="margin-top: 10px; text-align: center;">
                            <a href="/sales/contacts/\${contact.Cont_Id}_\${contact.Company_ID}_\${contact.Address_ID || 0}" target="_parent" style="background: #007cba; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block;">
                                View Full Contact Details
                            </a>
                        </div>
                    </div>
                \`;
                
                marker.bindPopup(popupContent);
                marker.bindTooltip(fullName);
                
                allMarkers.push(marker);
                allCircles.push(radiusCircle);
            }
            
            // Update legend count
            const legendDiv = document.querySelector('.legend div:last-child');
            if (legendDiv) {
                legendDiv.innerHTML = 'Total Contacts: ' + contactsData.length;
            }
        }
        
        // Create initial markers
        createMarkersFromData(contactsData).catch(console.error);
        
        // Listen for marker update messages from parent
        window.addEventListener('message', function(event) {
            if (event.data.type === 'updateMarkers') {
                createMarkersFromData(event.data.contactsData).catch(console.error);
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
    
    mapContainerRef.current.appendChild(iframe);
    setMapLoaded(true);
    
    // Mark as no longer initial load after first render
    setIsInitialLoad(false);
  }, [contactsWithAddresses, isInitialLoad]);

  // Update map markers when filters change (without recreating iframe)
  useEffect(() => {
    if (!mapContainerRef.current || contactsWithAddresses.length === 0 || isInitialLoad) return;

    const iframe = mapContainerRef.current.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    // Send filtered data to the existing map
    const filteredData = filteredContactsWithAddresses;
    
    iframe.contentWindow.postMessage({
      type: 'updateMarkers',
      contactsData: filteredData
    }, '*');

    console.log('ContactsMapView: Updating map with filtered contacts:', filteredData.length);
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
                <option value="A">Administrative</option>
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