import { Search, Wrench } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, PageHeader, StatusBadge, Table, Select } from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";

const Products = () => {
  const navigate = useNavigate();
  const [productType, setProductType] = useState<'machines' | 'parts' | 'services'>('machines');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    category: '',
    status: '',
    stock: '',
    priceRange: ''
  });

  const {
    entities: products,
    loading,
    pagination,
  } = useGetEntities("/catalog/items");

  const columns: TableColumn<any>[] = [
    {
      key: "sku",
      header: "SKU",
      className: "font-mono text-xs",
    },
    {
      key: "name",
      header: "Product Name",
      className: "text-primary hover:underline font-medium",
      render: (_, row) => (
        <Link to={`/sales/products/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "brand",
      header: "Brand",
    },
    {
      key: "price",
      header: "Price",
      render: (value) => formatCurrency(value as number),
    },
    {
      key: "stock",
      header: "Stock",
      render: (value) => (
        <span className={`font-medium ${value < 10 ? 'text-error' : value < 50 ? 'text-warning' : 'text-success'}`}>
          {value}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge label={value as string} />,
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Product Catalog"
        description={`${products?.length || 0} products in catalog`}
        actions={
          <Button variant="primary">
            Add Product
          </Button>
        }
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-4 gap-2 flex-1">
          <div className="col-span-1 bg-foreground p-2 rounded-sm border border-border h-full overflow-y-auto">
            <div className="flex gap-1 mb-2 bg-surface p-1 rounded">
              <button
                onClick={() => setProductType('machines')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  productType === 'machines' 
                    ? 'bg-primary text-background' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Machines
              </button>
              <button
                onClick={() => setProductType('parts')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  productType === 'parts' 
                    ? 'bg-primary text-background' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Parts
              </button>
              <button
                onClick={() => setProductType('services')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  productType === 'services' 
                    ? 'bg-primary text-background' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Services
              </button>
            </div>

            <div className="relative mb-2">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-muted" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="block w-full pl-8 pr-2 py-1.5 border border-border rounded-sm leading-5 bg-surface placeholder-text-muted focus:outline-none focus:placeholder-text focus:ring-1 focus:ring-primary focus:border-primary text-sm text-text-muted"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-muted block mb-2">Category</label>
                <Select
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'machinery', label: 'Machinery' },
                    { value: 'parts', label: 'Parts' },
                    { value: 'tools', label: 'Tools' },
                    { value: 'consumables', label: 'Consumables' },
                    { value: 'safety', label: 'Safety Equipment' },
                  ]}
                  value={filterValues.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="Select category"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted block mb-2">Status</label>
                <Select
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'discontinued', label: 'Discontinued' },
                  ]}
                  value={filterValues.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  placeholder="Select status"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted block mb-2">Stock Level</label>
                <Select
                  options={[
                    { value: '', label: 'All Levels' },
                    { value: 'in-stock', label: 'In Stock' },
                    { value: 'low-stock', label: 'Low Stock (< 50)' },
                    { value: 'critical', label: 'Critical (< 10)' },
                    { value: 'out-of-stock', label: 'Out of Stock' },
                  ]}
                  value={filterValues.stock}
                  onChange={(e) => handleFilterChange('stock', e.target.value)}
                  placeholder="Select stock level"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted block mb-2">Price Range</label>
                <Select
                  options={[
                    { value: '', label: 'All Prices' },
                    { value: '0-100', label: '$0 - $100' },
                    { value: '100-500', label: '$100 - $500' },
                    { value: '500-1000', label: '$500 - $1,000' },
                    { value: '1000-5000', label: '$1,000 - $5,000' },
                    { value: '5000+', label: '$5,000+' },
                  ]}
                  value={filterValues.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  placeholder="Select price range"
                />
              </div>

              <Button 
                variant="secondary-outline" 
                className="w-full"
                onClick={() => setFilterValues({ category: '', status: '', stock: '', priceRange: '' })}
              >
                Clear Filters
              </Button>

              {productType === 'machines' && (
                <Button 
                  variant="primary" 
                  className="w-full mt-4"
                  onClick={() => navigate('/sales/products/configuration-builder')}
                >
                  <Wrench size={16} />
                  Configuration Builder
                </Button>
              )}
            </div>
          </div>

          <div className="col-span-3">
            <Table
              columns={columns}
              data={products || []}
              total={products?.length || 0}
              idField="id"
              pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              onPageChange={() => {}}
              className="rounded border overflow-clip"
              loading={loading}
              emptyMessage="No products found"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;