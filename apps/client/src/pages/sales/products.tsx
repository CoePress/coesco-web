import { Wrench } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button, PageHeader, Table, Toolbar } from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { Action } from "@dnd-kit/core/dist/store";

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getInitialProductType = (): 'equipment' | 'parts' | 'services' => {
    const type = searchParams.get('type');
    if (type && ['parts', 'services'].includes(type)) {
      return type as 'parts' | 'services';
    }
    return 'equipment';
  };

  const [productType, setProductType] = useState<'equipment' | 'parts' | 'services'>(getInitialProductType);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("modelNumber");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    category: '',
    status: '',
    stock: '',
    priceRange: ''
  });

  useEffect(() => {
    const type = searchParams.get('type');
    const newProductType: 'equipment' | 'parts' | 'services' = 
      (type && ['parts', 'services'].includes(type)) ? type as 'parts' | 'services' : 'equipment';
    
    const search = searchParams.get('search') || '';
    
    setProductType(newProductType);
    setSearchQuery(search);
  }, [searchParams]);

  const handleProductTypeChange = (type: 'equipment' | 'parts' | 'services') => {
    setProductType(type);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (type === 'equipment') {
        newParams.delete('type');
      } else {
        newParams.set('type', type);
      }
      return newParams;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value.trim()) {
        newParams.set('search', value.trim());
      } else {
        newParams.delete('search');
      }
      return newParams;
    });
  };

  const clearFilters = () => {
    setFilterValues({ category: '', status: '', stock: '', priceRange: '' });
  };

  const filter = useMemo(() => JSON.stringify({
    type: productType.charAt(0).toUpperCase() + productType.slice(1),
  }), [productType]);

  const {
    entities: products,
    loading,
    pagination,
  } = useGetEntities("/catalog/items", {
    page,
    limit,
    sort,
    order,
    filter,
  });

  const columns: TableColumn<any>[] = [
    {
      key: "modelNumber",
      header: "Model #",
    },
    {
      key: "description",
      header: "Description",
    },
    {
      key: "price",
      header: "Price",
      render: (_, row) => (
      <Link to={`/sales/quotes/${row.id}`}>{formatCurrency(row.specifications.price)}</Link>
      ),
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const Actions = () => {
    return (
      <div className="flex gap-2">
        {productType === 'equipment' && (
          <Button 
            variant="primary"
            onClick={() => navigate('/sales/products/configuration-builder')}
          >
            <Wrench size={16} />
            Configuration Builder
          </Button>
        )}
        <Button variant="primary">
        Add Product
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Product Catalog"
        description="Browse and manage products"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          onSearch={handleSearchChange}
          searchPlaceholder="Search products..."
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          actions={
            <>
              <div className="flex gap-1 bg-surface p-1 rounded border border-border">
                <button
                  onClick={() => handleProductTypeChange('equipment')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
                    productType === 'equipment' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Equipment
                </button>
                <button
                  onClick={() => handleProductTypeChange('parts')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
                    productType === 'parts' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Parts
                </button>
                <button
                  onClick={() => handleProductTypeChange('services')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
                    productType === 'services' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Services
                </button>
              </div>
              {Object.values(filterValues).some(v => v) && (
                <Button 
                  variant="secondary-outline"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}

            </>
          }
        />

        <div className="flex-1 overflow-hidden">
            <Table
              columns={columns}
              data={products || []}
              total={pagination?.total || 0}
              idField="id"
              pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              onPageChange={setPage}
              sort={sort}
              order={order}
              onSortChange={(newSort, newOrder) => {
                setSort(newSort);
                setOrder(newOrder);
              }}
              className="rounded border overflow-clip"
              loading={loading}
              emptyMessage="No products found"
            />
        </div>
      </div>
    </div>
  );
};

export default Products;