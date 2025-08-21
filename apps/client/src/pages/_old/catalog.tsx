import { MoreHorizontal, List, Grid, PlusCircleIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/utils";
import { Button, Modal, Loader } from "@/components";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import PageHeader from "@/components/layout/page-header";
import { useNavigate } from "react-router-dom";

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

// const isDescendantOf = (
//   childId: string,
//   parentId: string,
//   productClasses: any[]
// ): boolean => {
//   let current = productClasses.find((pc) => pc.id === childId);
//   while (current) {
//     if (current.parentId === parentId) return true;
//     current = productClasses.find((pc) => pc.id === current?.parentId);
//   }
//   return false;
// };

const QuoteModal = ({
  isOpen,
  onClose,
  item,
  itemType,
  quotes,
  quotesLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  itemType: string;
  quotes: any[];
  quotesLoading: boolean;
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
      {quotesLoading ? (
        <div className="flex items-center gap-2 p-2 border rounded bg-foreground">
          <Loader size="sm" />
          <span className="text-sm text-text-muted">Loading quotes...</span>
        </div>
      ) : (
        <select
          className="w-full p-2 border rounded bg-foreground"
          value={selectedQuote}
          onChange={(e) => setSelectedQuote(e.target.value)}>
          <option value="">Select existing quote...</option>
          {quotes?.map((quote: any) => (
            <option
              key={quote.id}
              value={quote.id}>
              {quote.number} - {quote.journey?.customer?.name || "No Customer"}
            </option>
          ))}
        </select>
      )}

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
  optionCategories,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  itemType: string;
  productClasses: any[];
  optionCategories: any[];
}) => {
  if (!isOpen || !item) return null;

  const renderConfigDetails = () => {
    const productClass = productClasses.find(
      (pc) => pc.id === item.productClassId
    );

    const configOptions = item.selectedOptions.map((configOpt: any) => {
      const option = configOpt.option;
      const category = option
        ? optionCategories?.find((cat: any) => cat.id === option.categoryId)
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
          <div className="bg-surface p-2 rounded-lg">
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
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
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
              <span className="text-text-muted">Type</span>
              <span className="font-medium text-text-muted">{item.type}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Status</span>
              <span
                className={`font-medium ${
                  item.isActive ? "text-green-600" : "text-red-600"
                }`}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-text-muted mb-3">
            Pricing & Availability
          </h4>
          <div className="space-y-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-text-muted mb-1">Unit Price</div>
              <div className="text-2xl font-bold text-text-muted">
                {formatCurrency(item.unitPrice, false)}
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-sm text-text-muted mb-1">Availability</div>
              <div className="font-medium text-text-muted">
                {item.isActive
                  ? "Ready for immediate shipment"
                  : "Backorder available"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            onClose();
          }}
          variant="primary"
          disabled={!item.isActive}>
          {item.isActive ? "Add to Quote" : "Request Quote"}
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
              <span className="text-text-muted">Service Type</span>
              <span className="font-medium text-text-muted">{item.type}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
              <span className="text-text-muted">Status</span>
              <span
                className={`font-medium ${
                  item.isActive ? "text-green-600" : "text-red-600"
                }`}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-text-muted mb-3">Pricing</h4>
          <div className="space-y-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-text-muted mb-1">Service Price</div>
              <div className="text-2xl font-bold text-text-muted">
                {formatCurrency(item.unitPrice, false)}
              </div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-sm text-text-muted mb-1">Service Type</div>
              <div className="font-medium text-text-muted">
                Professional Service
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div>
        <h4 className="font-semibold text-text-muted mb-3">What's Included</h4>
        <div className="bg-surface p-2 rounded-lg">
          <ul className="space-y-2 text-text-muted">
            <li>• Professional service delivery</li>
            <li>• Quality assurance and testing</li>
            <li>• Documentation and reporting</li>
            <li>• Customer support and follow-up</li>
            <li>• Warranty and guarantee coverage</li>
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
          disabled={!item.isActive}>
          {item.isActive ? "Add to Quote" : "Request Information"}
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

const ItemCard = ({ item, itemType, productClasses, onDetails, onAddToQuote }: {
  item: any;
  itemType: string;
  productClasses: any[];
  onDetails: (item: any) => void;
  onAddToQuote: (item: any) => void;
}) => {
  let productClass;
  if (itemType === "machines") {
    productClass = productClasses?.find(
      (pc) => pc.id === item.productClassId
    );
  }

  return (
    <div className="bg-foreground rounded border hover:shadow-md transition-shadow">
      <div className="h-48 w-full bg-surface flex items-center justify-center rounded-t-lg text-text-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
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
              {item.name}
            </h3>
            <p className="text-sm text-text-muted mt-1 truncate">
              {item.description || "No description available"}
            </p>
            {productClass && (
              <p className="text-xs text-text-muted mt-2">
                {productClass.name}
              </p>
            )}
          </div>
          <button
            className="text-text-muted hover:text-text cursor-pointer"
            onClick={() => onDetails(item)}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div>
            <div className="text-xs text-text-muted">
              {item.isTemplate ? "Starting from" : "Price"}
            </div>
            <div className="text-lg font-semibold text-text-muted">
              {formatCurrency(item.pricing?.totalPrice || 0, false)}
            </div>
          </div>
          <Button
            onClick={() => onAddToQuote(item)}
            variant="primary">
            Add to Quote
          </Button>
        </div>
      </div>
    </div>
  );
};

const Catalog = () => {
  const [selections, _setSelections] = useState<string[]>([]);
  const [itemType, setItemType] = useState("parts");
  const [view, setView] = useState("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>();

  const navigate = useNavigate();

  const pageTitle = "Coe Catalog";
  const pageDescription = "Complete list of equipment, parts, and services";

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => setView(view === "list" ? "grid" : "list")}
          variant="secondary-outline">
          {view === "list" ? <List size={20} /> : <Grid size={20} />}
        </Button>
        <Button onClick={() => navigate("/sales/catalog/builder")}>
          <PlusCircleIcon size={20} />
          Create New
        </Button>
      </div>
    );
  };

  const { entities: productClasses, loading: productClassesLoading } =
    useGetEntities("/catalog/product-classes");
  
  const { entities: configurations, loading: configurationsLoading } =
    useGetEntities("/catalog/configurations");
  
  const deepestSelectedClassId =
    selections.length > 0 ? selections[selections.length - 1] : "";
  
  const { entities: _productClassOptions, loading: optionsLoading } =
    useGetEntities(
      deepestSelectedClassId
        ? `/catalog/product-classes/${deepestSelectedClassId}/options`
        : ""
    );

  const { entities: optionCategories, loading: _optionCategoriesLoading } =
    useGetEntities("/catalog/option-categories");

  const quoteParams = useMemo(
    () => ({ include: ["journey", "journey.customer"] }),
    []
  );

  const params = useMemo(
    () => ({
      filter: {
        type: itemType,
      },
    }),
    [itemType]
  );

  const { entities: items, loading: itemsLoading } = useGetEntities(
    "/catalog/items",
    params
  );

  const { entities: quotes, loading: quotesLoading } = useGetEntities(
    "/quotes",
    quoteParams
  );

  const handleAddToQuote = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
    setModalMode("add");
  };

  const handleDetails = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
    setModalMode("details");
  };

  const handleModalClose = () => {
    setSelectedItem(null);
    setModalOpen(false);
    setModalMode("");
  };

  // const getFilteredByProductClass = () => {
  //   if (!configurations) return [];

  //   if (selections.length === 0) return configurations;

  //   const lastSelection = selections[selections.length - 1];

  //   return configurations.filter((config) => {
  //     const configClass = productClasses?.find(
  //       (pc) => pc.id === config.productClassId
  //     );
  //     if (!configClass) return false;

  //     return (
  //       configClass.id === lastSelection ||
  //       isDescendantOf(configClass.id, lastSelection, productClasses || [])
  //     );
  //   });
  // };

  console.log(configurations)

  const getFilteredItems = () => {
    return items || [];
  };

  const renderContent = () => {
    const isLoading =
      (itemType === "configs" &&
        (productClassesLoading || configurationsLoading || optionsLoading)) ||
      (itemType === "parts" && itemsLoading) ||
      (itemType === "services" && itemsLoading);

    if (isLoading) {
      return (
        <div className="col-span-full flex items-center justify-center p-8 bg-foreground rounded border">
          <div className="flex flex-col items-center gap-2">
            <Loader size="lg" />
            <p className="text-text-muted">Loading {itemType}...</p>
          </div>
        </div>
      );
    }

    const items = getFilteredItems();

    if (items.length === 0) {
      return (
        <div className="col-span-full text-center p-8 bg-foreground rounded border">
          <p className="text-text-muted">
            No {itemType} match your current filters
          </p>
        </div>
      );
    }

    return items.map((item) => {
      return (
        <ItemCard
          key={item.id}
          item={item}
          itemType={itemType}
          productClasses={productClasses || []}
          onDetails={handleDetails}
          onAddToQuote={handleAddToQuote}
        />
      );
    });
  };

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={<Actions />}
      />

      <div className="p-2">
        <div className="mb-2">
          <div className="inline-flex gap-1 bg-surface rounded-lg p-1">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors rounded cursor-pointer ${
                itemType === "machines"
                  ? "bg-primary text-background"
                  : "text-text-muted hover:bg-foreground"
              }`}
              onClick={() => setItemType("machines")}>
              Machines
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors rounded cursor-pointer ${
                itemType === "parts"
                  ? "bg-primary text-background"
                  : "text-text-muted hover:bg-foreground"
              }`}
              onClick={() => setItemType("parts")}>
              Parts
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors rounded cursor-pointer ${
                itemType === "services"
                  ? "bg-primary text-background"
                  : "text-text-muted hover:bg-foreground"
              }`}
              onClick={() => setItemType("services")}>
              Services
            </button>
          </div>
        </div>

        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
              : "flex flex-col gap-2"
          }>
          {renderContent()}
        </div>
      </div>

      <QuoteModal
        isOpen={modalOpen && modalMode === "add"}
        onClose={handleModalClose}
        item={selectedItem}
        itemType={itemType}
        quotes={quotes || []}
        quotesLoading={quotesLoading}
      />

      <DetailModal
        isOpen={modalOpen && modalMode === "details"}
        onClose={handleModalClose}
        item={selectedItem}
        itemType={itemType}
        productClasses={productClasses || []}
        optionCategories={optionCategories || []}
      />
    </div>
  );
};

export default Catalog;