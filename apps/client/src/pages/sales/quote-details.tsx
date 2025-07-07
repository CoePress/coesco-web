import {
  Edit,
  Plus,
  ChevronDown,
  CheckCircle,
  Check,
  Send,
  Eye,
  X,
  Trash,
  GripVertical,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  Button,
  Card,
  Loader,
  Modal,
  PageHeader,
  PageSearch,
  Table,
  Tabs,
} from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { useMemo, useState, useEffect } from "react";
import useGetQuoteOverview from "@/hooks/sales/use-get-quote-overview";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { useCreateEntity } from "@/hooks/_base/use-create-entity";
import { useDeleteEntity } from "@/hooks/_base/use-delete-entity";
import { useApproveQuote } from "@/hooks/sales/use-approve-quote";
import { useSendQuote } from "@/hooks/sales/use-send-quote";
import { useCreateQuoteRevision } from "@/hooks/sales/use-create-quote-revision";
import { useUpdateLineNumber } from "@/hooks/sales/use-update-linenumber";

const QuoteDetails = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSendConfirmationOpen, setIsSendConfirmationOpen] = useState(false);
  const [isRevisionConfirmationOpen, setIsRevisionConfirmationOpen] =
    useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const { id: quoteId } = useParams();

  useEffect(() => {
    const handleMouseUp = () => {
      setDraggedItemId(null);
      setHoveredRowId(null);
    };

    const handleMouseLeave = () => {
      setDraggedItemId(null);
      setHoveredRowId(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragEnd = async () => {
    if (draggedItemId && hoveredRowId) {
      const currentItems = quoteItems.sort(
        (a: any, b: any) => a.lineNumber - b.lineNumber
      );
      const draggedItem = currentItems.find(
        (item: any) => item.id === draggedItemId
      );

      if (draggedItem) {
        let newLineNumber = 1;

        if (hoveredRowId === "top") {
          newLineNumber = 1;
        } else {
          const afterItemId = hoveredRowId.replace("after-", "");
          const afterItem = currentItems.find(
            (item: any) => item.id === afterItemId
          );

          if (afterItem) {
            newLineNumber = afterItem.lineNumber + 1;
          } else {
            newLineNumber = currentItems.length + 1;
          }
        }

        await updateLineNumber(draggedItemId, newLineNumber);
        refreshQuote();
      }
    }

    setDraggedItemId(null);
    setHoveredRowId(null);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggedItemId) return;

    const dropZones = document.querySelectorAll("[data-drop-zone]");
    let closestZone: HTMLElement | null = null;
    let closestDistance = Infinity;

    dropZones.forEach((zone) => {
      const el = zone as HTMLElement;
      const rect = el.getBoundingClientRect();
      const zoneCenter = rect.top + rect.height / 2;
      const distance = Math.abs(e.clientY - zoneCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZone = el;
      }
    });

    if (closestZone !== null) {
      const zoneId = (closestZone as HTMLElement).getAttribute(
        "data-drop-zone"
      );
      setHoveredRowId(zoneId || null);
    } else {
      setHoveredRowId(null);
    }
  };

  const handleDragLeave = () => {
    setHoveredRowId(null);
  };

  const { quoteOverview, refresh: refreshQuote } = useGetQuoteOverview({
    quoteId: quoteId || "",
  });

  const { updateLineNumber } = useUpdateLineNumber();

  const quoteItems = quoteOverview?.quoteItems || [];
  const customer = quoteOverview?.customer || null;
  const dealer = quoteOverview?.dealer || null;

  const pageTitle = `${quoteOverview?.quote?.number} (${quoteOverview?.quote?.revision})`;
  const pageDescription = `${quoteItems.reduce(
    (acc: number, item: any) => acc + item.quantity,
    0
  )} items • ${formatCurrency(
    quoteItems.reduce(
      (acc: number, item: any) => acc + Number(item.totalPrice),
      0
    ) -
      quoteItems.reduce(
        (acc: number, item: any) => acc + (Number(item.discount) || 0),
        0
      ) +
      quoteItems.reduce(
        (acc: number, item: any) => acc + (Number(item.taxAmount) || 0),
        0
      )
  )} • ${quoteOverview?.quote?.status}`;

  const renderQuoteActions = () => {
    switch (quoteOverview?.quote?.status) {
      case "DRAFT":
        return [
          {
            type: "button",
            label: "Approve Quote",
            variant: "primary",
            icon: <CheckCircle size={16} />,
            disabled: quoteItems.length === 0,
            onClick: () => setIsApprovalModalOpen(true),
          },
        ];
      case "APPROVED":
        return [
          {
            type: "button",
            label: "Edit Quote",
            variant: "secondary-outline",
            icon: <Edit size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Send Quote",
            variant: "primary",
            icon: <Send size={16} />,
            onClick: () => setIsSendConfirmationOpen(true),
          },
        ];
      case "SENT":
        return [
          {
            type: "button",
            label: "View Quote",
            variant: "secondary-outline",
            icon: <Eye size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Create Revision",
            variant: "primary",
            icon: <Edit size={16} />,
            onClick: () => setIsRevisionConfirmationOpen(true),
          },
        ];
    }
  };

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backButton
        onBack={() => navigate("/sales/quotes")}
        actions={renderQuoteActions() as any}
      />

      <div className="mx-auto p-2">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Overview */}
            <Card>
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
            </Card>

            {/* Customer */}
            <Card>
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
                    onClick={() => setIsCustomerModalOpen(true)}>
                    <Plus size={16} />
                    Add Customer
                  </Button>
                </div>
              )}
            </Card>

            {/* Dealer */}
            <Card>
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
                    onClick={() => setIsDealerModalOpen(true)}>
                    <Plus size={16} />
                    Add Dealer
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div className="bg-foreground border-b flex justify-between items-center pb-2">
              <h2 className="font-semibold text-text-muted text-sm">
                Quote Items
              </h2>
              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={quoteOverview?.quote?.status !== "DRAFT"}
                variant="secondary-outline">
                <Plus size={16} />
                Add Item
              </Button>
            </div>

            {/* Header */}
            <div className="bg-foreground border-b border-border">
              <div
                className="grid p-2 text-xs font-medium text-text-muted uppercase"
                style={{
                  gridTemplateColumns:
                    "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 64px",
                }}>
                <div></div>
                <div>Line</div>
                <div>Item</div>
                <div>Description</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Discount</div>
                <div className="text-right">Tax</div>
                <div className="text-right">Total</div>
                <div className="text-right"></div>
              </div>
            </div>

            {/* Drop Zones and Items */}
            <div
              className={`relative select-none ${draggedItemId ? "cursor-grabbing" : ""}`}
              onMouseUp={handleDragEnd}
              onMouseMove={handleDragMove}
              onMouseLeave={handleDragLeave}>
              <div
                data-drop-zone="top"
                className={`h-px transition-colors ${hoveredRowId === "top" ? "bg-primary" : "bg-transparent"}`}
                style={{ margin: 0, border: 0 }}
              />
              {quoteItems
                .sort((a: any, b: any) => a.lineNumber - b.lineNumber)
                .map((item: any) => (
                  <div key={item.id}>
                    {/* Item row */}
                    <div
                      data-item-id={item.id}
                      className={`grid items-center p-2 border-b border-border hover:bg-foreground/50 transition-opacity ${draggedItemId && draggedItemId !== item.id ? "opacity-50" : ""}`}
                      style={{
                        gridTemplateColumns:
                          "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 64px",
                      }}>
                      <div className="flex items-center">
                        <GripVertical
                          size={16}
                          className="text-text-muted cursor-grab"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleDragStart(item.id);
                          }}
                        />
                      </div>
                      <div className="text-sm text-text-muted">
                        {item.lineNumber}
                      </div>
                      <div className="text-sm font-medium text-text">
                        {item.item.name}
                      </div>
                      <div className="text-sm text-text">
                        {item.item.description}
                      </div>
                      <div className="text-sm text-text text-right">
                        {editingItemId === item.id ? (
                          <input
                            value={editingQuantity}
                            onChange={(e) =>
                              setEditingQuantity(parseInt(e.target.value) || 1)
                            }
                            className="px-2 rounded text-right text-text text-sm w-14"
                            autoFocus
                          />
                        ) : (
                          item.quantity
                        )}
                      </div>
                      <div className="text-sm text-text text-right">
                        {formatCurrency(item.unitPrice || 0)}
                      </div>
                      <div className="text-sm text-text text-right">
                        {formatCurrency(item.discount || 0)}
                      </div>
                      <div className="text-sm text-text text-right">
                        {formatCurrency(item.tax || 0)}
                      </div>
                      <div className="text-sm font-medium text-text text-right">
                        {formatCurrency(item.totalPrice || 0)}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        {editingItemId === item.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingQuantity(0);
                              }}>
                              <X size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingQuantity(0);
                              }}>
                              <Check size={16} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (quoteOverview?.quote?.status === "DRAFT") {
                                  setEditingItemId(item.id);
                                  setEditingQuantity(item.quantity);
                                }
                              }}>
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (quoteOverview?.quote?.status === "DRAFT") {
                                  setSelectedItem(item);
                                  setIsDeleteItemModalOpen(true);
                                }
                              }}>
                              <Trash size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      data-drop-zone={`after-${item.id}`}
                      className={`h-px transition-colors ${hoveredRowId === `after-${item.id}` ? "bg-primary" : "bg-transparent"}`}
                      style={{ margin: 0, border: 0 }}
                    />
                  </div>
                ))}
            </div>

            <div className="bg-foreground">
              <div className="grid grid-cols-10 gap-2 p-2">
                <div className="col-span-6 text-right text-sm uppercase text-text-muted">
                  Subtotal
                </div>
                <div className="col-span-2 text-right text-sm text-text-muted">
                  {formatCurrency(
                    quoteItems.reduce(
                      (acc: number, item: any) => acc + Number(item.totalPrice),
                      0
                    )
                  )}
                </div>
                <div className="col-span-2"></div>
              </div>
              <div className="grid grid-cols-10 gap-2 p-2">
                <div className="col-span-6 text-right text-sm uppercase text-text-muted">
                  Discount
                </div>
                <div className="col-span-2 text-right text-sm text-text-muted">
                  {quoteItems.reduce(
                    (acc: number, item: any) =>
                      acc + (Number(item.discount) || 0),
                    0
                  ) > 0
                    ? "-"
                    : ""}{" "}
                  {formatCurrency(
                    quoteItems.reduce(
                      (acc: number, item: any) =>
                        acc + (Number(item.discount) || 0),
                      0
                    )
                  )}
                </div>
                <div className="col-span-2"></div>
              </div>
              <div className="grid grid-cols-10 gap-2 p-2">
                <div className="col-span-6 text-right text-sm uppercase text-text-muted">
                  Tax
                </div>
                <div className="col-span-2 text-right text-sm text-text-muted">
                  {formatCurrency(
                    quoteItems.reduce(
                      (acc: number, item: any) =>
                        acc + (Number(item.taxAmount) || 0),
                      0
                    )
                  )}
                </div>
                <div className="col-span-2"></div>
              </div>
              <div className="grid grid-cols-10 gap-2 p-2 border-t border-border">
                <div className="col-span-6 text-right text-sm uppercase font-bold text-text-muted">
                  Total
                </div>
                <div className="col-span-2 text-right text-sm font-bold text-text-muted">
                  {formatCurrency(
                    quoteItems.reduce(
                      (acc: number, item: any) => acc + Number(item.totalPrice),
                      0
                    ) -
                      quoteItems.reduce(
                        (acc: number, item: any) =>
                          acc + (Number(item.discount) || 0),
                        0
                      ) +
                      quoteItems.reduce(
                        (acc: number, item: any) =>
                          acc + (Number(item.taxAmount) || 0),
                        0
                      )
                  )}
                </div>
                <div className="col-span-2"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        quoteId={quoteId || ""}
        onSuccess={refreshQuote}
      />

      {isDealerModalOpen && (
        <SelectCompanyModal
          isOpen={isDealerModalOpen}
          onClose={() => setIsDealerModalOpen(false)}
          quoteId={quoteId || ""}
          onSuccess={refreshQuote}
          type="dealer"
        />
      )}

      <ApproveQuoteModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        quoteId={quoteId || ""}
        quoteItems={quoteItems}
        onSuccess={refreshQuote}
      />

      <SendQuoteModal
        isOpen={isSendConfirmationOpen}
        onClose={() => setIsSendConfirmationOpen(false)}
        quoteId={quoteId || ""}
        onSuccess={refreshQuote}
      />

      <CreateRevisionModal
        isOpen={isRevisionConfirmationOpen}
        onClose={() => setIsRevisionConfirmationOpen(false)}
        quoteId={quoteId || ""}
        onSuccess={refreshQuote}
      />

      <DeleteItemModal
        isOpen={isDeleteItemModalOpen}
        onClose={() => {
          setIsDeleteItemModalOpen(false);
          setSelectedItem(null);
        }}
        quoteId={quoteId || ""}
        item={selectedItem}
        onSuccess={refreshQuote}
      />

      {isCustomerModalOpen && (
        <SelectCompanyModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          quoteId={quoteId || ""}
          onSuccess={refreshQuote}
          type="customer"
        />
      )}
    </div>
  );
};

const AddItemModal = ({
  isOpen,
  onClose,
  quoteId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess: () => void;
}) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<
    Record<string, number>
  >({});
  const [activeTab, setActiveTab] = useState("machines");

  const {
    loading: addItemLoading,
    error: addItemError,
    createEntity: createQuoteItem,
  } = useCreateEntity(`/quotes/${quoteId}/items`);

  const handleAddItem = async (item: any) => {
    setSelectedItem(item);
    setShowConfirmation(true);
  };

  const handleConfirmAddItem = async () => {
    if (!quoteId || !selectedItem) return;

    const result = await createQuoteItem({
      itemId: selectedItem.id,
      quantity: selectedQuantity[selectedItem.id] || 1,
    });
    if (result) {
      onSuccess();
      setShowConfirmation(false);
      setSelectedItem(null);
      onClose();
    }
  };

  const handleCancelAddItem = () => {
    setShowConfirmation(false);
    setSelectedItem(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showConfirmation ? "Confirm Item Addition" : "Add Item to Quote"}
      size={showConfirmation ? "sm" : "lg"}>
      <div className="flex flex-col h-full">
        {showConfirmation ? (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-text-muted">
              Are you sure you want to add this item to the quote?
            </div>

            {addItemError && (
              <div className="text-sm text-red-500">{addItemError}</div>
            )}

            <div className="space-y-2">
              <div>
                <div className="font-medium text-text">
                  {selectedItem?.name}
                </div>
                <div className="text-sm text-text-muted">
                  Quantity: {selectedQuantity[selectedItem?.id] || 1} ×{" "}
                  {formatCurrency(selectedItem?.unitPrice || 0)} ={" "}
                  {formatCurrency(
                    (selectedQuantity[selectedItem?.id] || 1) *
                      (selectedItem?.unitPrice || 0)
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="secondary-outline"
                onClick={handleCancelAddItem}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAddItem}
                disabled={addItemLoading}>
                {addItemLoading ? "Adding..." : "Confirm"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 space-y-4">
              <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={[
                  { label: "Machines", value: "machines" },
                  { label: "Parts", value: "parts" },
                  { label: "Services", value: "services" },
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
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
              {activeTab === "machines" && isOpen && (
                <MachinesTab
                  onAddItem={handleAddItem}
                  addItemLoading={addItemLoading}
                  selectedQuantity={selectedQuantity}
                  setSelectedQuantity={setSelectedQuantity}
                />
              )}

              {activeTab === "parts" && isOpen && (
                <ItemsTab
                  onAddItem={handleAddItem}
                  addItemLoading={addItemLoading}
                  selectedQuantity={selectedQuantity}
                  setSelectedQuantity={setSelectedQuantity}
                  filter={{ type: "parts" }}
                />
              )}

              {activeTab === "services" && isOpen && (
                <ItemsTab
                  onAddItem={handleAddItem}
                  addItemLoading={addItemLoading}
                  selectedQuantity={selectedQuantity}
                  setSelectedQuantity={setSelectedQuantity}
                  filter={{ type: "services" }}
                />
              )}
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t flex-shrink-0">
              <Button
                variant="secondary-outline"
                onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-2 items-center">
                {activeTab === "configurations" && (
                  <Button
                    variant="secondary-outline"
                    onClick={() => navigate("/sales/catalog/builder")}>
                    <Plus size={16} />
                    New Config
                  </Button>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="secondary-outline"
                    size="sm">
                    <ChevronDown
                      className="rotate-90"
                      size={16}
                    />
                  </Button>
                  <Button
                    variant="secondary-outline"
                    size="sm">
                    1
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled>
                    2
                  </Button>
                  <Button
                    variant="secondary-outline"
                    size="sm">
                    3
                  </Button>
                  <Button
                    variant="secondary-outline"
                    size="sm">
                    <ChevronDown
                      className="-rotate-90"
                      size={16}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const ItemsTab = ({
  onAddItem,
  addItemLoading,
  selectedQuantity,
  setSelectedQuantity,
  filter,
}: {
  onAddItem: (item: any) => void;
  addItemLoading: boolean;
  selectedQuantity: Record<string, number>;
  setSelectedQuantity: (quantity: Record<string, number>) => void;
  filter?: Record<string, any>;
}) => {
  const {
    entities: items,
    loading: itemsLoading,
    error: itemsError,
  } = useGetEntities("/items", { filter });

  return (
    <div className="h-full flex flex-col">
      {itemsLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : itemsError ? (
        <div className="text-sm text-red-500">{itemsError}</div>
      ) : (
        <Table
          columns={[
            {
              key: "name",
              header: "Item",
              className: "text-primary",
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
                    onClick={() => onAddItem(row)}
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
      )}
    </div>
  );
};

const MachinesTab = ({
  onAddItem,
  addItemLoading,
  selectedQuantity,
  setSelectedQuantity,
}: {
  onAddItem: (item: any) => void;
  addItemLoading: boolean;
  selectedQuantity: Record<string, number>;
  setSelectedQuantity: (quantity: Record<string, number>) => void;
}) => {
  const {
    entities: configurations,
    loading: configurationsLoading,
    error: configurationsError,
  } = useGetEntities("/configurations");

  return (
    <div className="h-full flex flex-col">
      {configurationsLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : configurationsError ? (
        <div className="text-sm text-red-500">{configurationsError}</div>
      ) : (
        <Table
          columns={[
            {
              key: "name",
              header: "Machine",
              className: "text-primary",
            },
            {
              key: "description",
              header: "Description",
            },
            {
              key: "totalPrice",
              header: "Total Price",
              render: (_, row) => formatCurrency(row.totalPrice || 0),
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
                    onClick={() => onAddItem(row)}
                    disabled={addItemLoading}>
                    {addItemLoading ? "Adding..." : "Add"}
                  </Button>
                </div>
              ),
              className: "text-right",
            },
          ]}
          data={configurations || []}
          total={configurations?.length || 0}
        />
      )}
    </div>
  );
};

const SelectCompanyModal = ({
  isOpen,
  onClose,
  quoteId,
  onSuccess,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess: () => void;
  type: "customer" | "dealer";
}) => {
  const navigate = useNavigate();
  const { entities: companies } = useGetEntities("/companies");

  const handleSelectCompany = async () => {
    console.log(`Selected ${type}:`, quoteId);
    onSuccess();
    onClose();
  };

  const title = type === "customer" ? "Select Customer" : "Select Dealer";
  const placeholder = `Search ${type}s...`;
  const newButtonText = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg">
      <div className="flex flex-col gap-4">
        <PageSearch
          placeholder={placeholder}
          filters={[
            { label: "Location", icon: ChevronDown, onClick: () => {} },
            { label: "Status", icon: ChevronDown, onClick: () => {} },
          ]}
        />

        <Table
          columns={[
            {
              key: "name",
              header: type.charAt(0).toUpperCase() + type.slice(1),
              className: "text-primary",
            },
            {
              key: "contact",
              header: "Contact",
            },
            {
              key: "email",
              header: "Email",
            },
            {
              key: "phone",
              header: "Phone",
            },
            {
              key: "website",
              header: "Website",
            },
            {
              key: "actions",
              header: "",
              render: () => (
                <div className="flex justify-end">
                  <Button
                    variant="secondary-outline"
                    onClick={() => handleSelectCompany()}>
                    Select
                  </Button>
                </div>
              ),
              className: "text-right",
            },
          ]}
          data={companies || []}
          total={companies?.length || 0}
        />

        <div className="flex justify-between gap-2 pt-2 border-t">
          <Button
            variant="secondary-outline"
            onClick={() => navigate("/sales/companies/new")}>
            <Plus size={16} />
            {newButtonText}
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="secondary-outline"
              onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const ApproveQuoteModal = ({
  isOpen,
  onClose,
  quoteId,
  quoteItems,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  quoteItems: any[];
  onSuccess: () => void;
}) => {
  const [confirmedItems, setConfirmedItems] = useState<Record<string, boolean>>(
    {}
  );

  // Reset confirmed items when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmedItems(
        quoteItems.reduce(
          (acc, item) => {
            acc[item.id] = false;
            return acc;
          },
          {} as Record<string, boolean>
        )
      );
    }
  }, [isOpen, quoteItems]);

  const {
    loading: approveQuoteLoading,
    error: approveQuoteError,
    approveQuote,
  } = useApproveQuote();

  const allItemsConfirmed = useMemo(() => {
    return (
      quoteItems.length > 0 &&
      quoteItems.every((item) => confirmedItems[item.id])
    );
  }, [confirmedItems, quoteItems]);

  const toggleItemConfirmation = (itemId: string) => {
    setConfirmedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleApprove = async () => {
    if (!quoteId || !allItemsConfirmed) return;
    const result = await approveQuote(quoteId);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Quote Approval"
      size="sm">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-muted">
          Please review and confirm each item before approving the quote. All
          items must be confirmed.
        </div>

        {approveQuoteError && (
          <div className="text-sm text-red-500">{approveQuoteError}</div>
        )}

        <div className="space-y-2">
          {quoteItems.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-foreground rounded border">
              <div className="flex-1">
                <div className="font-medium text-text">{item.item.name}</div>
                <div className="text-sm text-text-muted">
                  Quantity: {item.quantity} × {formatCurrency(item.unitPrice)} ={" "}
                  {formatCurrency(item.totalPrice)}
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

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="secondary-outline"
            onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!allItemsConfirmed || approveQuoteLoading}
            onClick={handleApprove}>
            {approveQuoteLoading ? "Approving..." : "Submit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const SendQuoteModal = ({
  isOpen,
  onClose,
  quoteId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess: () => void;
}) => {
  const {
    loading: sendQuoteLoading,
    error: sendQuoteError,
    sendQuote,
  } = useSendQuote();

  const handleSend = async () => {
    if (!quoteId) return;
    const result = await sendQuote(quoteId);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Send Quote"
      size="xs">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-muted">
          Are you sure you want to send this quote? This action cannot be
          undone.
        </div>

        {sendQuoteError && (
          <div className="text-sm text-red-500">{sendQuoteError}</div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="secondary-outline"
            onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={sendQuoteLoading}>
            {sendQuoteLoading ? "Sending..." : "Send Quote"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const CreateRevisionModal = ({
  isOpen,
  onClose,
  quoteId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess: () => void;
}) => {
  const {
    loading: createRevisionLoading,
    error: createRevisionError,
    createQuoteRevision,
  } = useCreateQuoteRevision();

  const handleCreateRevision = async () => {
    if (!quoteId) return;
    const result = await createQuoteRevision(quoteId);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Create Revision"
      size="xs">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-muted">
          Are you sure you want to create a new revision of this quote? This
          will create a copy of the current quote.
        </div>

        {createRevisionError && (
          <div className="text-sm text-red-500">{createRevisionError}</div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="secondary-outline"
            onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateRevision}
            disabled={createRevisionLoading}>
            {createRevisionLoading ? "Creating..." : "Create Revision"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const DeleteItemModal = ({
  isOpen,
  onClose,
  quoteId,
  item,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  item: any;
  onSuccess: () => void;
}) => {
  const {
    loading: deleteItemLoading,
    error: deleteItemError,
    deleteEntity: deleteQuoteItem,
  } = useDeleteEntity(`/quotes/${quoteId}/items`);

  const handleDelete = async () => {
    if (!quoteId || !item) return;

    const result = await deleteQuoteItem(`${item.id}`);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Item"
      size="xs">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-muted">
          Are you sure you want to delete this item from the quote? This action
          cannot be undone.
        </div>

        {deleteItemError && (
          <div className="text-sm text-red-500">{deleteItemError}</div>
        )}

        {item && (
          <div className="space-y-2">
            <div>
              <div className="font-medium text-text">{item.item.name}</div>
              <div className="text-sm text-text-muted">
                Quantity: {item.quantity} × {formatCurrency(item.unitPrice)} ={" "}
                {formatCurrency(item.totalPrice)}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="secondary-outline"
            onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteItemLoading}>
            {deleteItemLoading ? "Deleting..." : "Delete Item"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuoteDetails;
