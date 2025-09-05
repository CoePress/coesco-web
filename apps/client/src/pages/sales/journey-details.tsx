import { useState, useEffect } from "react";
import { PageHeader, Tabs, Table, Button, Modal } from "@/components";
import { formatCurrency, formatDate } from "@/utils";

const STAGES = [
  { id: 1, label: "Lead", weight: 0.20 },
  { id: 2, label: "Qualified", weight: 0.40 },
  { id: 3, label: "Presentations", weight: 0.60 },
  { id: 4, label: "Negotiation", weight: 0.90 },
  { id: 5, label: "Closed Won", weight: 1.0 },
  { id: 6, label: "Closed Lost", weight: 0.0 },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const mapLegacyStageToId = (stage: any): StageId => {
  const s = String(stage ?? "").toLowerCase();
  if (!s) return 1;
  if (s.includes("qualify") || s.includes("pain") || s.includes("discover")) return 2;
  if (s.includes("present") || s.includes("demo") || s.includes("proposal") || s.includes("quote")) return 3;
  if (s.includes("negot")) return 4;
  if (s.includes("po") || s.includes("won") || s.includes("closedwon") || s.includes("closed won") || s.includes("order")) return 5;
  if (s.includes("lost") || s.includes("closedlost") || s.includes("closed lost") || s.includes("declin")) return 6;
  if (s.includes("lead") || s.includes("open") || s.includes("new")) return 1;
  return 1;
};

const stageLabel = (id?: number) =>
  STAGES.find(s => s.id === Number(id))?.label ?? `Stage ${id ?? ""}`;

const getStageLabel = (journey: any) => {
  // If journey has a numeric stage, use it directly
  if (typeof journey?.stage === 'number') {
    return stageLabel(journey.stage);
  }
  
  // If journey has Journey_Stage (legacy), map it to numeric and get label
  if (journey?.Journey_Stage) {
    const mappedStageId = mapLegacyStageToId(journey.Journey_Stage);
    return stageLabel(mappedStageId);
  }
  
  // If journey has stage as string, map it to numeric and get label  
  if (journey?.stage) {
    const mappedStageId = mapLegacyStageToId(journey.stage);
    return stageLabel(mappedStageId);
  }
  
  return "-";
};

const getPriorityLabel = (priority: string) => {
  const p = String(priority ?? "").toUpperCase();
  switch (p) {
    case "A":
      return "Highest";
    case "B":
      return "High";
    case "C":
      return "Medium";
    case "D":
      return "Lowest";
    default:
      return "Medium";
  }
};

const getPriorityColor = (priority: string) => {
  const p = String(priority ?? "").toUpperCase();
  switch (p) {
    case "A":
      return "bg-red-500"; // Highest priority - red
    case "B":
      return "bg-orange-500"; // High priority - orange
    case "C":
      return "bg-yellow-500"; // Medium priority - yellow
    case "D":
      return "bg-green-500"; // Lowest priority - green
    default:
      return "bg-gray-400"; // No priority - gray
  }
};
import { Edit, Plus, User } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useApi } from "@/hooks/use-api";

function JourneyDetailsTab({ journey }: { journey: any | null }) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    createDT: journey?.CreateDT ?? journey?.createDT ?? "",
    type: journey?.Journey_Type ?? journey?.type ?? "",
    source: journey?.Lead_Source ?? journey?.source ?? "",
    equipmentType: journey?.Equipment_Type ?? "Standard",
    quoteType: journey?.Quote_Type ?? "Standard more than 6 months",
    rsm: journey?.RSM ?? "",
    rsmTerritory: journey?.RSM_Territory ?? "",
    quoteNumber: journey?.Quote_Number ?? "",
    qtyItems: journey?.Qty_of_Items ?? "",
    value: journey?.Journey_Value ?? journey?.value ?? "",
  });

  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    stage: journey?.Journey_Stage ?? journey?.stage ?? "",
    priority: journey?.Priority ?? journey?.priority ?? "",
    status: journey?.Journey_Status ?? journey?.status ?? "",
    presentationDate: journey?.Quote_Presentation_Date ?? "",
    expectedPoDate: journey?.Expected_Decision_Date ?? "",
    lastActionDate: journey?.Action_Date ?? journey?.updatedAt ?? "",
  });

  const [notes, setNotes] = useState(journey?.Notes ?? journey?.notes ?? "");

  useEffect(() => {
    if (journey) {
      setDetailsForm({
        createDT: journey?.CreateDT ?? journey?.createDT ?? "",
        type: journey?.Journey_Type ?? journey?.type ?? "",
        source: journey?.Lead_Source ?? journey?.source ?? "",
        equipmentType: journey?.Equipment_Type ?? "Standard",
        quoteType: journey?.Quote_Type ?? "Standard more than 6 months",
        rsm: journey?.RSM ?? "",
        rsmTerritory: journey?.RSM_Territory ?? "",
        quoteNumber: journey?.Quote_Number ?? "",
        qtyItems: journey?.Qty_of_Items ?? "",
        value: journey?.Journey_Value ?? journey?.value ?? "",
      });
      
      setTrackingForm({
        stage: journey?.Journey_Stage ?? journey?.stage ?? "",
        priority: journey?.Priority ?? journey?.priority ?? "",
        status: journey?.Journey_Status ?? journey?.status ?? "",
        presentationDate: journey?.Quote_Presentation_Date ?? "",
        expectedPoDate: journey?.Expected_Decision_Date ?? "",
        lastActionDate: journey?.Action_Date ?? journey?.updatedAt ?? "",
      });
      
      setNotes(journey?.Notes ?? journey?.notes ?? "");
    }
  }, [journey]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: string }>({
    isOpen: false,
    type: "",
  });

  const handleOpenModal = (type: string) => setModalState({ isOpen: true, type });
  const handleCloseModal = () => setModalState({ isOpen: false, type: "" });

  if (!journey) return null;

  const customer = journey.customer;

  return (
    <div className="p-2 flex flex-1 flex-col">
      <div className="flex flex-col gap-2 flex-1">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Customer Details</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => navigate(`/sales/companies/${customer?.id}`)}
              >
                <User size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2">
              <div>
                <div className="text-sm text-text-muted">Company</div>
                <div className="text-sm text-text">
                  {journey?.Target_Account || journey?.companyName || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Customer ID</div>
                <div className="text-sm text-text font-mono">
                  {journey?.Company_ID || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Industry</div>
                <div className="text-sm text-text">
                  {customer?.industry || journey?.Industry || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Contact</div>
                <div className="text-sm text-text">{customer?.contact || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Email</div>
                <div className="text-sm text-text">{customer?.email || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Phone</div>
                <div className="text-sm text-text">{customer?.phone || "-"}</div>
              </div>
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Journey Details</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => {
                  if (!isEditingDetails) {
                    setDetailsForm({
                      createDT: journey?.CreateDT ?? "",
                      type: journey?.Journey_Type ?? "",
                      source: journey?.Lead_Source ?? "",
                      equipmentType: journey?.Equipment_Type ?? "Standard",
                      quoteType: journey?.Quote_Type ?? "Standard more than 6 months",
                      rsm: journey?.RSM ?? "",
                      rsmTerritory: journey?.RSM_Territory ?? "",
                      quoteNumber: journey?.Quote_Number ?? "",
                      qtyItems: journey?.Qty_of_Items ?? "",
                      value: journey?.Journey_Value ?? "",
                    });
                    setIsEditingDetails(true);
                  } else {
                    setIsEditingDetails(false);
                  }
                }}
              >
                {isEditingDetails ? "Done" : <Edit size={16} />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <div className="text-sm text-text-muted">Created</div>
                {isEditingDetails ? (
                  <input
                    type="datetime-local"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={
                      detailsForm.createDT
                        ? detailsForm.createDT.replace(" ", "T").slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, createDT: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.CreateDT ? formatDate(journey.CreateDT) : "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Journey Type</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.type}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, type: e.target.value }))}
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Journey_Type || journey?.type || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Lead Source</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.source}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, source: e.target.value }))}
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Lead_Source || journey?.source || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Equipment Type</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.equipmentType}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, equipmentType: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Equipment_Type?.trim() || "Standard"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Quote Type</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.quoteType}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, quoteType: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Quote_Type || "Standard more than 6 months"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Quote #</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.quoteNumber}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, quoteNumber: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">{journey?.Quote_Number?.trim() || "-"}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Qty of Items</div>
                {isEditingDetails ? (
                  <input
                    type="number"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.qtyItems}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, qtyItems: e.target.value }))
                    }
                    min={0}
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Qty_of_Items != null && journey?.Qty_of_Items !== "" ? journey.Qty_of_Items : "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Journey Value</div>
                {isEditingDetails ? (
                  <input
                    type="number"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.value}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, value: e.target.value }))
                    }
                    min={0}
                  />
                ) : (
                  <div className="text-sm text-text">
                    {formatCurrency(
                      Number(journey?.Journey_Value ?? journey?.value ?? 0)
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">RSM</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.rsm}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, rsm: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">{journey?.RSM?.trim() || "-"}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">RSM Territory</div>
                {isEditingDetails ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background text-text"
                    value={detailsForm.rsmTerritory}
                    onChange={(e) =>
                      setDetailsForm((s) => ({ ...s, rsmTerritory: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">{journey?.RSM_Territory?.trim() || "-"}</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Journey Tracking</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => {
                  if (!isEditingTracking) {
                    setTrackingForm({
                      stage: journey?.Journey_Stage ?? journey?.stage ?? "",
                      priority: journey?.Priority ?? journey?.priority ?? "",
                      status: journey?.Journey_Status ?? journey?.status ?? "",
                      presentationDate: journey?.Quote_Presentation_Date ?? "",
                      expectedPoDate: journey?.Expected_Decision_Date ?? "",
                      lastActionDate: journey?.Action_Date ?? journey?.updatedAt ?? "",
                    });
                    setIsEditingTracking(true);
                  } else {
                    setIsEditingTracking(false);
                  }
                }}
              >
                {isEditingTracking ? "Done" : <Edit size={16} />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <div className="text-sm text-text-muted">Journey Stage</div>
                {isEditingTracking ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={trackingForm.stage}
                    onChange={(e) =>
                      setTrackingForm((s) => ({ ...s, stage: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {getStageLabel(journey)}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Priority</div>
                {isEditingTracking ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={trackingForm.priority}
                    onChange={(e) =>
                      setTrackingForm((s) => ({ ...s, priority: e.target.value }))
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getPriorityColor(journey?.Priority || journey?.priority)} relative group cursor-help`}
                      title={`Priority: ${journey?.Priority || journey?.priority || 'None'} (${getPriorityLabel(journey?.Priority || journey?.priority)})`}
                    >
                      <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Priority: {journey?.Priority || journey?.priority || 'None'} ({getPriorityLabel(journey?.Priority || journey?.priority)})
                      </div>
                    </div>
                    <div className="text-sm text-text">
                      {journey?.Priority || journey?.priority || "-"} ({getPriorityLabel(journey?.Priority || journey?.priority)})
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Status</div>
                {isEditingTracking ? (
                  <input
                    type="text"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={trackingForm.status}
                    onChange={(e) =>
                      setTrackingForm((s) => ({ ...s, status: e.target.value }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Journey_Status || journey?.status || "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Presentation Date</div>
                {isEditingTracking ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={(trackingForm.presentationDate as string) || ""}
                    onChange={(e) =>
                      setTrackingForm((s) => ({
                        ...s,
                        presentationDate: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {trackingForm.presentationDate
                      ? formatDate(trackingForm.presentationDate as string)
                      : "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Expected Decision Date</div>
                {isEditingTracking ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={(trackingForm.expectedPoDate as string) || ""}
                    onChange={(e) =>
                      setTrackingForm((s) => ({
                        ...s,
                        expectedPoDate: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {trackingForm.expectedPoDate
                      ? formatDate(trackingForm.expectedPoDate as string)
                      : "-"}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-text-muted">Last Action Date</div>
                {isEditingTracking ? (
                  <input
                    type="date"
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text"
                    value={(trackingForm.lastActionDate as string) || ""}
                    onChange={(e) =>
                      setTrackingForm((s) => ({
                        ...s,
                        lastActionDate: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <div className="text-sm text-text">
                    {journey?.Action_Date
                      ? formatDate(journey.Action_Date as string)
                      : journey?.updatedAt
                      ? formatDate(journey.updatedAt as string)
                      : "-"}
                  </div>
                )}
              <div>
                <div className="text-sm text-text-muted">Journey ID</div>
                <div className="text-sm text-text font-mono">
                  {journey?.ID || journey?.id || "-"}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 flex-1">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-text-muted text-sm mb-1">Notes</h2>
            </div>
            <textarea
              className="flex-1 w-full p-2 bg-surface rounded border border-border text-sm text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (journey?.Notes ?? journey?.notes ?? "")) {
                  setShowSavePrompt(true);
                }
              }}
            />
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Interactions</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("interactions")}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <ul className="flex flex-col gap-2 text-xs"></ul>
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted text-sm">Quote Information</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("quotes")}
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="space-y-3">
                {/* Quote Details Section */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-text-muted">Quote Number</div>
                    <div className="text-sm text-text font-mono">
                      {journey?.Quote_Number?.trim() || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Quote Type</div>
                    <div className="text-sm text-text">
                      {journey?.Quote_Type || "Standard more than 6 months"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Quantity of Items</div>
                    <div className="text-sm text-text">
                      {journey?.Qty_of_Items != null && journey?.Qty_of_Items !== "" ? journey.Qty_of_Items : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Quote Value</div>
                    <div className="text-sm text-text font-semibold text-primary">
                      {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
                    </div>
                  </div>
                </div>
                
                {/* Quote Status Section */}
                {journey?.Quote_Number && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-text-muted mb-2">Quote Status</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-2 bg-background rounded border">
                        <div>
                          <div className="text-sm font-medium text-text">
                            Quote #{journey.Quote_Number}
                          </div>
                          <div className="text-xs text-text-muted">
                            {journey?.Equipment_Type?.trim() || "Standard"} • {journey?.Quote_Type || "Standard more than 6 months"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-primary">
                            {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
                          </div>
                          <div className="text-xs text-text-muted">
                            {journey?.Qty_of_Items && journey.Qty_of_Items !== "" ? `${journey.Qty_of_Items} items` : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Timeline Section */}
                {(journey?.Quote_Presentation_Date || journey?.Expected_Decision_Date) && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-text-muted mb-2">Quote Timeline</div>
                    <div className="space-y-2">
                      {journey?.Quote_Presentation_Date && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-muted">- Presentation:</span>
                          <span className="text-text">{formatDate(journey.Quote_Presentation_Date)}</span>
                        </div>
                      )}
                      {journey?.Expected_Decision_Date && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-muted">- Expected Decision:</span>
                          <span className="text-text">{formatDate(journey.Expected_Decision_Date)}</span>
                        </div>
                      )}
                      {journey?.Chance_To_Secure_order && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-muted">- Success Probability:</span>
                          <span className="text-text font-medium">{journey.Chance_To_Secure_order}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalState.isOpen} onClose={handleCloseModal} title={
        modalState.type === "interactions" || modalState.type === "quotes"
          ? `Add ${modalState.type
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}`
          : `Edit ${modalState.type
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}`
      } size="sm">
        <p>Opened modal for: {modalState.type}</p>
      </Modal>

      <Modal
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        title="Save Changes?"
        size="sm"
      >
        <p className="mb-4">Do you want to save your changes?</p>
        <div className="flex justify-end gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowSavePrompt(false)}>
            Yes
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => {
              setNotes(journey?.Notes ?? journey?.notes ?? "");
              setShowSavePrompt(false);
            }}
          >
            No
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function JourneyQuotesTab({ journey }: { journey: any | null }) {
  if (!journey) return null;

  return (
    <div className="flex flex-1 flex-col p-4 gap-6">
      {/* Quote Overview */}
      <div className="bg-foreground rounded shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-text mb-4">Quote Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Quote Number</div>
            <div className="text-lg font-semibold text-text font-mono">
              {journey?.Quote_Number?.trim() || "No Quote Number"}
            </div>
          </div>
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Quote Value</div>
            <div className="text-lg font-semibold text-primary">
              {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
            </div>
          </div>
          <div className="bg-background rounded border p-3">
            <div className="text-sm text-text-muted mb-1">Success Probability</div>
            <div className="text-lg font-semibold text-text">
              {journey?.Chance_To_Secure_order ? `${journey.Chance_To_Secure_order}%` : "Not specified"}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Quote Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted">Quote Type:</span>
              <span className="text-text">{journey?.Quote_Type || "Standard more than 6 months"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Equipment Type:</span>
              <span className="text-text">{journey?.Equipment_Type?.trim() || "Standard"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Quantity of Items:</span>
              <span className="text-text">
                {journey?.Qty_of_Items != null && journey?.Qty_of_Items !== "" ? journey.Qty_of_Items : "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">RSM:</span>
              <span className="text-text">{journey?.RSM?.trim() || "Not assigned"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Territory:</span>
              <span className="text-text">{journey?.RSM_Territory?.trim() || "Not specified"}</span>
            </div>
          </div>
        </div>

        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Timeline & Dates</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm text-text-muted">Quote Presentation Date</div>
                <div className="text-text">
                  {journey?.Quote_Presentation_Date ? formatDate(journey.Quote_Presentation_Date) : "Not scheduled"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm text-text-muted">Expected Decision Date</div>
                <div className="text-text">
                  {journey?.Expected_Decision_Date ? formatDate(journey.Expected_Decision_Date) : "Not specified"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm text-text-muted">Journey Created</div>
                <div className="text-text">
                  {journey?.CreateDT ? formatDate(journey.CreateDT) : "Not available"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm text-text-muted">Last Action Date</div>
                <div className="text-text">
                  {journey?.Action_Date ? formatDate(journey.Action_Date) : "Not available"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Status Card */}
      {journey?.Quote_Number && (
        <div className="bg-foreground rounded shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Quote Status</h3>
          <div className="bg-background rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-text">Quote #{journey.Quote_Number}</div>
                <div className="text-sm text-text-muted mt-1">
                  {journey?.Equipment_Type?.trim() || "Standard"} • {journey?.Quote_Type || "Standard more than 6 months"}
                </div>
                {journey?.Qty_of_Items && journey.Qty_of_Items !== "" && (
                  <div className="text-sm text-text-muted">
                    Quantity: {journey.Qty_of_Items} items
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
                </div>
                {journey?.Chance_To_Secure_order && (
                  <div className="text-sm text-text-muted">
                    {journey.Chance_To_Secure_order}% probability
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Quote Information */}
      <div className="bg-foreground rounded shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-text mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-text-muted mb-2">Industry</div>
            <div className="text-text">{journey?.Industry || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Lead Source</div>
            <div className="text-text">{journey?.Lead_Source || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Journey Type</div>
            <div className="text-text">{journey?.Journey_Type || journey?.type || "Not specified"}</div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-2">Current Stage</div>
            <div className="text-text">{getStageLabel(journey)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyHistoryTab() {
  return (
    <div className="flex flex-1 flex-col p-2 gap-2">
      <div className="bg-foreground rounded shadow-sm border p-2 flex-1">
        <div className="text-xs font-bold text-text-muted mb-1">Note History</div>
        <Table
          columns={[
            { key: "created", header: "Created", className: "text-xs" },
            { key: "user", header: "User", className: "text-xs" },
            { key: "activity", header: "Activity", className: "text-xs" },
            { key: "note", header: "Note", className: "text-xs" },
          ]}
          data={[]}
          total={0}
          idField="created"
        />
      </div>
      <div className="bg-foreground rounded shadow-sm border p-2 flex-1">
        <div className="text-xs font-bold text-text-muted mb-1">Log Records</div>
        <Table
          columns={[
            { key: "created", header: "Created", className: "text-xs" },
            { key: "user", header: "User", className: "text-xs" },
            { key: "action", header: "Action", className: "text-xs" },
          ]}
          data={[]}
          total={0}
          idField="created"
        />
      </div>
    </div>
  );
}

const JourneyDetailsPage = () => {
  const [activeTab, setActiveTab] = useState("details");
  const navigate = useNavigate();
  const location = useLocation();
  const { id: journeyId } = useParams<{ id: string }>();

  // Get journey data from navigation state if available
  const passedJourneyData = location.state as { journey?: any; customer?: any } | null;
  
  const shouldFetchFromAPI = !passedJourneyData?.journey;
  
  const { loading, error, get } = useApi();
  const [journeyOverview, setJourneyOverview] = useState<any>(null);

  useEffect(() => {
    if (shouldFetchFromAPI && journeyId) {
      const fetchJourneyData = async () => {
        const data = await get(`/api/journeys/${journeyId}`);
        if (data) {
          setJourneyOverview(data);
        }
      };
      fetchJourneyData();
    }
  }, [shouldFetchFromAPI, journeyId, get]);

  const journeyData = passedJourneyData?.journey || journeyOverview?.journey;
  const customerData = passedJourneyData?.customer || journeyOverview?.customer;

  if (shouldFetchFromAPI && loading) {
    return <div className="flex justify-center items-center h-64">Loading journey details...</div>;
  }
  
  if (shouldFetchFromAPI && error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading journey: {error}</div>;
  }


  if (!journeyId) {
    return (
      <div className="w-full flex flex-1 flex-col">
        <PageHeader
          title="Invalid Journey"
          description="No journey ID provided in the URL."
          backButton
          onBack={() =>
            navigate("/sales/pipeline", { state: { viewMode: "kanban", refresh: true } })
          }
        />
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="w-full flex flex-1 flex-col">
        <PageHeader
          title="Journey not found"
          description="This journey may have been removed or is unavailable."
          backButton
          onBack={() =>
            navigate("/sales/pipeline", { state: { viewMode: "list", refresh: true } })
          }
        />
      </div>
    );
  }

  const j = journeyData;

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={
          j?.name ||
          j?.Project_Name ||
          j?.Target_Account ||
          "Coe Press Equipment"
        }
        description={`Started ${formatDate(
          (j?.CreateDT as string) || (j?.createDT as string) || "2025-05-28 14:39:28"
        )} • ${(j?.Journey_Type as string) || (j?.type as string) || "Standard"} • ${formatCurrency(
          Number(j?.Journey_Value ?? j?.value ?? 0)
        )}`}
        backButton
        onBack={() =>
          navigate("/sales/pipeline", { state: { viewMode: "list", refresh: true } })
        }
      />
      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Details", value: "details" },
          { label: "Quotes", value: "quotes" },
          { label: "History", value: "history" },
        ]}
      />
      <>
        {activeTab === "details" && (
          <JourneyDetailsTab
            journey={
              journeyData
                ? { ...journeyData, customer: customerData }
                : null
            }
          />
        )}
        {activeTab === "quotes" && <JourneyQuotesTab journey={journeyData} />}
        {activeTab === "history" && <JourneyHistoryTab />}
      </>
    </div>
  );
};

export default JourneyDetailsPage;