import {
  Plus,
  ChevronDown,
  CheckCircle,
  Check,
  Send,
  Eye,
  Trash,
  GripVertical,
  Search,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Button,
  Card,
  Loader,
  Modal,
  Table,
  // Tabs,
} from "@/components";
import { formatCurrency, formatDate, formatQuoteNumber } from "@/utils";
import { useMemo, useState, useEffect } from "react";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import PageHeader from "@/components/layout/page-header";

const QuoteDetails = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSendConfirmationOpen, setIsSendConfirmationOpen] = useState(false);
  const [isRevisionConfirmationOpen, setIsRevisionConfirmationOpen] =
    useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "quantity" | "unitPrice" | "discount" | "tax" | null
  >(null);
  const [editingValue, setEditingValue] = useState<string>("");
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
    if (quoteOverview?.status !== "DRAFT") return;
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

  const handleDoubleClick = (
    itemId: string,
    field: "quantity" | "unitPrice" | "discount" | "tax",
    currentValue: any
  ) => {
    if (quoteOverview?.status !== "DRAFT") return;
    setEditingItemId(itemId);
    setEditingField(field);
    setEditingValue(currentValue.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingItemId || !editingField || !editingValue) return;

    const item = quoteItems.find((item: any) => item.id === editingItemId);
    if (!item) return;

    const updateData: any = {};
    if (editingField === "quantity") {
      updateData.quantity = parseInt(editingValue) || 1;
    } else if (editingField === "unitPrice") {
      updateData.unitPrice = parseFloat(editingValue) || 0;
    } else if (editingField === "discount") {
      updateData.discount = parseFloat(editingValue) || 0;
    } else if (editingField === "tax") {
      updateData.tax = parseFloat(editingValue) || 0;
    }

    await updateQuoteItem(editingItemId, updateData);
    refreshQuote();

    setEditingItemId(null);
    setEditingField(null);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingField(null);
    setEditingValue("");
  };

  const [quoteOverview, setQuoteOverview] = useState<any>(null);
  const [_overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [_revisions, setRevisions] = useState<any[]>([]);
  const [sortedRevisions, setSortedRevisions] = useState<any[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { get: getQuoteOverview } = useApi<IApiResponse<any>>();
  const { get: getRevisions } = useApi<IApiResponse<any[]>>();
  
  const fetchQuoteOverview = async () => {
    if (!quoteId) return;
    setOverviewLoading(true);
    const response = await getQuoteOverview(`/quotes/${quoteId}`);
    if (response?.success) {
      setQuoteOverview(response.data);
    }
    setOverviewLoading(false);
  };

  const fetchRevisionOverview = async (revisionId: string) => {
    if (!quoteId) return;
    setOverviewLoading(true);
    const response = await getQuoteOverview(`/quotes/${quoteId}/revisions/${revisionId}`);
    if (response?.success) {
      setQuoteOverview(response.data);
    }
    setOverviewLoading(false);
  };

  const fetchRevisions = async () => {
    if (!quoteId) return;
    const response = await getRevisions(`/quotes/${quoteId}/revisions`);
    if (response?.success) {
      const fetchedRevisions = response.data || [];
      setRevisions(fetchedRevisions);
      
      const staticSorted = [...fetchedRevisions].sort((a: any, b: any) => {
        const aRev = a.revision;
        const bRev = b.revision;
        
        if (/^\d+$/.test(aRev) && /^\d+$/.test(bRev)) {
          return parseInt(bRev) - parseInt(aRev);
        }
        
        if (aRev.length !== bRev.length) {
          return bRev.length - aRev.length;
        }
        
        return bRev.localeCompare(aRev);
      });
      setSortedRevisions(staticSorted);
    }
  };
  
  const refreshQuote = () => {
    if (selectedRevisionId) {
      fetchRevisionOverview(selectedRevisionId);
    } else {
      fetchQuoteOverview();
    }
    fetchRevisions();
  };

  const handleRevisionChange = (revisionId: string) => {
    const latestRevision = sortedRevisions[0]; // First in sorted list is latest
    if (revisionId === latestRevision?.id) {
      // User selected latest revision
      setSelectedRevisionId(null);
      fetchQuoteOverview();
    } else {
      setSelectedRevisionId(revisionId);
      fetchRevisionOverview(revisionId);
    }
  };
  
  useEffect(() => {
    fetchQuoteOverview();
    fetchRevisions();
  }, [quoteId]);


  const { patch: updateLineNumberApi } = useApi<IApiResponse<any>>();
  
  const updateLineNumber = async (itemId: string, lineNumber: number) => {
    const response = await updateLineNumberApi(`/quotes/items/${itemId}/line-number`, { lineNumber });
    return response?.success ? response.data : null;
  };
  const { patch: updateQuoteItemApi } = useApi<IApiResponse<any>>();
  
  const updateQuoteItem = async (id: string, data: any) => {
    const response = await updateQuoteItemApi(`/quotes/items/${id}`, data);
    return response?.success ? response.data : null;
  };

  const quoteItems = quoteOverview?.quoteItems || [];
  const customer = quoteOverview?.customer || null;
  const dealer = quoteOverview?.dealer || null;

  const pageTitle = quoteOverview?.year && quoteOverview?.number && quoteOverview?.revision 
    ? formatQuoteNumber(quoteOverview.year, quoteOverview.number, quoteOverview.revision)
    : `${quoteOverview?.number || "Q-2024-001"} (${quoteOverview?.revision || "A"})`;
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
  )} • ${quoteOverview?.status}`;

  const Actions = () => {
    const actions = [];
    const isLatestRevision = !selectedRevisionId;

    // Add Revision Dropdown
    if (sortedRevisions.length > 1) {
      actions.push(
<div key="revision-dropdown" className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="appearance-none bg-surface border border-border rounded px-3 py-2 pr-8 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer min-w-40">
            Revision {quoteOverview?.revision} {!selectedRevisionId ? " (Latest)" : ""}
          </div>
          <ChevronDown 
            size={16} 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" 
          />
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded mt-1 shadow-lg z-50">
              {sortedRevisions.map((revision) => (
                <div
                  key={revision.id}
                  onClick={() => {
                    handleRevisionChange(revision.id);
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-sm text-text hover:bg-foreground cursor-pointer flex items-center justify-between">
                  <span>Revision {revision.revision}</span>
                  {revision.revision === quoteOverview?.revision && <Check size={16} />}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Add Customer/Dealer buttons for DRAFT quotes
    if (quoteOverview?.status === "DRAFT" && isLatestRevision) {
      if (!customer) {
        actions.push(
          <Button
            key="add-customer"
            variant="secondary-outline"
            onClick={() => setIsCustomerModalOpen(true)}>
            <Plus size={16} /> Add Customer
          </Button>
        );
      }
      
      if (!dealer) {
        actions.push(
          <Button
            key="add-dealer"
            variant="secondary-outline"
            onClick={() => setIsDealerModalOpen(true)}>
            <Plus size={16} /> Add Dealer
          </Button>
        );
      }
    }

    if (quoteItems.length > 0) {
      actions.push(
        <Button
          key="preview"
          variant="secondary-outline"
          onClick={() => setIsPreviewModalOpen(true)}>
          <Eye size={16} /> Preview
        </Button>
      );
    }

    if (isLatestRevision) {
      switch (quoteOverview?.status) {
        case "DRAFT":
          actions.push(
            <Button
              key="approve"
              variant="primary"
              disabled={quoteItems.length === 0}
              onClick={() => setIsApprovalModalOpen(true)}>
              <CheckCircle size={16} /> Approve Quote
            </Button>
          );
          break;
        case "APPROVED":
          actions.push(
            <Button
              key="send"
              variant="primary"
              onClick={() => setIsSendConfirmationOpen(true)}>
              <Send size={16} /> Send Quote
            </Button>
          );
          break;
        case "SENT":
          actions.push(
            <Button
              key="revise"
              variant="primary"
              onClick={() => setIsRevisionConfirmationOpen(true)}>
              <Plus size={16} /> Create Revision
            </Button>
          );
          break;
      }
    }

    return <div className="flex gap-2">{actions}</div>;
  };

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={<Actions />}
        goBack
      />

      <div className="mx-auto p-2">
        <div className="flex flex-col gap-2">
          {/* Full width Quote Info Card */}
          <Card>
            <div className="grid grid-cols-5 gap-6">
              {/* Quote Number & Revision */}
              <div className="space-y-1">
                <div className="text-xs text-text-muted">Number</div>
                <div className="text-sm font-medium text-text">
                  {quoteOverview?.year && quoteOverview?.number 
                    ? formatQuoteNumber(quoteOverview.year, quoteOverview.number)
                    : "25-00001"}
                </div>
                <div className="text-xs text-text-muted">Revision</div>
                <div className="text-sm text-text">
                  {quoteOverview?.revision || "A"}
                </div>
                <div className="text-xs text-text-muted">Status</div>
                <div className="text-sm font-medium text-text">
                  {quoteOverview?.status || "DRAFT"}
                </div>
              </div>

              {/* Created Info */}
              <div className="space-y-1">
                <div className="text-xs text-text-muted">Created</div>
                <div className="text-sm text-text">
                  {quoteOverview?.quote?.createdAt
                    ? formatDate(quoteOverview?.quote?.createdAt)
                    : "Jan 15, 2024"}
                </div>
                <div className="text-xs text-text-muted">Created By</div>
                <div className="text-sm font-medium text-text">
                  {quoteOverview?.quote?.createdById
                    ? `${quoteOverview?.quote?.createdBy?.firstName} ${quoteOverview?.quote?.createdBy?.lastName}`
                    : "Alex Chen"}
                </div>
                <div className="text-xs text-text-muted">Expires</div>
                <div className="text-sm text-text">
                  {quoteOverview?.quote?.expiryDate
                    ? formatDate(quoteOverview?.quote?.expiryDate)
                    : "-"}
                </div>
              </div>

              {/* Approval Info */}
              <div className="space-y-1">
                <div className="text-xs text-text-muted">Approved</div>
                <div className="text-sm text-text">
                  {quoteOverview?.quote?.approvedAt
                    ? formatDate(quoteOverview?.quote?.approvedAt)
                    : "-"}
                </div>
                <div className="text-xs text-text-muted">Approved By</div>
                <div className="text-sm text-text">
                  {quoteOverview?.quote?.approvedBy
                    ? `${quoteOverview?.quote?.approvedBy?.firstName} ${quoteOverview?.quote?.approvedBy?.lastName}`
                    : "-"}
                </div>
                <div className="text-xs text-text-muted">Sent</div>
                <div className="text-sm text-text">
                  {quoteOverview?.quote?.sentAt
                    ? formatDate(quoteOverview?.quote?.sentAt)
                    : "-"}
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-1">
                <div className="text-xs text-text-muted">Customer</div>
                <div className="text-sm font-medium text-text">
                  {customer?.name || "-"}
                </div>
                <div className="text-xs text-text-muted">Contact</div>
                <div className="text-sm text-text">
                  {customer?.contact || "-"}
                </div>
                <div className="text-xs text-text-muted">Email</div>
                <div className="text-sm text-text">
                  {customer?.email || "-"}
                </div>
              </div>

              {/* Dealer Info */}
              <div className="space-y-1">
                <div className="text-xs text-text-muted">Dealer</div>
                <div className="text-sm font-medium text-text">
                  {dealer?.name || "-"}
                </div>
                <div className="text-xs text-text-muted">Contact</div>
                <div className="text-sm text-text">
                  {dealer?.contact || "-"}
                </div>
                <div className="text-xs text-text-muted">Email</div>
                <div className="text-sm text-text">
                  {dealer?.email || "-"}
                </div>
              </div>

            </div>
          </Card>

          <Card>
            <div className="bg-foreground border-b flex justify-between items-center pb-2">
              <h2 className="font-semibold text-text-muted text-sm">
                Line Items
              </h2>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                disabled={quoteOverview?.status !== "DRAFT"}
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
                    quoteOverview?.status === "DRAFT"
                      ? "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 80px"
                      : "48px 2fr 3fr 64px 96px 96px 96px 96px 80px",
                }}>
                {quoteOverview?.status === "DRAFT" && <div></div>}
                <div className="truncate whitespace-nowrap">Line</div>
                <div className="truncate whitespace-nowrap">Item</div>
                <div className="truncate whitespace-nowrap">Description</div>
                <div className="text-right truncate whitespace-nowrap">
                  Quantity
                </div>
                <div className="text-right truncate whitespace-nowrap">
                  Unit Price
                </div>
                <div className="text-right truncate whitespace-nowrap">
                  Discount
                </div>
                <div className="text-right truncate whitespace-nowrap">Tax</div>
                <div className="text-right truncate whitespace-nowrap">
                  Total
                </div>
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
                          quoteOverview?.status === "DRAFT"
                            ? "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 80px"
                            : "48px 2fr 3fr 64px 96px 96px 96px 96px 80px",
                      }}>
                      {quoteOverview?.status === "DRAFT" && (
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
                      )}
                      <div
                        className="text-sm text-text-muted truncate whitespace-nowrap"
                        title={item.lineNumber}>
                        {item.lineNumber}
                      </div>
                      <div
                        className="text-sm font-medium text-text truncate whitespace-nowrap"
                        title={item.item?.name || item.configuration?.name}>
                        {item.item?.name || item.configuration?.name}
                      </div>
                      <div
                        className="text-sm text-text truncate whitespace-nowrap"
                        title={
                          item.item?.description ||
                          item.configuration?.description
                        }>
                        {item.item?.description ||
                          item.configuration?.description}
                      </div>
                      <div
                        className="text-sm text-text text-right cursor-pointer hover:bg-foreground/50 px-1 rounded"
                        onDoubleClick={() =>
                          handleDoubleClick(item.id, "quantity", item.quantity)
                        }>
                        {editingItemId === item.id &&
                        editingField === "quantity" ? (
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className="px-2 rounded text-right text-text text-sm w-14"
                            autoFocus
                          />
                        ) : (
                          item.quantity
                        )}
                      </div>
                      <div
                        className="text-sm text-text text-right cursor-pointer hover:bg-foreground/50 px-1 rounded"
                        onDoubleClick={() =>
                          handleDoubleClick(
                            item.id,
                            "unitPrice",
                            item.unitPrice
                          )
                        }>
                        {editingItemId === item.id &&
                        editingField === "unitPrice" ? (
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className="px-2 rounded text-right text-text text-sm w-20"
                            autoFocus
                          />
                        ) : (
                          formatCurrency(item.unitPrice || 0)
                        )}
                      </div>
                      <div
                        className="text-sm text-text text-right cursor-pointer hover:bg-foreground/50 px-1 rounded"
                        onDoubleClick={() =>
                          handleDoubleClick(
                            item.id,
                            "discount",
                            item.discount || 0
                          )
                        }>
                        {editingItemId === item.id &&
                        editingField === "discount" ? (
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className="px-2 rounded text-right text-text text-sm w-20"
                            autoFocus
                          />
                        ) : (
                          formatCurrency(item.discount || 0)
                        )}
                      </div>
                      <div className="text-sm text-text text-right">
                        {formatCurrency(item.tax || 0)}
                      </div>
                      <div className="text-sm font-medium text-text text-right">
                        {formatCurrency(item.totalPrice || 0)}
                      </div>
                      <div className="flex items-center justify-end gap-1 min-w-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (quoteOverview?.status === "DRAFT") {
                              setSelectedItem(item);
                              setIsDeleteItemModalOpen(true);
                            }
                          }}>
                          <Trash size={16} />
                        </Button>
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
              <div
                className="grid p-2"
                style={{
                  gridTemplateColumns:
                    quoteOverview?.status === "DRAFT"
                      ? "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 80px"
                      : "48px 2fr 3fr 64px 96px 96px 96px 96px 80px",
                }}>
                {quoteOverview?.status === "DRAFT" && <div></div>}
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div className="text-right text-xs uppercase text-text-muted">
                  Subtotal
                </div>
                <div className="text-right text-sm text-text-muted">
                  {formatCurrency(
                    quoteItems.reduce(
                      (acc: number, item: any) => acc + Number(item.totalPrice),
                      0
                    )
                  )}
                </div>
              </div>
              <div
                className="grid p-2"
                style={{
                  gridTemplateColumns:
                    quoteOverview?.status === "DRAFT"
                      ? "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 80px"
                      : "48px 2fr 3fr 64px 96px 96px 96px 96px 80px",
                }}>
                {quoteOverview?.status === "DRAFT" && <div></div>}
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div className="text-right text-xs uppercase text-text-muted">
                  Discount
                </div>
                <div className="text-right text-sm text-text-muted">
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
              </div>
              <div
                className="grid p-2"
                style={{
                  gridTemplateColumns:
                    quoteOverview?.status === "DRAFT"
                      ? "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 80px"
                      : "48px 2fr 3fr 64px 96px 96px 96px 96px 80px",
                }}>
                {quoteOverview?.status === "DRAFT" && <div></div>}
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div className="text-right text-xs uppercase text-text-muted">
                  Tax
                </div>
                <div className="text-right text-sm text-text-muted">
                  {formatCurrency(
                    quoteItems.reduce(
                      (acc: number, item: any) =>
                        acc + (Number(item.taxAmount) || 0),
                      0
                    )
                  )}
                </div>
              </div>
              <div
                className="grid p-2 border-t border-border"
                style={{
                  gridTemplateColumns:
                    quoteOverview?.status === "DRAFT"
                      ? "32px 48px 2fr 3fr 64px 96px 96px 96px 96px 80px"
                      : "48px 2fr 3fr 64px 96px 96px 96px 96px 80px",
                }}>
                {quoteOverview?.status === "DRAFT" && <div></div>}
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div className="text-right text-xs uppercase font-bold text-text-muted">
                  Total
                </div>
                <div className="text-right text-sm font-bold text-text-muted">
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

      <QuotePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        quoteOverview={quoteOverview}
        quoteItems={quoteItems}
      />
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<
    Record<string, number>
  >({});
  const [productType, setProductType] = useState<'equipment' | 'parts' | 'services'>('equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 25
  });

  const [addItemLoading, setAddItemLoading] = useState<boolean>(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const { post: createQuoteItemApi } = useApi<IApiResponse<any>>();
  
  const createQuoteItem = async (data: any) => {
    setAddItemLoading(true);
    setAddItemError(null);
    const response = await createQuoteItemApi(`/quotes/${quoteId}/items`, data);
    setAddItemLoading(false);
    if (response?.success) {
      return response.data;
    } else {
      setAddItemError(response?.error || "Failed to create quote item");
      return null;
    }
  };

  const handleAddItem = async (item: any) => {
    setSelectedItem(item);
    setShowConfirmation(true);
  };

  const handleConfirmAddItem = async () => {
    if (!quoteId || !selectedItem) return;

    const result = await createQuoteItem({
      itemId: selectedItem.id,
      itemType: "item",
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
                  {selectedItem?.modelNumber}
                </div>
                <div className="text-sm text-text-muted">
                  Quantity: {selectedQuantity[selectedItem?.id] || 1} ×{" "}
                  {formatCurrency(selectedItem?.specifications?.price || 0)} ={" "}
                  {formatCurrency(
                    (selectedQuantity[selectedItem?.id] || 1) *
                      (selectedItem?.specifications?.price || 0)
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
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search items..."
                      className="block w-full pl-10 pr-2 py-2 border border-border rounded-sm leading-5 bg-foreground placeholder-text-muted focus:outline-none focus:placeholder-text focus:ring-1 focus:ring-primary focus:border-primary text-sm text-foreground"
                    />
                  </div>
                </div>
                <div className="flex gap-1 bg-surface p-1 rounded border border-border">
                <button
                  onClick={() => setProductType('equipment')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
                    productType === 'equipment' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Equipment
                </button>
                <button
                  onClick={() => setProductType('parts')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
                    productType === 'parts' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Parts
                </button>
                <button
                  onClick={() => setProductType('services')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
                    productType === 'services' 
                      ? 'bg-primary text-background' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Services
                </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
              <ItemsTab
                onAddItem={handleAddItem}
                addItemLoading={addItemLoading}
                selectedQuantity={selectedQuantity}
                setSelectedQuantity={setSelectedQuantity}
                productType={productType}
                page={page}
                pagination={pagination}
                setPagination={setPagination}
              />
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t flex-shrink-0">
              <Button
                variant="secondary-outline"
                onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-2 items-center ml-auto">
                <div className="flex gap-1">
                  <Button
                    variant="secondary-outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}>
                    <ChevronDown
                      className="rotate-90"
                      size={16}
                    />
                  </Button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                    if (pageNum > pagination.totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "primary" : "secondary-outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        disabled={pageNum === page}>
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="secondary-outline"
                    size="sm"
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page >= pagination.totalPages}>
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
  productType,
  page,
  pagination,
  setPagination,
}: {
  onAddItem: (item: any) => void;
  addItemLoading: boolean;
  selectedQuantity: Record<string, number>;
  setSelectedQuantity: (quantity: Record<string, number>) => void;
  productType: 'equipment' | 'parts' | 'services';
  page: number;
  pagination: { total: number; totalPages: number; page: number; limit: number };
  setPagination: (pagination: { total: number; totalPages: number; page: number; limit: number }) => void;
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [limit] = useState(25);
  const [sort, setSort] = useState("modelNumber");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const { get: getItems } = useApi<IApiResponse<any[]>>();
  
  const fetchItems = async () => {
    setItemsLoading(true);
    setItemsError(null);
    const filter = JSON.stringify({
      type: productType.charAt(0).toUpperCase() + productType.slice(1),
    });
    const response = await getItems("/catalog/items", { 
      filter,
      page,
      limit,
      sort,
      order
    });
    if (response?.success) {
      setItems(response.data || []);
      if (response.meta) {
        setPagination({
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
          page: response.meta.page || 1,
          limit: response.meta.limit || 25,
        });
      }
    } else {
      setItemsError(response?.error || "Failed to fetch items");
    }
    setItemsLoading(false);
  };
  
  useEffect(() => {
    fetchItems();
  }, [productType, page, limit, sort, order]);

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
              key: "modelNumber",
              header: "Model #",
              className: "text-primary",
            },
            {
              key: "description",
              header: "Description",
            },
            {
              key: "price",
              header: "Price",
              render: (_, row) => formatCurrency(row.specifications?.price || 0),
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
          total={pagination.total}
          sort={sort}
          order={order}
          onSortChange={(newSort, newOrder) => {
            setSort(newSort);
            setOrder(newOrder);
          }}
          loading={itemsLoading}
          emptyMessage="No items found"
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
  const [companies, setCompanies] = useState<any[]>([]);
  const { get: getCompanies } = useApi<IApiResponse<any[]>>();
  
  const fetchCompanies = async () => {
    const response = await getCompanies("/companies");
    if (response?.success) {
      setCompanies(response.data || []);
    }
  };
  
  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSelectCompany = async () => {
    console.log(`Selected ${type}:`, quoteId);
    onSuccess();
    onClose();
  };

  const title = type === "customer" ? "Select Customer" : "Select Dealer";
  const newButtonText = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg">
      <div className="flex flex-col gap-4">
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

  const [approveQuoteLoading, setApproveQuoteLoading] = useState<boolean>(false);
  const [approveQuoteError, setApproveQuoteError] = useState<string | null>(null);
  const { post: approveQuoteApi } = useApi<IApiResponse<any>>();
  
  const approveQuote = async (quoteId: string) => {
    setApproveQuoteLoading(true);
    setApproveQuoteError(null);
    const response = await approveQuoteApi(`/quotes/${quoteId}/approve`);
    setApproveQuoteLoading(false);
    if (response?.success) {
      return response.data;
    } else {
      setApproveQuoteError(response?.error || "Failed to approve quote");
      return null;
    }
  };

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
                <div className="font-medium text-text">
                  {item.item?.name || item.configuration?.name}
                </div>
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
  const [sendQuoteLoading, setSendQuoteLoading] = useState<boolean>(false);
  const [sendQuoteError, setSendQuoteError] = useState<string | null>(null);
  const { post: sendQuoteApi } = useApi<IApiResponse<any>>();
  
  const sendQuote = async (quoteId: string) => {
    setSendQuoteLoading(true);
    setSendQuoteError(null);
    const response = await sendQuoteApi(`/quotes/${quoteId}/send`);
    setSendQuoteLoading(false);
    if (response?.success) {
      return response.data;
    } else {
      setSendQuoteError(response?.error || "Failed to send quote");
      return null;
    }
  };

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
  const [createRevisionLoading, setCreateRevisionLoading] = useState<boolean>(false);
  const [createRevisionError, setCreateRevisionError] = useState<string | null>(null);
  const { post: createRevisionApi } = useApi<IApiResponse<any>>();
  
  const createQuoteRevision = async (quoteId: string) => {
    setCreateRevisionLoading(true);
    setCreateRevisionError(null);
    const response = await createRevisionApi(`/quotes/${quoteId}/revision`);
    setCreateRevisionLoading(false);
    if (response?.success) {
      return response.data;
    } else {
      setCreateRevisionError(response?.error || "Failed to create quote revision");
      return null;
    }
  };

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
  const [deleteItemLoading, setDeleteItemLoading] = useState<boolean>(false);
  const [deleteItemError, setDeleteItemError] = useState<string | null>(null);
  const [deleteItemSuccess, setDeleteItemSuccess] = useState<boolean>(false);
  const { delete: deleteQuoteItemApi } = useApi<IApiResponse<any>>();
  
  const deleteQuoteItem = async (id: string) => {
    setDeleteItemLoading(true);
    setDeleteItemError(null);
    setDeleteItemSuccess(false);
    const response = await deleteQuoteItemApi(`/quotes/items/${id}`);
    setDeleteItemLoading(false);
    if (response?.success) {
      setDeleteItemSuccess(true);
    } else {
      setDeleteItemError(response?.error || "Failed to delete quote item");
    }
  };

  const handleDelete = async () => {
    if (!quoteId || !item) return;

    console.log(item);

    await deleteQuoteItem(item.id);
  };

  // Close modal and refresh on successful delete
  useEffect(() => {
    if (deleteItemSuccess) {
      onSuccess();
      onClose();
    }
  }, [deleteItemSuccess]);

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
              <div className="font-medium text-text">
                {item.item?.name || item.configuration?.name}
              </div>
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

const QuotePreviewModal = ({
  isOpen,
  onClose,
  quoteOverview,
  quoteItems,
}: {
  isOpen: boolean;
  onClose: () => void;
  quoteOverview: any;
  quoteItems: any[];
}) => {
  console.log(quoteOverview);
  console.log(quoteItems);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quote Preview"
      size="lg">
      <div className="flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto min-h-0">
          <iframe
            src="/sample.pdf"
            className="w-full h-full border-0"
            title="Quote Preview"
          />
        </div>
      </div>
    </Modal>
  );
};

export default QuoteDetails;
