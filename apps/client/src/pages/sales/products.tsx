import { Wrench, LayoutGrid, LayoutList, Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button, PageHeader, Table, Toolbar } from "@/components";
import { formatCurrency } from "@/utils";
import { TableColumn } from "@/components/ui/table";
import Modal from "@/components/ui/modal";
import AdvancedDropdown from "@/components/ui/advanced-dropdown";
import { useApi } from "@/hooks/use-api";

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [fuzzySearch, setFuzzySearch] = useState(false);
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
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedQuote, setSelectedQuote] = useState<string | { create: true; label: string }>('');
  const [modalView, setModalView] = useState<'selection' | 'confirmation'>('selection');
  const [addedQuoteInfo, setAddedQuoteInfo] = useState<{ id: string; label: string } | null>(null);

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

  const { get } = useApi();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 25
  });

  const include = useMemo(
    () => [],
    []
  );

  const filter = useMemo(() => JSON.stringify({
    type: productType === 'services' ? 'Service' : productType.charAt(0).toUpperCase() + productType.slice(1),
  }), [productType]);

  const fetchProducts = async () => {
    setLoading(true);
    const response = await get("/catalog/items", {
      include,
      filter,
      page,
      limit,
      sort,
      order,
      search: searchQuery || undefined,
      fuzzy: fuzzySearch || undefined,
    });

    if (response?.success) {
      setProducts(response.data || []);
      if (response.meta) {
        setPagination({
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
          page: response.meta.page || 1,
          limit: response.meta.limit || 25,
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [include, page, limit, sort, order, filter, searchQuery, fuzzySearch]);

  const handleAddToQuote = (e: React.MouseEvent | null, product: any) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSelectedProduct(product);
    setModalView('selection');
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSelection = (value: string | { create: true; label: string }) => {
    setSelectedQuote(value);
  };

  const handleConfirmAddToQuote = () => {
    if (selectedQuote) {
      let quoteInfo: { id: string; label: string };
      
      if (typeof selectedQuote === 'object' && selectedQuote.create) {
        console.log('Creating new quote:', selectedQuote.label, 'with product:', selectedProduct.modelNumber);
        quoteInfo = { id: 'new-quote-id', label: selectedQuote.label };
      } else {
        console.log('Adding product:', selectedProduct.modelNumber, 'to quote:', selectedQuote);
        const quote = mockQuotes.find(q => q.value === selectedQuote);
        quoteInfo = { id: selectedQuote as string, label: quote?.label || '' };
      }
      
      setAddedQuoteInfo(quoteInfo);
      setModalView('confirmation');
    }
  };

  const handleContinueAdding = () => {
    setModalView('selection');
    setSelectedProduct(null);
    setSelectedQuote('');
    setIsQuoteModalOpen(false);
  };

  const handleViewQuote = () => {
    if (addedQuoteInfo) {
      navigate(`/sales/quotes/${addedQuoteInfo.id}`);
    }
    setIsQuoteModalOpen(false);
    setSelectedProduct(null);
    setSelectedQuote('');
    setAddedQuoteInfo(null);
  };

  const mockQuotes = [
    { value: 'quote-1', label: 'Q-2024-001 - Acme Corporation' },
    { value: 'quote-2', label: 'Q-2024-002 - TechCorp Industries' },
    { value: 'quote-3', label: 'Q-2024-003 - Global Solutions Ltd' },
    { value: 'quote-4', label: 'Q-2024-004 - Innovation Partners' },
  ];

  const columns: TableColumn<any>[] = [
    {
      key: "modelNumber",
      header: "Model #",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/products/p/${row.id}`}>{row.modelNumber}</Link>
      ),
    },
    {
      key: "description",
      header: "Description",
    },
    {
      key: "price",
      header: "Price",
      render: (_, row) => formatCurrency(row.specifications.price),
    },
    {
      key: "actions",
      header: "",
      className: "w-fit whitespace-nowrap",
      sortable: false,
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => handleAddToQuote(null, row)}
        >
          <Plus size={14} />
          Add to Quote
        </Button>
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

      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setSelectedProduct(null);
          setSelectedQuote('');
          setModalView('selection');
          setAddedQuoteInfo(null);
        }}
        title={modalView === 'selection' ? "Add Product to Quote" : "Product Added Successfully"}
        size="xs"
      >
        {modalView === 'selection' ? (
          <div className="flex flex-col gap-4">
            {selectedProduct && (
              <div className="bg-surface p-3 rounded border border-border">
                <div className="font-semibold text-primary">{selectedProduct.modelNumber}</div>
                <div className="text-sm text-text-muted">{selectedProduct.description}</div>
                <div className="text-lg font-bold mt-2">{formatCurrency(selectedProduct.specifications?.price || 0)}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Select Quote or Create New</label>
              <AdvancedDropdown
                options={mockQuotes}
                value={selectedQuote}
                onChange={handleQuoteSelection}
                placeholder="Select a quote"
                createPlaceholder="Enter quote name"
                mode={typeof selectedQuote === 'object' && selectedQuote.create ? 'create' : 'select'}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setIsQuoteModalOpen(false);
                  setSelectedProduct(null);
                  setSelectedQuote('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAddToQuote}
                disabled={!selectedQuote}
              >
                {typeof selectedQuote === 'object' && selectedQuote.create ? 'Create Quote & Add' : 'Add to Quote'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Product added to quote!</p>
              {addedQuoteInfo && (
                <p className="text-sm text-text-muted">
                  {selectedProduct?.modelNumber} has been added to {addedQuoteInfo.label}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                variant="secondary-outline"
                onClick={handleContinueAdding}
              >
                Continue Adding
              </Button>
              <Button
                variant="primary"
                onClick={handleViewQuote}
              >
                View Quote
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          onSearch={handleSearchChange}
          searchPlaceholder="Search products..."
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          actions={
            <>
              {searchQuery && (
                <label className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded border border-border cursor-pointer hover:bg-surface/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={fuzzySearch}
                    onChange={(e) => setFuzzySearch(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-text select-none">Fuzzy Search</span>
                </label>
              )}
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
              <div className="flex gap-1 bg-surface p-1 rounded border border-border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                  title="List view"
                >
                  <LayoutList size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

            </>
          }
        />

        <div className="flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            <Table
              columns={columns}
              data={products || []}
              total={pagination.total}
              idField="id"
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
              className="rounded border overflow-clip"
              loading={loading}
              emptyMessage="No products found"
            />
          ) : (
            <div className="h-full overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-text-muted">Loading...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-text-muted">No products found</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {products.map((product: any) => (
                      <Link 
                        key={product.id} 
                        to={`/sales/products/p/${product.id}`}
                        className="block"
                      >
                        <div className="bg-surface border border-border rounded-sm p-2 hover:border-primary transition-colors cursor-pointer flex flex-col h-full">
                          <div className="font-semibold text-primary mb-2">
                            {product.modelNumber}
                          </div>
                          <div className="text-sm text-text-muted mb-3 line-clamp-2 flex-1">
                            {product.description}
                          </div>
                          <div className="text-lg font-bold text-text mb-3">
                            {formatCurrency(product.specifications?.price || 0)}
                          </div>
                          <Button
                            variant="secondary-outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleAddToQuote(null, product)}
                          >
                            <Plus size={14} />
                            Add to Quote
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-center items-center gap-2 p-4 border-t border-border">
                    <Button
                      variant="secondary-outline"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-text-muted">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary-outline"
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;