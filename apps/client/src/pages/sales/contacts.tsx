import {
  MoreHorizontal,
  PlusCircleIcon,
  Building2,
  List as ListIcon,
  MapPin,
  Settings,
  UserX,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

import { Table, Button, PageHeader, AddContactModal } from "@/components";
import { DeleteContactModal } from "@/components/modals/delete-contact-modal";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { ContactType } from "@/types/enums";

const DEBOUNCE_MS = 200;

const getContactTypeName = (type: string) => {
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

const Contacts = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("fullName");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [legacyContacts, setLegacyContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 25
  });
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [contactToDisable, setContactToDisable] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    fullName: true,
    companyName: true,
    typeName: true,
    phoneNumber: true,
    email: true,
  });

  const api = useApi();
  const currentSearchRef = useRef<string>("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target?.closest('.relative')) {
        setActiveDropdown(null);
      }
      if (showColumnMenu && !target?.closest('.relative')) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, showColumnMenu]);

  const handleDisableContact = (contact: any) => {
    setContactToDisable(contact);
    setShowDisableModal(true);
    setActiveDropdown(null);
  };

  const handleConfirmDisable = async (type: ContactType) => {
    if (!contactToDisable?.id) return;

    setIsUpdating(true);
    try {
      const result = await api.patch(`/sales/contacts/${contactToDisable.id}`, {
        type: type
      });

      if (result !== null) {
        const typeName = type === ContactType.Inactive ? 'Inactive' : 'Left Company';
        setLegacyContacts(prev =>
          prev?.map(contact =>
            contact.id === contactToDisable.id
              ? { ...contact, type, typeName }
              : contact
          ) || null
        );
        setShowDisableModal(false);
        setContactToDisable(null);
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const adaptContact = (raw: any, companyName?: string) => {
    if (!raw) {
      console.warn('Received null/undefined contact data');
      return null;
    }

    return {
      id: raw.id,
      companyId: raw.companyId,
      legacyCompanyId: raw.legacyCompanyId,
      companyName: companyName || `Company ${raw.legacyCompanyId}`,
      addressId: raw.addressId || null,
      firstName: raw.firstName || "",
      lastName: raw.lastName || "",
      fullName: `${raw.firstName || ""} ${raw.lastName || ""}`.trim() || "Unnamed Contact",
      type: raw.type || "",
      typeName: getContactTypeName(raw.type),
      phone: raw.phone || "",
      phoneExtension: raw.phoneExtension || "",
      email: raw.email || "",
      title: raw.title || "",
      isPrimary: raw.isPrimary || false,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      ...raw
    };
  };

  const fetchCompanyNames = async (companyIds: number[]) => {
    if (companyIds.length === 0) return new Map<number, string>();

    try {
      const companyResponse = await api.get('/legacy/base/Company', {
        filter: JSON.stringify({
          operator: "in",
          field: "Company_ID",
          values: companyIds
        }),
        fields: 'Company_ID,CustDlrName',
        limit: companyIds.length
      });

      const companies = companyResponse?.data
        ? (Array.isArray(companyResponse.data) ? companyResponse.data : [])
        : (Array.isArray(companyResponse) ? companyResponse : []);

      const companyNameMap = new Map<number, string>();
      companies.forEach((company: any) => {
        if (company?.Company_ID && company?.CustDlrName) {
          companyNameMap.set(company.Company_ID, company.CustDlrName);
        }
      });

      return companyNameMap;
    } catch (error) {
      console.error("Error fetching company names:", error);
      return new Map<number, string>();
    }
  };

  const processContactsResponse = async (rawContacts: any) => {
    const isApiResponse = rawContacts && typeof rawContacts === 'object' && 'data' in rawContacts;
    const contactsArray = isApiResponse
      ? (Array.isArray(rawContacts.data) ? rawContacts.data : [])
      : (Array.isArray(rawContacts) ? rawContacts : []);

    const validContacts = contactsArray.filter((contact: any) => contact != null);
    const uniqueCompanyIds = [...new Set(validContacts.map((c: any) => c.legacyCompanyId).filter(Boolean))].map((id: any) => parseInt(id, 10));
    const companyNameMap = await fetchCompanyNames(uniqueCompanyIds);

    const mapped = validContacts.map((contact: any) => {
      const companyName = contact.legacyCompanyId ? companyNameMap.get(parseInt(contact.legacyCompanyId, 10)) : undefined;
      return adaptContact(contact, companyName);
    }).filter((contact: any) => contact != null);

    return { mapped, isApiResponse };
  };

  const fetchAllContacts = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    const searchSnapshot = debouncedSearchTerm;
    currentSearchRef.current = searchSnapshot;

    try {
      let sortField = "firstName";

      if (sort === "companyName") {
        sortField = "companyId";
      } else if (sort === "typeName") {
        sortField = "type";
      } else if (sort === "phoneNumber") {
        sortField = "phone";
      } else if (sort === "email") {
        sortField = "email";
      }

      const params: any = {
        page,
        limit,
        sort: sortField,
        order
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
        params.fuzzy = true;
        params.fuzzyThreshold = 0.25;
      }

      const rawContacts = await api.get("/sales/contacts", params, signal ? { signal } : undefined);

      if (currentSearchRef.current !== searchSnapshot) return;

      if (rawContacts) {
        const { mapped, isApiResponse } = await processContactsResponse(rawContacts);
        setLegacyContacts(mapped);

        if (isApiResponse && rawContacts.meta) {
          setPagination({
            page: rawContacts.meta.page,
            totalPages: rawContacts.meta.totalPages,
            total: rawContacts.meta.total,
            limit: rawContacts.meta.limit
          });
        } else {
          setPagination({
            page: 1,
            totalPages: Math.ceil(mapped.length / limit),
            total: mapped.length,
            limit: limit
          });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setIsLoading(false);
        return;
      }
      console.error("Error fetching Contacts:", error);
    } finally {
      if (currentSearchRef.current === searchSnapshot) {
        setIsLoading(false);
      }
    }
  }, [api, page, limit, sort, order, debouncedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchAllContacts(abortController.signal);
    return () => abortController.abort();
  }, [page, limit, sort, order, debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const handleContactAdded = () => {
    fetchAllContacts();
  };

  const allColumns: TableColumn<any>[] = [
    {
      key: "fullName",
      header: "Name",
      className: "text-primary hover:underline w-[22%]",
      render: (_, row) => (
        <Link to={`/sales/contacts/${row.id}`}>
          <div className="font-medium">{row.fullName}</div>
          {row.title && <div className="text-xs text-text-muted">{row.title}</div>}
        </Link>
      ),
    },
    {
      key: "companyName",
      header: "Company",
      className: "hover:underline w-[22%]",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.legacyCompanyId}`} className="flex items-center gap-1">
          <Building2 size={14} />
          {row.companyName}
        </Link>
      ),
    },
    {
      key: "typeName",
      header: "Type",
      className: "w-[8%]",
      render: (_, row) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
          row.type === ContactType.Accounting ? 'bg-blue-100 text-blue-800' :
          row.type === ContactType.Engineering ? 'bg-green-100 text-green-800' :
          row.type === ContactType.Sales ? 'bg-orange-100 text-orange-800' :
          row.type === ContactType.Parts_Service ? 'bg-purple-100 text-purple-800' :
          row.type === ContactType.Inactive ? 'bg-gray-100 text-gray-800' :
          row.type === ContactType.Left_Company ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.typeName}
        </span>
      ),
    },
    {
      key: "phoneNumber",
      header: "Phone",
      className: "hover:underline w-[10%]",
      render: (_, row) => {
        const phone = row.phone;
        const ext = row.phoneExtension;
        const displayPhone = phone ? `${phone}${ext ? ` x${ext}` : ''}` : '';
        return displayPhone ? <Link to={`tel:${phone}`}>{displayPhone}</Link> : "-";
      },
    },
    {
      key: "email",
      header: "Email",
      className: "hover:underline w-[18%]",
      render: (_, row) =>
        row.email ? <Link to={`mailto:${row.email}`}>{row.email}</Link> : "-",
    },
    {
      key: "actions",
      header: "",
      className: "w-[5%]",
      render: (_, row) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === row.id ? null : row.id);
            }}
            className="p-1 hover:bg-surface rounded"
          >
            <MoreHorizontal size={16} />
          </button>

          {activeDropdown === row.id && (
            <div className="absolute right-0 top-8 z-10 bg-foreground border border-border rounded-md shadow-lg py-1 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisableContact(row);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2"
              >
                <UserX size={14} />
                Disable
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const columns = allColumns.filter(col =>
    col.key === 'actions' || visibleColumns[col.key as keyof typeof visibleColumns]
  );

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
      {viewMode === "list" && (
        <div className="relative">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => setShowColumnMenu(!showColumnMenu)}
          >
            <Settings size={16} />
            Columns
          </Button>
          {showColumnMenu && (
            <div className="absolute right-0 top-10 z-50 bg-foreground border border-border rounded-md shadow-lg py-2 min-w-[180px]">
              <div className="px-3 py-1 text-xs font-semibold text-text-muted">Show Columns</div>
              {Object.entries(visibleColumns).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-surface cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text capitalize">
                    {key === 'fullName' ? 'Name' :
                     key === 'companyName' ? 'Company' :
                     key === 'typeName' ? 'Type' :
                     key === 'phoneNumber' ? 'Phone' :
                     key === 'email' ? 'Email' : key}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
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
    <div className="w-full flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Contacts"
        description={`Showing ${legacyContacts.length} of ${pagination.total} contacts`}
        actions={<HeaderActions />}
      />

      {viewMode === "list" && (
        <>
          <div className="px-6 py-4 border-b flex-shrink-0">
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search contacts..."
                className="w-full px-3 py-2 pr-9 text-sm text-text border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-muted"
                autoComplete="no"
              />
              {isLoading && debouncedSearchTerm && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-muted" size={16} />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <Table<any>
              columns={columns}
              data={legacyContacts || []}
              total={pagination.total}
              idField="id"
              className="bg-foreground rounded shadow-sm border"
              pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              sort={sort}
              order={order}
              onSortChange={(newSort, newOrder) => {
                setSort(newSort);
                setOrder(newOrder);
              }}
            />
          </div>
        </>
      )}

      {viewMode === "map" && <ContactsMapView api={api} />}

      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onContactAdded={handleContactAdded}
      />

      <DeleteContactModal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setContactToDisable(null);
        }}
        onConfirm={handleConfirmDisable}
        contact={contactToDisable}
        isUpdating={isUpdating}
      />
    </div>
  );
};

const ContactsMapView = ({
  api
}: {
  api: ReturnType<typeof useApi>;
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [contactsWithAddresses, setContactsWithAddresses] = useState<any[]>([]);
  const [selectedContactType, setSelectedContactType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedMapSearch, setDebouncedMapSearch] = useState<string>('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [mapView, setMapView] = useState({ center: [39.8283, -98.5795], zoom: 4 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const postalCodeCacheRef = useRef<Map<string, [number, number] | null>>(new Map());
  const geocodeCache = useRef<Map<string, [number, number]>>(new Map());

  const computeFallbackCoordinates = (address: any): [number, number] => {
    const majorCities: Record<string, [number, number]> = {
      'NEW YORK': [40.7128, -74.0060], 'LOS ANGELES': [34.0522, -118.2437], 'CHICAGO': [41.8781, -87.6298],
      'HOUSTON': [29.7604, -95.3698], 'PHOENIX': [33.4484, -112.0740], 'PHILADELPHIA': [39.9526, -75.1652],
      'SAN ANTONIO': [29.4241, -98.4936], 'SAN DIEGO': [32.7157, -117.1611], 'DALLAS': [32.7767, -96.7970],
      'TORONTO': [43.6532, -79.3832], 'MONTREAL': [45.5017, -73.5673], 'VANCOUVER': [49.2827, -123.1207],
    };
    const stateCoords: Record<string, [number, number]> = {
      'CA': [36.116203, -119.681564], 'TX': [31.054487, -97.563461], 'NY': [42.165726, -74.948051],
      'FL': [27.766279, -81.686783], 'IL': [40.349457, -88.986137], 'ON': [51.253775, -85.323214],
    };

    const state = (address.State || address.state || address.stateProvince || '').toUpperCase();
    const city = (address.City || address.city || '').toUpperCase();

    if (city && majorCities[city]) return majorCities[city];
    if (state && stateCoords[state]) return stateCoords[state];
    return [39.8283, -98.5795];
  };

  const batchLookupPostalCodes = async (postalCodes: Array<{country: string, postalCode: string}>) => {
    const uniqueCodes = [...new Set(postalCodes.map(p => `${p.country}_${p.postalCode}`))];
    const uncachedCodes = uniqueCodes.filter(key => !postalCodeCacheRef.current.has(key));

    if (uncachedCodes.length === 0) return;

    const batchSize = 10;
    for (let i = 0; i < uncachedCodes.length; i += batchSize) {
      const batch = uncachedCodes.slice(i, i + batchSize);

      await Promise.all(batch.map(async (key) => {
        const [country, postalCode] = key.split('_');
        const cacheKey = `${country}_${postalCode}`;

        if (postalCodeCacheRef.current.has(cacheKey)) return;

        const queryCountry = country === 'US' ? 'USA' : country;

        try {
          const result = await api.get('/legacy/std/ZipData/filter/custom', {
            ZipCode: postalCode,
            Country: queryCountry,
            fields: 'ZipCode,PrimaryCity,StateProv,Country,Latitude,Longitude',
            limit: 1
          }) as any;

          if (result && Array.isArray(result) && result.length > 0) {
            const zipData = result[0];
            if (zipData.Latitude && zipData.Longitude) {
              const lat = parseFloat(zipData.Latitude);
              const lng = parseFloat(zipData.Longitude);
              postalCodeCacheRef.current.set(cacheKey, [lat, lng]);
            } else {
              postalCodeCacheRef.current.set(cacheKey, null);
            }
          } else {
            postalCodeCacheRef.current.set(cacheKey, null);
          }
        } catch (error) {
          postalCodeCacheRef.current.set(cacheKey, null);
        }
      }));
    }
  };

  const getCoordinatesForAddress = (address: any): [number, number] => {
    const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
    const country = normalizeCountryCode(address.Country || address.country);
    const cacheKey = `${country}_${zipCode}`;

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

    return coords;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMapSearch(searchQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadFilteredContactsWithAddresses = async () => {
      if (isLoadingContacts) return;

      setIsLoadingContacts(true);
      try {
        const params: any = {
          limit: 50,
          sort: 'createdAt',
          order: 'desc'
        };

        if (debouncedMapSearch) {
          params.search = debouncedMapSearch;
          params.fuzzy = true;
          params.fuzzyThreshold = 0.25;
        }

        if (selectedContactType !== 'all') {
          params.filter = JSON.stringify({
            type: selectedContactType
          });
        }

        const salesContactsResponse: any = await api.get('/sales/contacts', params);

        const contactsArray = salesContactsResponse?.data
          ? (Array.isArray(salesContactsResponse.data) ? salesContactsResponse.data : [])
          : (Array.isArray(salesContactsResponse) ? salesContactsResponse : []);

        const validContacts = contactsArray.filter((contact: any) =>
          contact != null && contact.addressId && contact.legacyCompanyId
        );

        const addressContactPairs = validContacts.map((contact: any) => ({
          addressId: contact.addressId,
          companyId: contact.legacyCompanyId,
          key: `${contact.addressId}_${contact.legacyCompanyId}`,
        }));

        const uniqueAddressPairs = addressContactPairs.filter((pair: any, index: number, arr: any[]) =>
          index === arr.findIndex((p: any) => p.key === pair.key)
        );

        const addressMap = new Map();

        if (uniqueAddressPairs.length > 0) {
          try {
            const addressIds = [...new Set(uniqueAddressPairs.map((p: any) => p.addressId))];
            const companyIds = [...new Set(uniqueAddressPairs.map((p: any) => p.companyId))];

            const rawAddresses = await api.get('/legacy/base/Address', {
              filter: JSON.stringify({
                operator: "and",
                conditions: [
                  {
                    operator: "in",
                    field: "Address_ID",
                    values: addressIds
                  },
                  {
                    operator: "in",
                    field: "Company_ID",
                    values: companyIds
                  }
                ]
              }),
              fields: 'Address_ID,Company_ID,Address1,Address2,City,State,ZipCode,Country',
              limit: uniqueAddressPairs.length
            }) as any;

            const addresses = rawAddresses?.data
              ? (Array.isArray(rawAddresses.data) ? rawAddresses.data : [])
              : (Array.isArray(rawAddresses) ? rawAddresses : []);

            addresses.forEach((address: any) => {
              if (address?.Address_ID && address?.Company_ID) {
                const key = `${address.Address_ID}_${address.Company_ID}`;
                addressMap.set(key, address);
                addressMap.set(address.Address_ID, address);
              }
            });
          } catch (error) {
            console.error("Error fetching addresses:", error);
          }
        }

        const combined = validContacts.map((contact: any, index: number) => {
          const compositeKey = `${contact.addressId}_${contact.legacyCompanyId}`;
          const address = addressMap.get(compositeKey) || addressMap.get(contact.addressId);
          return {
            contact,
            address,
            fullName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact',
            formattedAddress: address ? [
              address.Address1 || address.addressLine1,
              address.Address2 || address.addressLine2,
              address.City || address.city,
              address.State || address.state || address.stateProvince,
              address.ZipCode || address.zipCode || address.postalCode
            ].filter(Boolean).join(', ') : 'No address available',
            uniqueId: `map_contact_${contact.id}_${index}`
          };
        });

        setContactsWithAddresses(combined);
      } catch (error) {
        console.error('Error loading filtered contacts with addresses:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    loadFilteredContactsWithAddresses();
  }, [debouncedMapSearch, selectedContactType]);

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

  const filteredContactsWithAddresses = contactsWithAddresses.filter(item =>
    item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince)
  );

  useEffect(() => {
    if (!mapContainerRef.current || contactsWithAddresses.length === 0 || !isInitialLoad) return;

    const initializeMapWithPreloadedData = async () => {
      const contactsData = contactsWithAddresses.filter(item =>
        item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince)
      );

      const postalCodesToLookup = contactsData.map(item => {
        const address = item.address;
        const zipCode = (address.ZipCode || address.zipCode || address.postalCode || '').replace(/[^A-Z0-9]/g, '');
        const country = normalizeCountryCode(address.Country || address.country);
        return { country, postalCode: zipCode };
      }).filter(p => p.postalCode);

      await batchLookupPostalCodes(postalCodesToLookup);

      const contactsWithCoordinates = contactsData.map(item => ({
        ...item,
        coordinates: getCoordinatesForAddress(item.address)
      }));

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
        .contact-popup { max-width: 300px; }
        .contact-popup h3 { margin: 0 0 10px 0; color: #333; font-size: 16px; }
        .contact-popup .contact-details { font-size: 12px; color: #666; line-height: 1.4; }
        .contact-popup .contact-type { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; margin-bottom: 5px; }
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
        const map = L.map('map', {
            center: ${JSON.stringify(mapView.center)},
            zoom: ${mapView.zoom},
            minZoom: 3,
            maxZoom: 18,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 0.5
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        let viewChangeTimeout;
        map.on('moveend zoomend', function() {
            clearTimeout(viewChangeTimeout);
            viewChangeTimeout = setTimeout(() => {
                const center = map.getCenter();
                window.parent.postMessage({
                    type: 'mapViewChange',
                    center: [center.lat, center.lng],
                    zoom: map.getZoom()
                }, '*');
            }, 250);
        });

        const contactsData = ${JSON.stringify(contactsWithCoordinates)};
        const typeColors = {
            'A': '#1976d2', 'E': '#388e3c', 'S': '#f57c00',
            'P': '#9c27b0', 'I': '#757575', 'L': '#d32f2f', 'default': '#757575'
        };
        const typeLabels = {
            'A': 'Accounting', 'E': 'Engineering', 'S': 'Sales',
            'P': 'Parts/Service', 'I': 'Inactive', 'L': 'Left Company', 'default': 'Unknown'
        };

        function getCoordinatesFromPrecomputed(item) {
            return item.coordinates || [39.8283, -98.5795];
        }

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
                <div><span style="color: \${typeColors.P};">●</span> Parts/Service</div>
                <div><span style="color: \${typeColors.I};">●</span> Inactive</div>
                <div><span style="color: \${typeColors.L};">●</span> Left Company</div>
                <div><span style="color: \${typeColors.default};">●</span> Unknown</div>
                <div style="margin-top: 8px;"><span style="color: #9c27b0;">●</span> Multiple Contacts</div>
                <div style="margin-top: 10px; font-size: 12px; color: #666;">Total Contacts: \${contactsData.length}</div>
            \`;
            return div;
        };
        legend.addTo(map);

        let allMarkers = [];
        let allCircles = [];

        function createMarkersFromData(contactsData) {
            allMarkers.forEach(marker => map.removeLayer(marker));
            allCircles.forEach(circle => map.removeLayer(circle));
            allMarkers = [];
            allCircles = [];
            const locationGroups = new Map();

            for (const item of contactsData) {
                const { contact, address, fullName } = item;
                if (!address || !(address.City || address.city) || !(address.State || address.state || address.stateProvince)) continue;

                const coords = getCoordinatesFromPrecomputed(item);
                const coordKey = coords[0].toFixed(6) + ',' + coords[1].toFixed(6);

                if (!locationGroups.has(coordKey)) {
                    locationGroups.set(coordKey, { coordinates: coords, contacts: [] });
                }

                locationGroups.get(coordKey).contacts.push({
                    contact, address, fullName,
                    contactType: contact.type?.toUpperCase() || 'default'
                });
            }

            for (const [coordKey, group] of locationGroups) {
                const coords = group.coordinates;
                const contacts = group.contacts;
                const contactCount = contacts.length;
                let markerColor, markerRadius;

                if (contactCount === 1) {
                    const contactType = contacts[0].contactType;
                    markerColor = typeColors[contactType] || typeColors.default;
                    markerRadius = 8;
                } else {
                    markerColor = '#9c27b0';
                    markerRadius = Math.min(12 + contactCount * 2, 20);
                }

                const marker = L.circleMarker(coords, {
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.7,
                    radius: markerRadius,
                    weight: 2
                }).addTo(map);

                const radiusCircle = L.circle(coords, {
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.1,
                    weight: 1,
                    radius: 48280,
                    interactive: false
                }).addTo(map);

                if (contactCount === 1) {
                    const contact = contacts[0];
                    const popupContent = \`
                        <div class="contact-popup">
                            <h3>\${contact.fullName}</h3>
                            <div class="contact-type type-\${contact.contactType.toLowerCase()}">\${typeLabels[contact.contactType] || typeLabels.default}</div>
                            <div class="contact-details">
                                <strong>Title:</strong> \${contact.contact.title || 'N/A'}<br>
                                <strong>Phone:</strong> \${contact.contact.phone || 'N/A'}\${contact.contact.phoneExtension ? ' x' + contact.contact.phoneExtension : ''}<br>
                                <strong>Email:</strong> \${contact.contact.email || 'N/A'}<br>
                                <strong>Company:</strong> \${contact.contact.legacyCompanyId ? 'Company ' + contact.contact.legacyCompanyId : 'N/A'}<br>
                                <strong>Created:</strong> \${contact.contact.createdAt ? new Date(contact.contact.createdAt).toLocaleDateString() : 'N/A'}<br>
                                <strong>Address:</strong><br>
                                <div style="margin-left: 10px; line-height: 1.3;">
                                    \${contact.address ? [
                                        contact.address.Address1 || contact.address.addressLine1,
                                        contact.address.Address2 || contact.address.addressLine2,
                                        [contact.address.City || contact.address.city, contact.address.State || contact.address.state || contact.address.stateProvince, contact.address.ZipCode || contact.address.zipCode || contact.address.postalCode].filter(Boolean).join(', ')
                                    ].filter(Boolean).join('<br>') : 'N/A'}
                                </div>
                            </div>
                            <div style="margin-top: 10px; text-align: center;">
                                <a href="/sales/contacts/\${contact.contact.id}" target="_parent" style="background: #007cba; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block;">
                                    View Full Contact Details
                                </a>
                            </div>
                        </div>
                    \`;
                    marker.bindPopup(popupContent);
                    marker.bindTooltip(contact.fullName);
                } else {
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
                                <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                                    <strong>Title:</strong> \${contact.contact.title || 'N/A'}<br>
                                    <strong>Phone:</strong> \${contact.contact.phone || 'N/A'}\${contact.contact.phoneExtension ? ' x' + contact.contact.phoneExtension : ''}<br>
                                    <strong>Email:</strong> \${contact.contact.email || 'N/A'}<br>
                                    <strong>Created:</strong> \${contact.contact.createdAt ? new Date(contact.contact.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                                <div style="font-size: 10px; color: #888; margin-bottom: 6px;">
                                    <strong>Address:</strong><br>
                                    <div style="margin-left: 8px; line-height: 1.2;">
                                        \${contact.address ? [
                                            contact.address.Address1 || contact.address.addressLine1,
                                            contact.address.Address2 || contact.address.addressLine2,
                                            [contact.address.City || contact.address.city, contact.address.State || contact.address.state || contact.address.stateProvince, contact.address.ZipCode || contact.address.zipCode || contact.address.postalCode].filter(Boolean).join(', ')
                                        ].filter(Boolean).join('<br>') : 'N/A'}
                                    </div>
                                </div>
                                <div style="text-align: center;">
                                    <a href="/sales/contacts/\${contact.contact.id}" target="_parent" style="background: #007cba; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 10px; display: inline-block;">
                                        View Details
                                    </a>
                                </div>
                            </div>
                        \`;
                    });

                    clusterPopupContent += \`</div></div>\`;
                    marker.bindPopup(clusterPopupContent);
                    marker.bindTooltip(\`\${contactCount} contacts at this location\`);
                }

                allMarkers.push(marker);
                allCircles.push(radiusCircle);
            }

            const legendDiv = document.querySelector('.legend div:last-child');
            if (legendDiv) {
                legendDiv.innerHTML = 'Total Contacts: ' + contactsData.length;
            }
        }

        createMarkersFromData(contactsData);

        window.addEventListener('message', function(event) {
            if (event.data.type === 'updateMarkers') {
                createMarkersFromData(event.data.contactsData);
            }
        });
    </script>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.srcdoc = mapHTML;

    if (mapContainerRef.current) {
      mapContainerRef.current.appendChild(iframe);
      setMapLoaded(true);
    }
      setIsInitialLoad(false);
    };

    initializeMapWithPreloadedData();
  }, [contactsWithAddresses, isInitialLoad]);

  useEffect(() => {
    if (!mapContainerRef.current || contactsWithAddresses.length === 0 || isInitialLoad) return;

    const iframe = mapContainerRef.current.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    const filteredDataWithCoords = filteredContactsWithAddresses.map(item => ({
      ...item,
      coordinates: getCoordinatesForAddress(item.address)
    }));

    iframe.contentWindow.postMessage({
      type: 'updateMarkers',
      contactsData: filteredDataWithCoords
    }, '*');
  }, [selectedContactType, searchQuery, filteredContactsWithAddresses, contactsWithAddresses, isInitialLoad]);

  const contactsWithValidAddresses = contactsWithAddresses.filter(item =>
    item.address && (item.address.City || item.address.city) && (item.address.State || item.address.state || item.address.stateProvince)
  );

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
      <div className="border-b px-6 py-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-16">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">Contacts Loaded:</span>
              <span className="text-xl font-semibold text-primary">{contactsWithValidAddresses.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-400">Showing on Map:</span>
              <span className="text-xl font-semibold text-primary">{filteredContactsWithAddresses.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
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

            <div className="flex flex-col">
              <label className="text-xs text-neutral-400 mb-1">Contact Type</label>
              <select
                value={selectedContactType}
                onChange={(e) => setSelectedContactType(e.target.value)}
                className="px-3 py-1 text-sm font-normal text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value={ContactType.Accounting}>Accounting</option>
                <option value={ContactType.Engineering}>Engineering</option>
                <option value={ContactType.Sales}>Sales</option>
                <option value={ContactType.Parts_Service}>Parts/Service</option>
                <option value={ContactType.Inactive}>Inactive</option>
                <option value={ContactType.Left_Company}>Left Company</option>
              </select>
            </div>
          </div>
        </div>
      </div>

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
