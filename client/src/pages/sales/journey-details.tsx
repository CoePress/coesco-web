import { useState } from "react";
import {
  PageHeader,
  Tabs,
  Table,
  StatusBadge,
  Button,
  Modal,
} from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { Download, Edit, Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample/mock data
const sampleJourney = {
  id: "journey-001",
  name: "Acme Corp Stamping Project",
  startDate: "2023-07-15",
  type: "Stamping",
  leadSource: "Dealer Lead",
  equipmentType: "Standard",
  quoteType: "Standard more than 6 months",
  rsmTerritory: "Terry L. Sawyer",
  quoteNumber: "23-00339",
  qtyItems: 3,
  value: 484845,
  projectModels: ["CPPS 406 24", "CPR-PO 10024", "Service"],
  projectNotes:
    "TAT moved from Terry to Mark per territory change 3/20/2025\n\nJosh spoke to them business is picking up but this maybe later this year but more likke 2024",
  status: "open",
  createdBy: "mav",
  createdAt: "2025-05-28T14:39:28.115Z",
};

const sampleCustomer = {
  id: "customer-001",
  name: "Acme Corp",
  industry: "Manufacturing",
  contact: "John Smith",
  email: "john.smith@acme.com",
  phone: "555-123-4567",
  address: "123 Business St, New York, NY 10001",
};

const sampleQuoteList = [
  {
    id: "q1",
    number: "23-00339",
    revision: "A",
    status: "Draft",
    total: 484845,
    created: "2023-07-10",
    validUntil: "2023-12-31",
  },
  {
    id: "q2",
    number: "23-00340",
    revision: "B",
    status: "Sent",
    total: 250000,
    created: "2023-08-01",
    validUntil: "2024-01-31",
  },
];

const sampleInteractions = [
  {
    date: "2025-05-28",
    user: "mav",
    type: "Note",
    content: "Updated journey stage to RFQ Completed",
  },
  {
    date: "2025-03-20",
    user: "lat",
    type: "Step",
    content: "Added project note",
  },
  {
    date: "2025-02-10",
    user: "mav",
    type: "Activity",
    content: "Called customer, discussed project timeline",
  },
];

const sampleHistory = {
  notes: [
    {
      created: "2025-05-28 14:39:28.115",
      user: "mav",
      activity: "Journey Steps",
      note: "quote feed line to match previous job 10/31: Spoke with Josh this is still a possibility this year business has started to pick up for them, touch base again in December, Josh will stay in touch\n12/12: This has been moved until 2024 we'll stay in touch",
    },
    {
      created: "2025-03-20 23:14:58.648",
      user: "lat",
      activity: "Project Notes",
      note: "TAT moved from Terry to Mark per territory change 3/20/2025 Josh spoke to them business is picking up but this maybe later this year but more likke 2024",
    },
  ],
  logs: [
    {
      created: "2025-05-28 14:39:28.118",
      user: "mav",
      action: "action_date: FROM 05/30/25 TO 11/30/25",
    },
    {
      created: "2025-04-29 14:43:58.268",
      user: "mav",
      action: "action_date: FROM 04/30/25 TO 05/30/25",
    },
  ],
};

function JourneyDetailsTab() {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: string;
  }>({
    isOpen: false,
    type: "",
  });

  const handleOpenModal = (type: string) => {
    setModalState({ isOpen: true, type });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, type: "" });
  };

  return (
    <div className="p-2 flex flex-1 flex-col">
      <div className="flex flex-col gap-2 flex-1">
        <div className="grid grid-cols-3 gap-2">
          {/* Customer Information Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted">Customer</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() =>
                  navigate(`/sales/companies/${sampleCustomer.id}`)
                }>
                <User size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2">
              <div>
                <div className="text-xs text-text-muted">Company</div>
                <div className="text-sm text-text-muted">
                  {sampleCustomer.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Industry</div>
                <div className="text-sm text-text-muted">
                  {sampleCustomer.industry}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Contact</div>
                <div className="text-sm text-text-muted">
                  {sampleCustomer.contact}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Email</div>
                <div className="text-sm text-text-muted">
                  {sampleCustomer.email}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Phone</div>
                <div className="text-sm text-text-muted">
                  {sampleCustomer.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Journey Details Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted">Journey Details</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("journey-details")}>
                <Edit size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <div className="text-xs text-text-muted">
                  Journey Start Date
                </div>
                <div className="text-sm text-text-muted">
                  {formatDate(sampleJourney.startDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Journey Type</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.type}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Lead Source</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.leadSource}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Equipment Type</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.equipmentType}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Quote Type</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.quoteType}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">COE RSM Territory</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.rsmTerritory}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Quote #</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.quoteNumber}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Qty of Items</div>
                <div className="text-sm text-text-muted">
                  {sampleJourney.qtyItems}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Journey Value</div>
                <div className="text-sm text-text-muted">
                  {formatCurrency(sampleJourney.value)}
                </div>
              </div>
            </div>
          </div>

          {/* Journey Tracking Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted">
                Journey Tracking
              </h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("journey-tracking")}>
                <Edit size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <div className="text-xs text-text-muted">Journey Stage</div>
                <div className="text-sm text-text-muted">RFQ Completed</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Priority</div>
                <div className="text-sm text-text-muted">High</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Status</div>
                <StatusBadge label="open" />
              </div>
              <div>
                <div className="text-xs text-text-muted">
                  Quote Presentation Date
                </div>
                <div className="text-sm text-text-muted">
                  {formatDate("2023-08-05")}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Expected PO Date</div>
                <div className="text-sm text-text-muted">
                  {formatDate("2025-07-25")}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Action Date</div>
                <div className="text-sm text-text-muted">
                  {formatDate("2025-11-30")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 flex-1">
          {/* Project Notes Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-text-muted mb-1">Notes</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("project-notes")}>
                <Edit size={16} />
              </Button>
            </div>
            <textarea
              className="flex-1 w-full p-2 bg-surface rounded border border-border text-sm text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={sampleJourney.projectNotes}
              onChange={() => {}}
            />
          </div>

          {/* Interactions Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted">Interactions</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("interactions")}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <ul className="flex flex-col gap-2 text-xs">
                {sampleInteractions.map((i, idx) => (
                  <li
                    key={idx}
                    className="border-b border-border pb-2 last:border-b-0">
                    <div className="flex justify-between">
                      <span className="font-bold text-text-muted">
                        {formatDate(i.date)}
                      </span>
                      <span className="text-text-muted">
                        {i.user} ({i.type})
                      </span>
                    </div>
                    <div className="text-text-muted">{i.content}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quotes Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-text-muted">Quotes</h2>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => handleOpenModal("quotes")}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <Table
                columns={[
                  {
                    key: "number",
                    header: "Quote #",
                    className: "text-xs text-text-muted",
                  },
                  {
                    key: "revision",
                    header: "Rev",
                    className: "text-xs text-text-muted",
                  },
                  {
                    key: "status",
                    header: "Status",
                    className: "text-xs text-text-muted",
                  },
                  {
                    key: "total",
                    header: "Total",
                    className: "text-xs text-text-muted",
                    render: (v) => formatCurrency(v as number),
                  },
                  {
                    key: "created",
                    header: "Created",
                    className: "text-xs text-text-muted",
                    render: (v) => formatDate(v as string),
                  },
                  {
                    key: "validUntil",
                    header: "Valid Until",
                    className: "text-xs text-text-muted",
                    render: (v) => formatDate(v as string),
                  },
                ]}
                data={sampleQuoteList}
                total={sampleQuoteList.length}
                idField="id"
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={
          modalState.type === "interactions" || modalState.type === "quotes"
            ? `Add ${modalState.type
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}`
            : `Edit ${modalState.type
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}`
        }
        size="sm">
        <p>Opened modal for: {modalState.type}</p>
      </Modal>
    </div>
  );
}

function JourneyHistoryTab() {
  return (
    <div className="flex flex-1 flex-col p-2 gap-2">
      <div className="bg-foreground rounded-lg shadow-sm border p-2 flex-1">
        <div className="text-xs font-bold text-text-muted mb-1">
          Note History
        </div>
        <Table
          columns={[
            { key: "created", header: "Created", className: "text-xs" },
            { key: "user", header: "User", className: "text-xs" },
            { key: "activity", header: "Activity", className: "text-xs" },
            { key: "note", header: "Note", className: "text-xs" },
          ]}
          data={sampleHistory.notes}
          total={sampleHistory.notes.length}
          idField="created"
        />
      </div>
      <div className="bg-foreground rounded-lg shadow-sm border p-2 flex-1">
        <div className="text-xs font-bold text-text-muted mb-1">
          Log Records
        </div>
        <Table
          columns={[
            { key: "created", header: "Created", className: "text-xs" },
            { key: "user", header: "User", className: "text-xs" },
            { key: "action", header: "Action", className: "text-xs" },
          ]}
          data={sampleHistory.logs}
          total={sampleHistory.logs.length}
          idField="created"
        />
      </div>
    </div>
  );
}

const JourneyDetailsPage = () => {
  const [activeTab, setActiveTab] = useState("details");
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={sampleJourney.name}
        description={`Started ${formatDate(sampleJourney.startDate)} • ${
          sampleJourney.type
        } • ${formatCurrency(sampleJourney.value)}`}
        backButton
        onBack={() => navigate("/sales/journeys")}
        actions={[
          {
            type: "button",
            label: "Export",
            variant: "secondary-outline",
            icon: <Download size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: activeTab === "details" ? "New Journey" : "Add Note",
            variant: "primary",
            icon:
              activeTab === "details" ? <Plus size={16} /> : <Edit size={16} />,
            onClick: () => {},
          },
        ]}
      />
      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Details", value: "details" },
          { label: "History", value: "history" },
        ]}
      />
      <>
        {activeTab === "details" && <JourneyDetailsTab />}
        {activeTab === "history" && <JourneyHistoryTab />}
      </>
    </div>
  );
};

export default JourneyDetailsPage;
