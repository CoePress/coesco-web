import { Plus, MoreHorizontal, Import } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/utils";
import { Button, Modal, PageHeader } from "@/components";
import { sampleOptionCategories, sampleOptions } from "@/utils/sample-data";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { useNavigate } from "react-router-dom";

const partCategories = ["Hydraulics", "Mechanical", "Electronics", "Safety"];
const serviceCategories = ["Maintenance", "Installation", "Training", "Repair"];

const TreeNode = ({ node }: { node: any }) => {
  return (
    <div className={`pl-${node.depth * 20}`}>
      <div className="flex items-center gap-2">
        {node.children.length > 0 && "▾"}
        <span>{node.name}</span>
      </div>
      {node.children.map((child: any) => (
        <TreeNode
          key={child.id}
          node={child}
        />
      ))}
    </div>
  );
};

const isDescendantOf = (
  childId: string,
  parentId: string,
  productClasses: any[]
): boolean => {
  let current = productClasses.find((pc) => pc.id === childId);
  while (current) {
    if (current.parentId === parentId) return true;
    current = productClasses.find((pc) => pc.id === current?.parentId);
  }
  return false;
};

const QuoteModal = ({
  isOpen,
  onClose,
  item,
  itemType,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  itemType: "configs" | "parts" | "services";
}) => {
  const [selectedQuote, setSelectedQuote] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!selectedQuote) return;
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showConfirmation) {
    return (
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Addition"
        size="xs">
        <div className="space-y-4">
          <p className="text-text-muted">
            Are you sure you want to add {item?.name} to Quote #{selectedQuote}?
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="secondary-outline"
              onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary">
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Quote"
      size="xs">
      <label className="block text-sm font-medium text-text mb-1">
        Select Quote
      </label>
      <select
        className="w-full p-2 border rounded bg-foreground"
        value={selectedQuote}
        onChange={(e) => setSelectedQuote(e.target.value)}>
        <option value="">Select existing quote...</option>
        <option value="1234">Quote #1234</option>
        <option value="5678">Quote #5678</option>
      </select>

      {itemType === "parts" && (
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full p-2 border rounded bg-foreground"
          />
        </div>
      )}

      <Button
        onClick={handleAdd}
        disabled={!selectedQuote}>
        Add to Selected Quote
      </Button>

      <div className="text-center">
        <span className="text-sm text-text-muted">or</span>
      </div>

      <Button onClick={() => {}}>Create New Quote</Button>

      <div className="mt-6 text-sm text-text-muted">
        Selected {itemType.slice(0, -1)}: {item?.name}
      </div>
    </Modal>
  );
};

const DetailModal = ({
  isOpen,
  onClose,
  item,
  itemType,
  productClasses,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  itemType: "configs" | "parts" | "services";
  productClasses: any[];
}) => {
  if (!isOpen || !item) return null;

  const renderConfigDetails = () => {
    const productClass = productClasses.find(
      (pc) => pc.id === item.productClassId
    );

    const configOptions = item.selectedOptions.map((configOpt: any) => {
      const option = configOpt.option;
      const category = option
        ? sampleOptionCategories.find(
            (cat: any) => cat.id === option.categoryId
          )
        : null;

      return {
        ...configOpt,
        option,
        category,
      };
    });

    const sortedOptions = configOptions
      .filter((co: any) => co.category && co.option)
      .sort(
        (a: any, b: any) =>
          (a.category?.displayOrder || 0) - (b.category?.displayOrder || 0)
      );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h3 className="text-2xl font-bold text-text-muted mb-2">
            {item.name}
          </h3>
          <p className="text-text-muted leading-relaxed">
            {item.description || "No description available"}
          </p>
        </div>

        {/* Product Class */}
        {productClass && (
          <div className="bg-surface p-4 rounded-lg">
            <h4 className="font-semibold text-text-muted mb-2">
              Product Class
            </h4>
            <p className="text-text-muted">{productClass.name}</p>
          </div>
        )}

        {/* Configuration Options */}
        <div>
          <h4 className="font-semibold text-text-muted mb-3">
            Configuration Details
          </h4>
          <div className="space-y-3">
            {sortedOptions.map((co: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-surface rounded-lg border">
                <div>
                  <span className="font-medium text-text-muted">
                    {co.category?.name}
                  </span>
                  {co.category?.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-text-muted">{co.option?.name}</span>
                  {co.quantity > 1 && (
                    <span className="text-sm text-text-muted ml-1">
                      (x{co.quantity})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-text-muted">
                {item.isTemplate ? "Starting from" : "Total Price"}
              </div>
              <div className="text-3xl font-bold text-text-muted">
                {formatCurrency(item.pricing?.totalPrice || 0, false)}
              </div>
            </div>
            <Button
              onClick={() => {
                onClose();
                // TODO: Open quote modal
              }}
              variant="primary">
              Add to Quote
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPartDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h3 className="text-2xl font-bold text-text-muted mb-2">{item.name}</h3>
        <p className="text-text-muted leading-relaxed">{item.description}</p>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-text-muted mb-3">Specifications</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">SKU</span>
              <span className="font-mono font-medium text-text-muted">
                {item.sku}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Category</span>
              <span className="font-medium text-text-muted">
                {item.category}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Stock Status</span>
              <span
                className={`font-medium ${
                  item.inStock ? "text-green-600" : "text-red-600"
                }`}>
                {item.inStock
                  ? `In Stock (${item.stockQuantity} units)`
                  : "Out of Stock"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-text-muted mb-3">
            Pricing & Availability
          </h4>
          <div className="space-y-3">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-text-muted mb-1">Unit Price</div>
              <div className="text-2xl font-bold text-text-muted">
                {formatCurrency(item.price, false)}
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-sm text-text-muted mb-1">Availability</div>
              <div className="font-medium text-text-muted">
                {item.inStock
                  ? "Ready for immediate shipment"
                  : "Backorder available"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            onClose();
            // TODO: Open quote modal
          }}
          variant="primary"
          disabled={!item.inStock}>
          {item.inStock ? "Add to Quote" : "Request Quote"}
        </Button>
      </div>
    </div>
  );

  const renderServiceDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h3 className="text-2xl font-bold text-text-muted mb-2">{item.name}</h3>
        <p className="text-text-muted leading-relaxed">{item.description}</p>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-text-muted mb-3">
            Service Information
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Category</span>
              <span className="font-medium text-text-muted">
                {item.category}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Duration</span>
              <span className="font-medium text-text-muted">
                {item.duration}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Availability</span>
              <span
                className={`font-medium ${
                  item.available ? "text-green-600" : "text-red-600"
                }`}>
                {item.available ? "Available" : "Currently Unavailable"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-text-muted mb-3">Pricing</h4>
          <div className="space-y-3">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-text-muted mb-1">Service Price</div>
              <div className="text-2xl font-bold text-text-muted">
                {formatCurrency(item.price, false)}
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-sm text-text-muted mb-1">Service Type</div>
              <div className="font-medium text-text-muted">
                {item.category === "Emergency Repair"
                  ? "24/7 Emergency Service"
                  : "Standard Service"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div>
        <h4 className="font-semibold text-text-muted mb-3">What's Included</h4>
        <div className="bg-surface p-4 rounded-lg">
          <ul className="space-y-2 text-text-muted">
            {item.category === "Maintenance" && (
              <>
                <li>• Comprehensive equipment inspection</li>
                <li>• Cleaning and lubrication of moving parts</li>
                <li>• Calibration of sensors and controls</li>
                <li>• Performance testing and optimization</li>
                <li>• Detailed maintenance report</li>
              </>
            )}
            {item.category === "Installation" && (
              <>
                <li>• Professional equipment installation</li>
                <li>• Initial setup and configuration</li>
                <li>• Basic operator training</li>
                <li>• Safety checks and testing</li>
                <li>• Installation documentation</li>
              </>
            )}
            {item.category === "Training" && (
              <>
                <li>• Comprehensive operator training</li>
                <li>• Safety procedures and protocols</li>
                <li>• Equipment operation techniques</li>
                <li>• Troubleshooting basics</li>
                <li>• Training materials and certification</li>
              </>
            )}
            {item.category === "Repair" && (
              <>
                <li>• 24/7 emergency response</li>
                <li>• On-site diagnostic assessment</li>
                <li>• Parts replacement and repair</li>
                <li>• Testing and verification</li>
                <li>• Repair warranty</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            onClose();
            // TODO: Open quote modal
          }}
          variant="primary"
          disabled={!item.available}>
          {item.available ? "Add to Quote" : "Request Information"}
        </Button>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (itemType) {
      case "configs":
        return "Configuration Details";
      case "parts":
        return "Part Details";
      case "services":
        return "Service Details";
      default:
        return "Item Details";
    }
  };

  const renderContent = () => {
    switch (itemType) {
      case "configs":
        return renderConfigDetails();
      case "parts":
        return renderPartDetails();
      case "services":
        return renderServiceDetails();
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="lg">
      {renderContent()}
    </Modal>
  );
};

const Catalog = () => {
  const [viewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<
    "configs" | "parts" | "services"
  >("configs");
  const [selections, setSelections] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<{
    [key: string]: string;
  }>({});
  const [partCategoryFilter, setPartCategoryFilter] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in-stock" | "out-of-stock"
  >("all");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);

  const { entities: productClasses, loading: productClassesLoading } =
    useGetEntities("/config/classes");
  const { entities: configurations, loading: configurationsLoading } =
    useGetEntities("/configurations");
  const deepestSelectedClassId =
    selections.length > 0 ? selections[selections.length - 1] : "";
  const { entities: productClassOptions, loading: optionsLoading } =
    useGetEntities(
      deepestSelectedClassId
        ? `/config/classes/${deepestSelectedClassId}/options`
        : ""
    );

  const { entities: parts } = useGetEntities("/items");
  const { entities: services } = useGetEntities("/items");

  const navigate = useNavigate();

  const getOptionsForLevel = (
    level: number
  ): Array<{ id: string; name: string }> => {
    if (!productClasses) return [];

    if (level === 0) {
      return productClasses.filter((pc) => pc.parentId === null);
    }

    const parentId = selections[level - 1];
    return parentId
      ? productClasses.filter((pc) => pc.parentId === parentId)
      : [];
  };

  const handleSelectionChange = (level: number, value: string) => {
    if (!value) {
      setSelections(selections.slice(0, level));
      return;
    }

    const newSelections = [...selections.slice(0, level), value];
    setSelections(newSelections);
  };

  const handleCategoryFilterChange = (categoryId: string, optionId: string) => {
    if (!optionId) {
      const newFilters = { ...categoryFilters };
      delete newFilters[categoryId];
      setCategoryFilters(newFilters);
      return;
    }

    setCategoryFilters({
      ...categoryFilters,
      [categoryId]: optionId,
    });
  };

  const resetFilters = () => {
    setSelections([]);
    setCategoryFilters({});
    setPartCategoryFilter("");
    setServiceCategoryFilter("");
    setStockFilter("all");
  };

  const visibleLevels = selections.length + 1;

  const getFilteredByProductClass = () => {
    if (!configurations) return [];

    if (selections.length === 0) return configurations;

    const lastSelection = selections[selections.length - 1];

    return configurations.filter((config) => {
      const configClass = productClasses?.find(
        (pc) => pc.id === config.productClassId
      );
      if (!configClass) return false;

      return (
        configClass.id === lastSelection ||
        isDescendantOf(configClass.id, lastSelection, productClasses || [])
      );
    });
  };

  const getVisibleConfigurations = () => {
    const productClassFiltered = getFilteredByProductClass();

    if (Object.keys(categoryFilters).length === 0) {
      return productClassFiltered;
    }

    return productClassFiltered.filter((config) => {
      return Object.entries(categoryFilters).every(([categoryId, optionId]) => {
        const categoryOptions = sampleOptions.filter(
          (opt: any) => opt.categoryId === categoryId
        );
        const configOptionIds = config.selectedOptions.map(
          (opt: any) => opt.optionId
        );

        return categoryOptions.some(
          (opt: any) => opt.id === optionId && configOptionIds.includes(opt.id)
        );
      });
    });
  };

  const getVisibleParts = () => {
    if (!parts) return [];

    let filtered = parts;

    if (partCategoryFilter) {
      filtered = filtered.filter(
        (part: any) => part.category === partCategoryFilter
      );
    }

    if (stockFilter === "in-stock") {
      filtered = filtered.filter((part: any) => part.inStock);
    } else if (stockFilter === "out-of-stock") {
      filtered = filtered.filter((part: any) => !part.inStock);
    }

    return filtered;
  };

  const getVisibleServices = () => {
    if (!services) return [];

    let filtered = services;

    if (serviceCategoryFilter) {
      filtered = filtered.filter(
        (service: any) => service.category === serviceCategoryFilter
      );
    }

    return filtered.filter((service: any) => service.available);
  };

  const getVisibleItems = () => {
    if (filterType === "configs") {
      return getVisibleConfigurations();
    } else if (filterType === "parts") {
      return getVisibleParts();
    } else {
      return getVisibleServices();
    }
  };

  const pageTitle = "Coe Catalog";
  const pageDescription = "Complete list of equipment, parts, and services";

  const renderConfigCard = (config: any) => {
    const productClass = productClasses?.find(
      (pc) => pc.id === config.productClassId
    );

    const configOptions = config.selectedOptions.map((configOpt: any) => {
      const option = configOpt.option;
      const category = option
        ? sampleOptionCategories.find(
            (cat: any) => cat.id === option.categoryId
          )
        : null;

      return {
        ...configOpt,
        option,
        category,
      };
    });

    return (
      <div
        key={config.id}
        className="bg-foreground rounded border hover:shadow-md transition-shadow">
        <div className="h-48 w-full bg-surface flex items-center justify-center rounded-t-lg text-text-muted">
          {config.image ? (
            <img
              src={config.image}
              alt={config.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : (
            <span>No Image Available</span>
          )}
        </div>
        <div className="p-2">
          <div className="flex justify-between items-start">
            <div className="overflow-hidden w-full">
              <h3 className="text-lg font-medium text-text-muted">
                {config.name}
              </h3>
              <p className="text-sm text-text-muted mt-1 truncate">
                {config.description || "No description available"}
              </p>
              {productClass && (
                <p className="text-xs text-text-muted mt-2">
                  {productClass.name}
                </p>
              )}
            </div>
            <button
              className="text-text-muted hover:text-text"
              onClick={() => {
                setSelectedDetailItem(config);
                setIsDetailModalOpen(true);
              }}>
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="mt-3 text-xs text-text-muted">
            {configOptions
              .filter((co: any) => co.category && co.option)
              .sort(
                (a: any, b: any) =>
                  (a.category?.displayOrder || 0) -
                  (b.category?.displayOrder || 0)
              )
              .map((co: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between">
                  <span>{co.category?.name}:</span>
                  <span>
                    {co.option?.name}{" "}
                    {co.quantity > 1 ? ` (x${co.quantity})` : ""}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t flex gap-2 flex-col">
            <div>
              <div className="text-xs text-text-muted">
                {config.isTemplate ? "Starting from" : "Price"}
              </div>
              <div className="text-lg font-semibold text-text-muted">
                {formatCurrency(config.pricing?.totalPrice || 0, false)}
              </div>
            </div>
            <Button
              onClick={() => {
                setSelectedItem(config);
                setIsQuoteModalOpen(true);
              }}
              variant="primary">
              Add to Quote
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPartCard = (part: any) => (
    <div
      key={part.id}
      className="bg-foreground rounded border hover:shadow-md transition-shadow">
      <div className="h-48 w-full bg-surface flex items-center justify-center rounded-t-lg text-text-muted">
        {part.image ? (
          <img
            src={part.image}
            alt={part.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <span>No Image Available</span>
        )}
      </div>
      <div className="p-2">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden w-full">
            <h3 className="text-lg font-medium text-text-muted">{part.name}</h3>
            <p className="text-sm text-text-muted mt-1 truncate">
              {part.description}
            </p>
            <p className="text-xs text-text-muted mt-2">
              SKU: {part.sku} | Category: {part.category}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-1 rounded ${part.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {part.inStock
                  ? `In Stock (${part.stockQuantity})`
                  : "Out of Stock"}
              </span>
            </div>
          </div>
          <button
            className="text-text-muted hover:text-text"
            onClick={() => {
              setSelectedDetailItem(part);
              setIsDetailModalOpen(true);
            }}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t flex gap-2 flex-col">
          <div>
            <div className="text-xs text-text-muted">Price</div>
            <div className="text-lg font-semibold text-text-muted">
              {formatCurrency(part.price, false)}
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedItem(part);
              setIsQuoteModalOpen(true);
            }}
            variant="primary"
            disabled={!part.inStock}>
            Add to Quote
          </Button>
        </div>
      </div>
    </div>
  );

  const renderServiceCard = (service: any) => (
    <div
      key={service.id}
      className="bg-foreground rounded border hover:shadow-md transition-shadow">
      <div className="h-48 w-full bg-surface flex items-center justify-center rounded-t-lg text-text-muted">
        <span className="text-4xl"></span>
      </div>

      <div className="p-2">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden w-full">
            <h3 className="text-lg font-medium text-text-muted">
              {service.name}
            </h3>
            <p className="text-sm text-text-muted mt-1 truncate">
              {service.description}
            </p>
            <p className="text-xs text-text-muted mt-2">
              Duration: {service.duration} | Category: {service.category}
            </p>
          </div>
          <button
            className="text-text-muted hover:text-text"
            onClick={() => {
              setSelectedDetailItem(service);
              setIsDetailModalOpen(true);
            }}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t flex gap-2 flex-col">
          <div>
            <div className="text-xs text-text-muted">Price</div>
            <div className="text-lg font-semibold text-text-muted">
              {formatCurrency(service.price, false)}
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedItem(service);
              setIsQuoteModalOpen(true);
            }}
            variant="primary">
            Add to Quote
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => {
    if (filterType === "configs") {
      return (
        <>
          <div className="flex flex-col gap-2 text-text-muted">
            <h3 className="text-sm font-medium">Product Class</h3>
            {Array.from({ length: visibleLevels }).map((_, level) => {
              const options = getOptionsForLevel(level);

              return options.length > 0 ? (
                <select
                  key={`product-class-${level}`}
                  value={selections[level] || ""}
                  onChange={(e) => handleSelectionChange(level, e.target.value)}
                  className="rounded border-border bg-foreground">
                  <option value="">
                    Select {level === 0 ? "Category" : "Option"}
                  </option>
                  {options.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              ) : null;
            })}

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-medium mb-2">Option Filters</h3>

              {productClassOptions?.map((category: any) => (
                <div
                  key={category.id}
                  className="mb-2">
                  <label className="block text-sm mb-1">
                    {category.name} {category.isRequired && "*"}
                  </label>
                  <select
                    value={categoryFilters[category.id] || ""}
                    onChange={(e) =>
                      handleCategoryFilterChange(category.id, e.target.value)
                    }
                    className="rounded border-border bg-foreground w-full">
                    <option value="">Any</option>
                    {category.options
                      ?.sort(
                        (a: any, b: any) => a.displayOrder - b.displayOrder
                      )
                      .map((option: any) => (
                        <option
                          key={option.id}
                          value={option.id}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (filterType === "parts") {
      return (
        <div className="flex flex-col gap-2 text-text-muted">
          <h3 className="text-sm font-medium">Part Category</h3>
          <select
            value={partCategoryFilter}
            onChange={(e) => setPartCategoryFilter(e.target.value)}
            className="rounded border-border bg-foreground">
            <option value="">All Categories</option>
            {partCategories.map((category) => (
              <option
                key={category}
                value={category}>
                {category}
              </option>
            ))}
          </select>

          <h3 className="text-sm font-medium mt-4">Stock Status</h3>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="rounded border-border bg-foreground">
            <option value="all">All Items</option>
            <option value="in-stock">In Stock Only</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      );
    }

    if (filterType === "services") {
      return (
        <div className="flex flex-col gap-2 text-text-muted">
          <h3 className="text-sm font-medium">Service Category</h3>
          <select
            value={serviceCategoryFilter}
            onChange={(e) => setServiceCategoryFilter(e.target.value)}
            className="rounded border-border bg-foreground">
            <option value="">All Categories</option>
            {serviceCategories.map((category) => (
              <option
                key={category}
                value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    const items = getVisibleItems();

    if (items.length === 0) {
      return (
        <div className="col-span-full text-center p-8 bg-foreground rounded border">
          <p className="text-text-muted">
            No {filterType} match your current filters
          </p>
        </div>
      );
    }

    if (filterType === "configs") {
      return items.map(renderConfigCard);
    } else if (filterType === "parts") {
      return items.map(renderPartCard);
    } else {
      return items.map(renderServiceCard);
    }
  };

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "Import",
            variant: "secondary-outline",
            icon: <Import size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Create New",
            variant: "primary",
            icon: <Plus size={16} />,
            onClick: () => {
              navigate("/sales/catalog/builder");
            },
          },
        ]}
      />

      <div className="p-2">
        <div className="flex gap-2">
          <div className="w-64 flex-shrink-0 text-sm">
            <div className="bg-foreground rounded border p-2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-text-muted">Filters</h2>
                <Button
                  onClick={resetFilters}
                  variant="ghost">
                  Reset
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex flex-col gap-1">
                  <button
                    className={`px-3 py-2 text-sm font-medium transition-colors rounded cursor-pointer ${
                      filterType === "configs"
                        ? "bg-primary text-background"
                        : "bg-surface text-text-muted hover:bg-foreground"
                    }`}
                    onClick={() => setFilterType("configs")}>
                    Configurations
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium transition-colors rounded cursor-pointer ${
                      filterType === "parts"
                        ? "bg-primary text-background"
                        : "bg-surface text-text-muted hover:bg-foreground"
                    }`}
                    onClick={() => setFilterType("parts")}>
                    Parts
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium transition-colors rounded cursor-pointer ${
                      filterType === "services"
                        ? "bg-primary text-background"
                        : "bg-surface text-text-muted hover:bg-foreground"
                    }`}
                    onClick={() => setFilterType("services")}>
                    Services
                  </button>
                </div>
              </div>

              {renderFilters()}
            </div>
          </div>

          <div className="flex-1">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
                  : "space-y-4"
              }>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        item={selectedItem}
        itemType={filterType}
      />

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedDetailItem}
        itemType={filterType}
        productClasses={productClasses || []}
      />
    </div>
  );
};

export default Catalog;
