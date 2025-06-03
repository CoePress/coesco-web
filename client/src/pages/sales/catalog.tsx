import {
  Filter,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Import,
} from "lucide-react";
import { useState } from "react";

import { formatCurrency } from "@/utils";
import { Button, Modal, PageHeader, PageSearch } from "@/components";
import {
  sampleConfigurations,
  sampleOptionCategories,
  sampleOptions,
  sampleProductClasses,
} from "@/utils/sample-data";

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

const isDescendantOf = (childId: string, parentId: string): boolean => {
  let current = sampleProductClasses.find((pc) => pc.id === childId);
  while (current) {
    if (current.parentId === parentId) return true;
    current = sampleProductClasses.find((pc) => pc.id === current?.parentId);
  }
  return false;
};

const QuoteModal = ({
  isOpen,
  onClose,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: any;
}) => {
  const [selectedQuote, setSelectedQuote] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

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
            Are you sure you want to add {config?.name} to Quote #
            {selectedQuote}?
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
        className="w-full p-2 border rounded-md bg-foreground"
        value={selectedQuote}
        onChange={(e) => setSelectedQuote(e.target.value)}>
        <option value="">Select existing quote...</option>
        <option value="1234">Quote #1234</option>
        <option value="5678">Quote #5678</option>
      </select>

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
        Selected Configuration: {config?.name}
      </div>
    </Modal>
  );
};

const Catalog = () => {
  const [viewMode] = useState<"grid" | "list">("grid");
  const [selections, setSelections] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<{
    [key: string]: string;
  }>({});
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const getOptionsForLevel = (
    level: number
  ): Array<{ id: string; name: string }> => {
    if (level === 0) {
      return sampleProductClasses.filter((pc) => pc.parentId === null);
    }

    const parentId = selections[level - 1];
    return parentId
      ? sampleProductClasses.filter((pc) => pc.parentId === parentId)
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

  const visibleLevels = selections.length + 1;

  const getFilteredByProductClass = () => {
    if (selections.length === 0) return sampleConfigurations;

    const lastSelection = selections[selections.length - 1];

    return sampleConfigurations.filter((config) => {
      const configClass = sampleProductClasses.find(
        (pc) => pc.id === config.productClassId
      );
      if (!configClass) return false;

      return (
        configClass.id === lastSelection ||
        isDescendantOf(configClass.id, lastSelection)
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
          (opt) => opt.categoryId === categoryId
        );
        const configOptionIds = config.options.map((opt) => opt.optionId);

        return categoryOptions.some(
          (opt) => opt.id === optionId && configOptionIds.includes(opt.id)
        );
      });
    });
  };

  const pageTitle = "Equipment Catalog";
  const pageDescription = "Browse our complete range of processing equipment";

  const sortedCategories = [...sampleOptionCategories].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

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
            onClick: () => {},
          },
        ]}
      />

      <PageSearch
        placeholder="Search equipment..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
        label="Equipment"
        labelTrigger={false}
      />

      <div className="p-2">
        <div className="flex gap-2">
          <div className="w-64 flex-shrink-0">
            <div className="bg-foreground rounded border p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-text-muted">Filters</h2>
                <Button
                  onClick={() => {
                    setSelections([]);
                    setCategoryFilters({});
                  }}
                  variant="secondary-outline">
                  Reset
                </Button>
              </div>

              <div className="flex flex-col gap-2 text-text-muted">
                <h3 className="text-sm font-medium">Product Class</h3>
                {Array.from({ length: visibleLevels }).map((_, level) => {
                  const options = getOptionsForLevel(level);

                  return options.length > 0 ? (
                    <select
                      key={`product-class-${level}`}
                      value={selections[level] || ""}
                      onChange={(e) =>
                        handleSelectionChange(level, e.target.value)
                      }
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

                  {sortedCategories.map((category) => (
                    <div
                      key={category.id}
                      className="mb-4">
                      <label className="block text-sm mb-1">
                        {category.name} {category.isRequired && "*"}
                      </label>
                      <select
                        value={categoryFilters[category.id] || ""}
                        onChange={(e) =>
                          handleCategoryFilterChange(
                            category.id,
                            e.target.value
                          )
                        }
                        className="rounded border-border bg-foreground w-full">
                        <option value="">Any</option>
                        {sampleOptions
                          .filter((opt) => opt.categoryId === category.id)
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((option) => (
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
            </div>
          </div>

          <div className="flex-1">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
                  : "space-y-4"
              }>
              {getVisibleConfigurations().map((config) => {
                const productClass = sampleProductClasses.find(
                  (pc) => pc.id === config.productClassId
                );

                const configOptions = config.options.map((configOpt) => {
                  const option = sampleOptions.find(
                    (opt) => opt.id === configOpt.optionId
                  );
                  const category = option
                    ? sampleOptionCategories.find(
                        (cat) => cat.id === option.categoryId
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
                    <div className="p-4">
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
                        <button className="text-text-muted hover:text-text">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>

                      <div className="mt-3 text-xs text-text-muted">
                        {configOptions
                          .filter((co) => co.category && co.option)
                          .sort(
                            (a, b) =>
                              (a.category?.displayOrder || 0) -
                              (b.category?.displayOrder || 0)
                          )
                          .map((co, idx) => (
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

                      <div className="mt-4 pt-4 border-t flex gap-4 flex-col">
                        <div>
                          <div className="text-xs text-text-muted">
                            {config.isTemplate ? "Starting from" : "Price"}
                          </div>
                          <div className="text-lg font-semibold text-text-muted">
                            {formatCurrency(config.pricing.totalPrice, false)}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedConfig(config);
                            setIsQuoteModalOpen(true);
                          }}
                          variant="primary">
                          Add to Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {getVisibleConfigurations().length === 0 && (
                <div className="col-span-full text-center p-8 bg-foreground rounded border">
                  <p className="text-text-muted">
                    No configurations match your current filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        config={selectedConfig}
      />
    </div>
  );
};

export default Catalog;
