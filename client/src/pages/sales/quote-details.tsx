import {
  Edit,
  Plus,
  MoreHorizontal,
  ChevronDown,
  CheckCircle,
  Check,
  Send,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  Button,
  Modal,
  PageHeader,
  PageSearch,
  Table,
  Tabs,
} from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { useMemo, useState } from "react";
import useGetQuoteOverview from "@/hooks/sales/use-get-quote-overview";
import useGetItems from "@/hooks/sales/use-get-items";
import { useCreateQuoteItem } from "@/hooks/sales/use-create-quote-item";
import { useApproveQuote } from "@/hooks/sales/use-approve-quote";

const sampleConfigurations = [
  {
    id: "cfg-1",
    name: "Enterprise Core Platform",
    description: "Complete enterprise solution with advanced features",
    pricing: {
      basePrice: 250000,
      adjustments: 25000,
      totalPrice: 275000,
    },
    options: [
      { name: "Advanced Analytics", price: 15000 },
      { name: "Premium Support", price: 10000 },
    ],
  },
  {
    id: "cfg-2",
    name: "Standard Business Package",
    description: "Essential features for growing businesses",
    pricing: {
      basePrice: 125000,
      adjustments: 12500,
      totalPrice: 137500,
    },
    options: [
      { name: "Basic Analytics", price: 7500 },
      { name: "Standard Support", price: 5000 },
    ],
  },
  {
    id: "cfg-3",
    name: "Professional Suite",
    description: "Professional tools for specialized needs",
    pricing: {
      basePrice: 180000,
      adjustments: 18000,
      totalPrice: 198000,
    },
    options: [
      { name: "Professional Tools", price: 12000 },
      { name: "Priority Support", price: 6000 },
    ],
  },
  {
    id: "cfg-4",
    name: "Basic Starter Kit",
    description: "Entry-level solution for small businesses",
    pricing: {
      basePrice: 75000,
      adjustments: 7500,
      totalPrice: 82500,
    },
    options: [
      { name: "Basic Support", price: 5000 },
      { name: "Essential Features", price: 2500 },
    ],
  },
];

const QuoteDetails = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [showAddItemConfirmation, setShowAddItemConfirmation] = useState(false);
  const [selectedItemForConfirmation, setSelectedItemForConfirmation] =
    useState<any>(null);
  const [confirmedItems, setConfirmedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [activeTab, setActiveTab] = useState("items");
  const [selectedQuantity, setSelectedQuantity] = useState<
    Record<string, number>
  >({});

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setSelectedQuantity({});
  };

  const { id: quoteId } = useParams();

  const {
    quoteOverview,
    loading: quoteLoading,
    error: quoteError,
    refresh: refreshQuote,
  } = useGetQuoteOverview({
    quoteId: quoteId || "",
  });

  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    refresh: refreshItems,
  } = useGetItems();

  const {
    loading: addItemLoading,
    error: addItemError,
    success: addItemSuccess,
    createQuoteItem,
  } = useCreateQuoteItem();

  const {
    loading: approveQuoteLoading,
    error: approveQuoteError,
    success: approveQuoteSuccess,
    approveQuote,
  } = useApproveQuote();

  const handleAddItem = async (itemId: string) => {
    const item = items?.find((i: any) => i.id === itemId);
    if (!item) return;

    setSelectedItemForConfirmation(item);
    setShowAddItemConfirmation(true);
  };

  const handleConfirmAddItem = async () => {
    if (!quoteId || !selectedItemForConfirmation) return;

    const result = await createQuoteItem(quoteId, {
      itemId: selectedItemForConfirmation.id,
      quantity: selectedQuantity[selectedItemForConfirmation.id] || 1,
    });
    if (result) {
      await refreshQuote();
      setShowAddItemConfirmation(false);
      setSelectedItemForConfirmation(null);
      toggleModal();
    }
  };

  const handleCancelAddItem = () => {
    setShowAddItemConfirmation(false);
    setSelectedItemForConfirmation(null);
  };

  const handleApproveQuote = async () => {
    if (!quoteId) return;
    const result = await approveQuote(quoteId);
    if (result) {
      await refreshQuote();
      setIsApprovalModalOpen(false);
    }
  };

  const quoteItems = useMemo(() => {
    return quoteOverview?.quoteItems || [];
  }, [quoteOverview]);

  const subtotal = useMemo(() => {
    return quoteItems.reduce(
      (acc: number, item: any) => acc + Number(item.totalPrice),
      0
    );
  }, [quoteItems]);

  const discount = useMemo(() => {
    return quoteItems.reduce(
      (acc: number, item: any) => acc + (Number(item.discount) || 0),
      0
    );
  }, [quoteItems]);

  const tax = useMemo(() => {
    return quoteItems.reduce(
      (acc: number, item: any) => acc + (Number(item.taxAmount) || 0),
      0
    );
  }, [quoteItems]);

  const total = useMemo(() => {
    return subtotal - discount + tax;
  }, [subtotal, discount, tax]);

  const customer = useMemo(() => {
    return quoteOverview?.customer || null;
  }, [quoteOverview]);

  const dealer = useMemo(() => {
    return quoteOverview?.dealer || null;
  }, [quoteOverview]);

  const itemCount = useMemo(() => {
    return quoteItems.reduce(
      (acc: number, item: any) => acc + item.quantity,
      0
    );
  }, [quoteItems]);

  const pageTitle = `${quoteOverview?.quote?.number} (${quoteOverview?.quote?.revision})`;
  const pageDescription = `${itemCount} items • ${formatCurrency(
    total || 0
  )} • ${quoteOverview?.quote?.status}`;

  const handleApproveClick = () => {
    setIsApprovalModalOpen(true);
    // Initialize all items as unconfirmed
    const initialConfirmedState = quoteItems.reduce(
      (acc: Record<string, boolean>, item: { id: string }) => {
        acc[item.id] = false;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setConfirmedItems(initialConfirmedState);
  };

  const toggleItemConfirmation = (itemId: string) => {
    setConfirmedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const allItemsConfirmed = useMemo(() => {
    return Object.values(confirmedItems).every((confirmed) => confirmed);
  }, [confirmedItems]);

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backButton
        onBack={() => navigate("/sales/quotes")}
        actions={[
          {
            type: "button",
            label:
              quoteOverview?.quote?.status === "DRAFT"
                ? "Approve Quote"
                : "Send Quote",
            variant: "primary",
            icon:
              quoteOverview?.quote?.status === "DRAFT" ? (
                <CheckCircle size={16} />
              ) : (
                <Send size={16} />
              ),
            disabled:
              quoteOverview?.quote?.status === "DRAFT" &&
              quoteItems.length === 0,
            onClick: () => {
              if (quoteOverview?.quote?.status === "DRAFT") {
                handleApproveClick();
              } else {
                // TODO: Handle send quote
              }
            },
          },
        ]}
      />

      <div className="mx-auto p-2">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Overview */}
            <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-text-muted">
                  Quote Details
                </div>
              </div>

              <div className="space-y-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-text-muted">Number</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.number}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Revision</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.revision || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Created On</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.createdAt
                      ? formatDate(quoteOverview?.quote?.createdAt)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Created By</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.createdById
                      ? `${quoteOverview?.quote?.createdBy?.firstName} ${quoteOverview?.quote?.createdBy?.lastName}`
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Approved On</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.approvedAt
                      ? formatDate(quoteOverview?.quote?.approvedAt)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Approved By</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.approvedById
                      ? `${quoteOverview?.quote?.approvedBy?.firstName} ${quoteOverview?.quote?.approvedBy?.lastName}`
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Expires On</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.expiryDate
                      ? formatDate(quoteOverview?.quote?.expiryDate)
                      : "-"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-text-muted">Status</div>
                  <div className="text-sm text-text">
                    {quoteOverview?.quote?.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-text-muted">
                  Customer Details
                </div>

                {customer && (
                  <Link
                    to={`/sales/companies/${customer?.id}`}
                    className="text-sm text-text-muted hover:text-text cursor-pointer">
                    View
                  </Link>
                )}
              </div>

              {customer ? (
                <div className="space-y-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-text-muted">Name</div>
                    <div className="text-sm text-text">
                      {customer?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Contact</div>
                    <div className="text-sm text-text">
                      {customer?.contact || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Email</div>
                    <div className="text-sm text-text">
                      {customer?.email || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Phone</div>
                    <div className="text-sm text-text">
                      {customer?.phone || "-"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 items-center justify-center h-full">
                  <div className="text-sm text-text-muted text-center">
                    No customer associated with this quote
                  </div>

                  <Button
                    variant="secondary-outline"
                    className="w-max mx-auto"
                    disabled={quoteOverview?.quote?.status !== "DRAFT"}
                    onClick={() => navigate("/sales/companies/new")}>
                    <Plus size={16} />
                    Add Customer
                  </Button>
                </div>
              )}
            </div>

            {/* Dealer */}
            <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-text-muted">
                  Dealer Details
                </div>

                {dealer && (
                  <Link
                    to={`/sales/companies/${dealer?.id}`}
                    className="text-sm text-text-muted hover:text-text cursor-pointer">
                    View
                  </Link>
                )}
              </div>
              {dealer ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-text-muted">Name</div>
                    <div className="text-sm text-text">
                      {dealer?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Contact</div>
                    <div className="text-sm text-text">
                      {dealer?.contact || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Email</div>
                    <div className="text-sm text-text">
                      {dealer?.email || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Phone</div>
                    <div className="text-sm text-text">
                      {dealer?.phone || "-"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 items-center justify-center h-full">
                  <div className="text-sm text-text-muted text-center">
                    No dealer associated with this quote
                  </div>

                  <Button
                    variant="secondary-outline"
                    className="w-max mx-auto"
                    disabled={quoteOverview?.quote?.status !== "DRAFT"}
                    onClick={() => navigate("/sales/companies/new")}>
                    <Plus size={16} />
                    Add Dealer
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border overflow-hidden">
            <div className="p-2 bg-foreground border-b flex justify-between items-center">
              <h2 className="font-semibold text-text-muted text-sm">
                Quote Items
              </h2>
              <Button
                onClick={toggleModal}
                disabled={quoteOverview?.quote?.status !== "DRAFT"}
                variant="secondary-outline">
                <Plus size={16} />
                Add Item
              </Button>
            </div>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-foreground">
                <tr>
                  <th
                    scope="col"
                    className="p-2 text-left text-xs font-medium text-text-muted uppercase">
                    Line
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-left text-xs font-medium text-text-muted uppercase">
                    Item
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-left text-xs font-medium text-text-muted uppercase">
                    Description
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Unit Price
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Tax
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Total
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="bg-foreground divide-y divide-border">
                {quoteItems
                  .sort((a: any, b: any) => a.lineNumber - b.lineNumber)
                  .map((item: any) => (
                    <tr key={item.id}>
                      <td className="p-2 whitespace-nowrap text-left">
                        <div className="text-sm text-text-muted">
                          {item.lineNumber}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-text">
                          {item.item.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-text">
                          {item.item.description}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap text-right">
                        <div className="text-sm text-text">{item.quantity}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap text-right">
                        <div className="text-sm text-text">
                          {formatCurrency(item.unitPrice || 0)}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap text-right">
                        <div className="text-sm text-text">
                          {formatCurrency(item.discount || 0)}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap text-right">
                        <div className="text-sm text-text">
                          {formatCurrency(item.tax || 0)}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-text">
                          {formatCurrency(item.totalPrice || 0)}
                        </div>
                      </td>
                      <td className="flex items-center justify-end p-2">
                        <Button variant="secondary-outline">
                          <MoreHorizontal size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-foreground">
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 text-right text-sm uppercase text-text-muted">
                    Subtotal
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-sm text-text-muted">
                    {formatCurrency(subtotal || 0)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 text-right text-sm uppercase text-text-muted">
                    Discount
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-sm text-text-muted">
                    {discount > 0 ? "-" : ""} {formatCurrency(discount || 0)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 text-right text-sm uppercase text-text-muted">
                    Tax
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-sm text-text-muted">
                    {formatCurrency(tax || 0)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t border-border">
                  <td
                    colSpan={5}
                    className="p-2 text-right text-sm uppercase font-bold text-text-muted">
                    Total
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-sm font-bold text-text-muted">
                    {formatCurrency(total || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={toggleModal}
        title={
          showAddItemConfirmation
            ? "Confirm Item Addition"
            : "Add Item to Quote"
        }
        size={showAddItemConfirmation ? "sm" : "lg"}>
        <div className="flex flex-col gap-4">
          {showAddItemConfirmation ? (
            <>
              <div className="text-sm text-text-muted">
                Are you sure you want to add this item to the quote?
              </div>

              <div className="space-y-2">
                <div>
                  <div className="font-medium text-text">
                    {selectedItemForConfirmation?.name}
                  </div>
                  <div className="text-sm text-text-muted">
                    Quantity:{" "}
                    {selectedQuantity[selectedItemForConfirmation?.id] || 1} ×{" "}
                    {formatCurrency(
                      selectedItemForConfirmation?.unitPrice || 0
                    )}
                    ={" "}
                    {formatCurrency(
                      (selectedQuantity[selectedItemForConfirmation?.id] || 1) *
                        (selectedItemForConfirmation?.unitPrice || 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="secondary-outline"
                  onClick={handleCancelAddItem}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmAddItem}>
                  Confirm
                </Button>
              </div>
            </>
          ) : (
            <>
              <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={[
                  { label: "Items", value: "items" },
                  { label: "Configurations", value: "configurations" },
                ]}
              />

              <PageSearch
                placeholder={`Search ${activeTab}...`}
                filters={[
                  { label: "Category", icon: ChevronDown, onClick: () => {} },
                  {
                    label: "Price Range",
                    icon: ChevronDown,
                    onClick: () => {},
                  },
                ]}
              />

              {activeTab === "items" ? (
                <Table
                  columns={[
                    {
                      key: "name",
                      header: "Item",
                    },
                    {
                      key: "description",
                      header: "Description",
                    },
                    {
                      key: "unitPrice",
                      header: "Unit Price",
                      render: (value) => formatCurrency(value as number),
                      className: "text-right",
                    },
                    {
                      key: "quantity",
                      header: "Quantity",
                      render: (_, row) => (
                        <input
                          type="number"
                          min="1"
                          defaultValue={selectedQuantity[row.id] || 1}
                          onChange={(e) =>
                            setSelectedQuantity({
                              ...selectedQuantity,
                              [row.id]: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      ),
                      className: "text-right",
                    },
                    {
                      key: "actions",
                      header: "",
                      render: (_, row) => (
                        <div className="flex justify-end">
                          <Button
                            variant="secondary-outline"
                            onClick={() => handleAddItem(row.id)}
                            disabled={addItemLoading}>
                            {addItemLoading ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      ),
                      className: "text-right",
                    },
                  ]}
                  data={items || []}
                  total={items?.length || 0}
                />
              ) : (
                <Table
                  columns={[
                    {
                      key: "name",
                      header: "Configuration",
                      className: "text-primary",
                    },
                    {
                      key: "description",
                      header: "Description",
                    },
                    {
                      key: "pricing.totalPrice",
                      header: "Total Price",
                      render: (_, row) =>
                        formatCurrency(row.pricing.totalPrice),
                      className: "text-right",
                    },
                    {
                      key: "quantity",
                      header: "Quantity",
                      render: (_) => (
                        <input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      ),
                      className: "text-right",
                    },
                  ]}
                  data={sampleConfigurations}
                  total={sampleConfigurations.length}
                  onRowClick={(row) => {
                    console.log("Selected configuration:", row);
                    toggleModal();
                  }}
                />
              )}

              <div className="flex justify-between gap-2 pt-4 border-t">
                {activeTab === "configurations" && (
                  <Button
                    variant="secondary-outline"
                    onClick={() => navigate("/sales/catalog/builder")}>
                    <Plus size={16} />
                    New Config
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="secondary-outline"
                    onClick={toggleModal}>
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Confirm Quote Approval"
        size="sm">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-text-muted">
            Please review and confirm each item before approving the quote.
          </div>

          <div className="space-y-2">
            {quoteItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-foreground rounded border">
                <div className="flex-1">
                  <div className="font-medium text-text">{item.item.name}</div>
                  <div className="text-sm text-text-muted">
                    Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}{" "}
                    = {formatCurrency(item.totalPrice)}
                  </div>
                </div>
                <Button
                  variant={
                    confirmedItems[item.id] ? "primary" : "secondary-outline"
                  }
                  onClick={() => toggleItemConfirmation(item.id)}
                  className="ml-4">
                  <Check size={16} />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="secondary-outline"
              onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!allItemsConfirmed}
              onClick={() => {
                handleApproveQuote();
              }}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuoteDetails;

const AddItemModal = () => {};

const ApproveModal = () => {};
