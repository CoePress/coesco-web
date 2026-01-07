import {
  PlusCircleIcon,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

import { Table, Button, PageHeader, Input, CreateCompanyModal, Modal, Select } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

const Companies = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [legacyCompanies, setLegacyCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 25
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    activeStatus: "" as string,
    dateRange: ["", ""] as [string, string],
  });
  const legacyApi = useApi();
  const toast = useToast();

  const adaptLegacyCompany = (raw: any) => {
    const isActive = Number(raw.Active) === 1;
    
    return {
      id: raw.Company_ID,
      name: raw.CustDlrName || `Company ${raw.Company_ID}`,
      active: isActive,
      createDate: raw.CreateDate,
    };
  };

  const fetchAllCompanies = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const sortFieldMap: Record<string, string> = {
        name: "CustDlrName",
        active: "Active",
        createDate: "CreateDate"
      };

      const params: any = {
        page,
        limit,
        sort: sortFieldMap[sort] || "CustDlrName",
        order,
        fields: "Company_ID,CustDlrName,Active,CreateDate"
      };

      const filterConditions: any[] = [];

      if (debouncedSearchTerm) {
        filterConditions.push({
          operator: "contains",
          field: "CustDlrName",
          value: debouncedSearchTerm
        });
      }

      if (filters.activeStatus) {
        filterConditions.push({
          operator: "equals",
          field: "Active",
          value: filters.activeStatus === "active" ? 1 : 0
        });
      }

      if (filters.dateRange[0]) {
        filterConditions.push({
          field: "CreateDate",
          operator: "gte",
          value: filters.dateRange[0]
        });
      }

      if (filters.dateRange[1]) {
        filterConditions.push({
          field: "CreateDate",
          operator: "lte",
          value: filters.dateRange[1]
        });
      }

      if (filterConditions.length > 0) {
        params.filter = JSON.stringify({ filters: filterConditions });
      }

      const legacyCompaniesResponse = await legacyApi.get("/legacy/base/Company", params);

      if (legacyCompaniesResponse) {
        const isApiResponse = legacyCompaniesResponse && typeof legacyCompaniesResponse === 'object' && 'data' in legacyCompaniesResponse;
        
        if (isApiResponse) {
          const rawCompanies = Array.isArray(legacyCompaniesResponse.data) ? legacyCompaniesResponse.data : [];
          const mapped = rawCompanies.map((company: any) => adaptLegacyCompany(company));
          setLegacyCompanies(mapped);
          
          if (legacyCompaniesResponse.meta) {
            setPagination({
              page: legacyCompaniesResponse.meta.page,
              totalPages: legacyCompaniesResponse.meta.totalPages,
              total: legacyCompaniesResponse.meta.total,
              limit: legacyCompaniesResponse.meta.limit
            });
          }
        } else {
          const rawCompanies = Array.isArray(legacyCompaniesResponse) ? legacyCompaniesResponse : [];
          const mapped = rawCompanies.map((company: any) => adaptLegacyCompany(company));
          setLegacyCompanies(mapped);
          
          setPagination({
            page: 1,
            totalPages: Math.ceil(mapped.length / limit),
            total: mapped.length,
            limit: limit
          });
        }
      }
    } catch (error) {
      console.error("Error fetching Companies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, legacyApi, page, limit, sort, order, debouncedSearchTerm, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchAllCompanies();
  }, [page, limit, sort, order, debouncedSearchTerm, filters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filters]);


  const allCompanies = legacyCompanies;
  const filteredCompanies = allCompanies;

  const containerRef = useRef<HTMLDivElement>(null);

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline w-[40%]",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      key: "active",
      header: "Active",
      className: "w-[15%]",
      render: (_, row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        }`}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "createDate",
      header: "Created",
      className: "w-[20%]",
      render: (_, row) => {
        if (!row.createDate) return "-";
        const date = new Date(row.createDate);
        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-[25%]",
      render: (_, row) => (
        <div className="flex gap-1">
          {row.active ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivateCompany(row);
              }}
              className="px-2 py-1 text-xs text-warning border border-warning/30 rounded hover:bg-warning/10 transition-colors"
              title="Deactivate company"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleActivateCompany(row);
              }}
              className="px-2 py-1 text-xs text-success border border-success/30 rounded hover:bg-success/10 transition-colors"
              title="Activate company"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleCompanyCreated = () => {
    fetchAllCompanies();
  };

  const handleDeactivateCompany = async (company: any) => {
    try {
      const updateData = { Active: 0 };
      const result = await legacyApi.patch(`/legacy/std/Company/filter/custom?Company_ID=${company.id}`, updateData);

      if (result !== null) {
        fetchAllCompanies();
        toast.success(`Company "${company.name}" has been deactivated.`);
      } else {
        toast.error("Failed to deactivate company. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to deactivate company. Please try again.");
    }
  };

  const handleActivateCompany = async (company: any) => {
    try {
      const updateData = { Active: 1 };
      const result = await legacyApi.patch(`/legacy/std/Company/filter/custom?Company_ID=${company.id}`, updateData);

      if (result !== null) {
        fetchAllCompanies();
        toast.success(`Company "${company.name}" has been activated.`);
      } else {
        toast.error("Failed to activate company. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to activate company. Please try again.");
    }
  };


  const Actions = () => {
    const hasActiveFilters = filters.activeStatus || filters.dateRange[0] || filters.dateRange[1];

    return (
      <div className="flex gap-2">
        <Button
          variant={hasActiveFilters ? "secondary" : "secondary-outline"}
          onClick={() => setIsFilterModalOpen(true)}
        >
          <Filter size={20} /> Filter
        </Button>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircleIcon size={20} /> Create New
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Companies"
        description={`Showing ${filteredCompanies.length} of ${pagination.total} companies`}
        actions={<Actions />}
      />

      {/* Search Bar */}
      <div className="px-6 py-4 border-b flex-shrink-0">
        <Input
          placeholder="Search companies..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
          autoComplete="no"
        />
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto min-h-0">
        <Table<any>
          columns={columns}
          data={filteredCompanies || []}
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

      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <FilterModal
          isOpen={isFilterModalOpen}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setIsFilterModalOpen(false);
          }}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </div>
  );
};

const FilterModal = ({
  isOpen,
  filters,
  onApply,
  onClose,
}: {
  isOpen: boolean;
  filters: {
    activeStatus: string;
    dateRange: [string, string];
  };
  onApply: (filters: any) => void;
  onClose: () => void;
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleReset = () => {
    setLocalFilters({
      activeStatus: "",
      dateRange: ["", ""],
    });
  };

  const hasActiveFilters =
    localFilters.activeStatus ||
    localFilters.dateRange[0] ||
    localFilters.dateRange[1];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Companies" size="md">
      <div className="space-y-4">
        <div className="space-y-2">
          <Select
            label="Active Status"
            value={localFilters.activeStatus}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, activeStatus: e.target.value }))}
            options={[
              { value: "", label: "All companies" },
              { value: "active", label: "Active only" },
              { value: "inactive", label: "Inactive only" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Created From</label>
            <input
              type="date"
              value={localFilters.dateRange[0]}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                dateRange: [e.target.value, prev.dateRange[1]]
              }))}
              className="w-full rounded border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Created To</label>
            <input
              type="date"
              value={localFilters.dateRange[1]}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                dateRange: [prev.dateRange[0], e.target.value]
              }))}
              className="w-full rounded border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="secondary-outline"
            onClick={handleReset}
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary-outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => onApply(localFilters)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Companies;