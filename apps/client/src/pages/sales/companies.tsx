import {
  PlusCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

import { Table, Button, PageHeader, Input, CreateCompanyModal } from "@/components";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      const params: any = {
        page,
        limit,
        sort: sort === "name" ? "CustDlrName" : "Company_ID",
        order,
        fields: "Company_ID,CustDlrName,Active,CreateDate"
      };

      if (debouncedSearchTerm) {
        params.filter = `CustDlrName LIKE %${debouncedSearchTerm}%`;
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
  }, [isLoading, legacyApi, page, limit, sort, order, debouncedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchAllCompanies();
  }, [page, limit, sort, order, debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);


  const allCompanies = legacyCompanies;
  const filteredCompanies = allCompanies;

  const containerRef = useRef<HTMLDivElement>(null);

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      key: "active",
      header: "Active",
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
      render: (_, row) => {
        if (!row.createDate) return "-";
        const date = new Date(row.createDate);
        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
      },
    },
    {
      key: "actions",
      header: "",
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCompany(row);
            }}
            className="px-2 py-1 text-xs text-error border border-error/30 rounded hover:bg-error/10 transition-colors"
            title="Delete company"
          >
            Delete
          </button>
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

  const handleDeleteCompany = (company: any) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await legacyApi.delete(`/legacy/std/Company/filter/custom`, {
        params: { Company_ID: companyToDelete.id }
      });

      if (result) {
        fetchAllCompanies();
        setShowDeleteModal(false);
        setCompanyToDelete(null);
      }
    } catch (error) {
      alert("Error deleting company. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircleIcon size={20} /> Create New
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Companies"
        description={`Showing ${filteredCompanies.length} of ${pagination.total} companies`}
        actions={<Actions />}
      />

      {/* Search Bar */}
      <div className="px-6 py-4 border-b">
        <Input
          placeholder="Search companies..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Table<any>
            columns={columns}
            data={filteredCompanies || []}
            total={pagination.total}
            idField="id"
            className="bg-foreground rounded shadow-sm border flex-shrink-0"
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
      </div>

      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-foreground rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">
              Delete Company
            </h3>
            <div className="mb-6">
              <p className="text-text-muted mb-4">
                Are you sure you want to <strong>permanently delete</strong> "{companyToDelete?.name}"? This action cannot be undone and will remove all company data.
              </p>
              <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
                <p className="text-sm text-text">
                  <strong>Recommendation:</strong> Consider <span className="text-warning font-medium">deactivating</span> the company instead. This preserves all data while marking it as inactive.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCompanyToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max px-3 py-1.5 border-error bg-error text-foreground hover:bg-error/80 hover:border-error/80 cursor-pointer disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;