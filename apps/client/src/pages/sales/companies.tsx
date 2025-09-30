import {
  MoreHorizontal,
  PlusCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

import { Table, Button, PageHeader, Input } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";

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
  const legacyApi = useApi();

  const adaptLegacyCompany = (raw: any) => {
    return {
      id: raw.Company_ID,
      name: raw.CustDlrName || `Company ${raw.Company_ID}`,
      active: raw.Active,
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
        // Handle paginated response structure from legacy service
        const isApiResponse = legacyCompaniesResponse && typeof legacyCompaniesResponse === 'object' && 'data' in legacyCompaniesResponse;
        
        if (isApiResponse) {
          // New paginated response format
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
          // Fallback for non-paginated responses (shouldn't happen with new implementation)
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
  
  // Use companies directly since pagination is handled server-side
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
        return date.toLocaleDateString();
      },
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

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button>
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
    </div>
  );
};

export default Companies;