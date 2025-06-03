import { useState } from "react";
import { PageHeader, Tabs, Table, StatusBadge, Button } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { Download, Edit, Plus } from "lucide-react";

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

const sampleStats = {
  totalQuotes: 5,
  totalOrders: 2,
  lastOrder: "2025-04-15",
  lastActivity: "2025-05-28",
};

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
  return (
    <div className="p-2 flex flex-1 flex-col">
      <div className="flex flex-col gap-2">
        {/* TOP ROW: 2 cards, fill full row, NO CUSTOMER INFO */}
        <div className="grid grid-cols-2 gap-2">
          {/* Journey Details Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-4 flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-neutral-400 mb-1">
                Journey Details
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <div className="text-xs text-neutral-400">
                    Journey Start Date
                  </div>
                  <div className="text-sm text-neutral-400">
                    {formatDate(sampleJourney.startDate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Journey Type</div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Lead Source</div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.leadSource}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Equipment Type</div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.equipmentType}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Quote Type</div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.quoteType}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">
                    COE RSM Territory
                  </div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.rsmTerritory}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Quote #</div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.quoteNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Qty of Items</div>
                  <div className="text-sm text-neutral-400">
                    {sampleJourney.qtyItems}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Journey Value</div>
                  <div className="text-sm text-neutral-400">
                    {formatCurrency(sampleJourney.value)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1 mt-2">
                Project Models
              </div>
              <ul className="list-disc pl-5 text-sm text-neutral-400 mb-2">
                {sampleJourney.projectModels.map((model, i) => (
                  <li key={i}>{model}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Project Notes</div>
              <div className="text-sm text-neutral-400 whitespace-pre-line mb-2">
                {sampleJourney.projectNotes}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-neutral-400">Created By</div>
                <div className="text-sm text-neutral-400">
                  {sampleJourney.createdBy}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Created At</div>
                <div className="text-sm text-neutral-400">
                  {formatDate(sampleJourney.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Journey Tracking Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-4 flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-neutral-400 mb-1">
                Journey Tracking
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <div className="text-xs text-neutral-400">Journey Stage</div>
                  <div className="text-sm text-neutral-400">RFQ Completed</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Priority</div>
                  <div className="text-sm text-neutral-400">High</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Status</div>
                  <StatusBadge label="open" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400">
                    Quote Presentation Date
                  </div>
                  <div className="text-sm text-neutral-400">
                    {formatDate("2023-08-05")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">
                    Expected PO Date
                  </div>
                  <div className="text-sm text-neutral-400">
                    {formatDate("2025-07-25")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Action Date</div>
                  <div className="text-sm text-neutral-400">
                    {formatDate("2025-11-30")}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1 mt-2">
                Journey Steps
              </div>
              <ul className="list-disc pl-5 text-sm text-neutral-400 mb-2">
                <li>quote feed line to match previous job</li>
                <li>
                  10/31: Spoke with Josh this is still a possibility this year
                  business has started to pick up for them, touch base again in
                  December, Josh will stay in touch
                </li>
                <li>
                  12/12: This has been moved until 2024 we'll stay in touch
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Quotes and Interactions */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Quotes Card (spans 2 columns) */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 col-span-2">
            <div className="text-lg font-bold mb-2">Quotes</div>
            <Table
              columns={[
                { key: "number", header: "Quote #", className: "text-xs" },
                { key: "revision", header: "Rev", className: "text-xs" },
                { key: "status", header: "Status", className: "text-xs" },
                {
                  key: "total",
                  header: "Total",
                  className: "text-xs",
                  render: (v) => formatCurrency(v as number),
                },
                {
                  key: "created",
                  header: "Created",
                  className: "text-xs",
                  render: (v) => formatDate(v as string),
                },
                {
                  key: "validUntil",
                  header: "Valid Until",
                  className: "text-xs",
                  render: (v) => formatDate(v as string),
                },
              ]}
              data={sampleQuoteList}
              total={sampleQuoteList.length}
              idField="id"
            />
          </div>

          {/* Interactions Card */}
          <div className="bg-foreground rounded-lg shadow-sm border p-2 flex flex-col gap-2 col-span-1">
            <div className="text-lg font-bold mb-2">Interactions</div>
            <ul className="flex flex-col gap-2 text-xs">
              {sampleInteractions.map((i, idx) => (
                <li
                  key={idx}
                  className="border-b border-border pb-2 last:border-b-0">
                  <div className="flex justify-between">
                    <span className="font-bold">{formatDate(i.date)}</span>
                    <span className="text-neutral-400">
                      {i.user} ({i.type})
                    </span>
                  </div>
                  <div>{i.content}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyHistoryTab() {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      <div className="bg-foreground rounded-lg shadow-sm border p-2">
        <div className="text-xs font-bold text-neutral-400 mb-1">
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
      <div className="bg-foreground rounded-lg shadow-sm border p-2">
        <div className="text-xs font-bold text-neutral-400 mb-1">
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

  return (
    <div className="w-full flex flex-1 flex-col h-full">
      <PageHeader
        title={sampleJourney.name}
        description={`Started ${formatDate(sampleJourney.startDate)} • ${
          sampleJourney.type
        } • ${formatCurrency(sampleJourney.value)}`}
        backButton
        onBack={() => {}}
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
            label: activeTab === "details" ? "Edit" : "Add Note",
            variant: "primary",
            icon:
              activeTab === "details" ? <Edit size={16} /> : <Plus size={16} />,
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
      <div className="flex-1 w-full h-full">
        {activeTab === "details" && <JourneyDetailsTab />}
        {activeTab === "history" && <JourneyHistoryTab />}
      </div>
    </div>
  );
};

export default JourneyDetailsPage;
