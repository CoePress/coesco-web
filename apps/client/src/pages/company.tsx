import { useState } from "react";
import PageHeader from "@/components/shared/page-header";
import Tabs from "@/components/shared/tabs";
import StatusBadge from "@/components/shared/status-badge";
import {
  Mail,
  Phone,
  MessageCircle,
  Video,
  User,
  Building2,
  DollarSign,
  Ticket,
  Paperclip,
  CheckCircle,
  ChevronDown,
} from "lucide-react";

const mockContact = {
  name: "Brian Halligan",
  title: "CEO",
  company: "HubSpot",
  email: "bh@hubspot.com",
  phone: "+1 (555) 123-4567",
  lastContacted: "2 days ago",
  leadStatus: "Customer",
  lifecycleStage: "Customer",
  contactOwner: "Hannah Seligson",
  createDate: "July 15, 2020",
  lastActivity: "Email opened - 2 days ago",
};

const activityFeed = [
  {
    type: "task",
    icon: (
      <CheckCircle
        size={16}
        className="text-primary"
      />
    ),
    title: "Task assigned to Hannah Seligson",
    subtitle: "Follow up with Brian",
    date: "Jul 22, 2022",
    time: "1:52 PM EDT",
    status: "overdue",
  },
  {
    type: "meeting",
    icon: (
      <Video
        size={16}
        className="text-info"
      />
    ),
    title: "Meeting - Cupcake creator demo by Hannah Seligson",
    subtitle:
      "Hey guys, looking forward to taking a tour of the extra tasty cupcake factory tomorrow.",
    date: "Jul 22, 2022",
    time: "1:52 PM EDT",
    status: "upcoming",
  },
  {
    type: "call",
    icon: (
      <Phone
        size={16}
        className="text-success"
      />
    ),
    title: "Call from Hannah Seligson",
    subtitle:
      "Seems like they're interested in the extra tasty cupcake option. Need to nail down specifics and get them to commit. Will be following up with an email.",
    date: "Jul 22, 2022",
    time: "1:52 PM EDT",
    status: "completed",
  },
  {
    type: "email",
    icon: (
      <Mail
        size={16}
        className="text-info"
      />
    ),
    title: "Email tracking",
    subtitle: "Brian Halligan (Sample Contact) opened Hello there",
    date: "Jul 22, 2022",
    time: "1:52 PM EDT",
    status: "completed",
  },
  {
    type: "email",
    icon: (
      <Mail
        size={16}
        className="text-info"
      />
    ),
    title: "Logged email - Hello there by Hannah Seligson",
    subtitle: "Hey Brian,",
    date: "Jul 20, 2022",
    time: "1:52 PM EDT",
    status: "completed",
  },
];

const tabsData = [
  { label: "Activity", value: "activity" },
  { label: "Notes", value: "notes" },
  { label: "Emails", value: "emails" },
  { label: "Calls", value: "calls" },
  { label: "Tasks", value: "tasks" },
  { label: "Meetings", value: "meetings" },
];

const associatedRecords = {
  companies: [{ name: "HubSpot", domain: "hubspot.com", status: "Customer" }],
  deals: [
    {
      name: "HubSpot Upgrade",
      amount: "$15,000",
      stage: "Closed Won",
      probability: "100%",
    },
  ],
  tickets: [
    {
      id: "#12345",
      subject: "Integration Support",
      status: "Open",
      priority: "High",
    },
  ],
};

const ToggleableList = ({
  title,
  count,
  icon: Icon,
  items,
  renderItem,
  onAdd,
}: {
  title: string;
  count: number;
  icon: any;
  items: any[];
  renderItem: (item: any, i: number) => React.ReactNode;
  onAdd?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-foreground rounded-lg border border-border p-4 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Icon
            size={16}
            className="text-text-muted"
          />
          <span className="font-semibold text-text">
            {title} ({count})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <button
              className="text-info hover:underline text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}>
              + Add
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-text-muted transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 border border-border rounded hover:bg-surface">
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Company = () => {
  const [activeTab, setActiveTab] = useState("activity");

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <PageHeader
        title={`${mockContact.name} (Sample Contact)`}
        description={`${mockContact.title} at ${mockContact.company}`}
        actions={[]}
        backButton
      />

      <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-2 p-2">
        {/* Left Sidebar - Contact Details */}
        <div className="flex flex-col gap-2">
          {/* Contact Avatar & Quick Actions */}
          <div className="bg-foreground rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-foreground font-semibold text-lg">
                {mockContact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-text">
                  {mockContact.name}
                </h3>
                <p className="text-text-muted text-sm">{mockContact.title}</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                <Mail
                  size={18}
                  className="text-primary mx-auto"
                />
              </button>
              <button className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                <Phone
                  size={18}
                  className="text-primary mx-auto"
                />
              </button>
              <button className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                <MessageCircle
                  size={18}
                  className="text-primary mx-auto"
                />
              </button>
              <button className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                <Video
                  size={18}
                  className="text-primary mx-auto"
                />
              </button>
            </div>
          </div>

          {/* About this contact */}
          <div className="bg-foreground rounded-lg border border-border p-4 shadow-sm">
            <h4 className="font-semibold mb-3 text-text">About this contact</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-text-muted">Email</span>
                <div className="text-info">{mockContact.email}</div>
              </div>
              <div>
                <span className="text-text-muted">Phone number</span>
                <div className="text-text">{mockContact.phone}</div>
              </div>
              <div>
                <span className="text-text-muted">Contact owner</span>
                <div className="text-text">{mockContact.contactOwner}</div>
              </div>
              <div>
                <span className="text-text-muted">Last contacted</span>
                <div className="text-text">{mockContact.lastContacted}</div>
              </div>
              <div>
                <span className="text-text-muted">Lifecycle stage</span>
                <div>
                  <StatusBadge
                    variant="success"
                    label={mockContact.lifecycleStage}
                  />
                </div>
              </div>
              <div>
                <span className="text-text-muted">Lead status</span>
                <div>
                  <StatusBadge
                    variant="info"
                    label={mockContact.leadStatus}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Communication subscriptions */}
          <div className="bg-foreground rounded-lg border border-border p-4 shadow-sm">
            <h4 className="font-semibold mb-3 text-text">
              Communication subscriptions
            </h4>
            <div className="space-y-2 text-sm">
              <button className="text-info hover:underline">
                View all properties
              </button>
              <br />
              <button className="text-info hover:underline">
                View property history
              </button>
            </div>
          </div>
        </div>

        {/* Center Content - Activity Feed */}
        <div className="col-span-2 flex flex-col gap-2">
          <div className="bg-foreground rounded-lg border border-border shadow-sm">
            <div className="border-b border-border px-4 pt-4">
              <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabsData}
              />
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted">Filter by:</span>
                  <select className="text-sm border border-border rounded px-2 py-1 bg-foreground text-text">
                    <option>Filter activity (22/26)</option>
                  </select>
                  <select className="text-sm border border-border rounded px-2 py-1 bg-foreground text-text">
                    <option>All users</option>
                  </select>
                </div>
              </div>

              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h5 className="font-medium text-text mb-2">Upcoming</h5>
                  </div>

                  {activityFeed.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-3 border border-border rounded-lg bg-surface">
                      <div className="flex-shrink-0 mt-1">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text">
                            {item.title}
                          </span>
                          {item.status === "overdue" && (
                            <StatusBadge
                              variant="warning"
                              label="Overdue"
                            />
                          )}
                        </div>
                        <p className="text-sm text-text-muted mb-2">
                          {item.subtitle}
                        </p>
                        <div className="text-xs text-text-muted">
                          {item.date} at {item.time}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6">
                    <h5 className="font-medium text-text mb-2">July 2022</h5>
                  </div>
                </div>
              )}

              {activeTab !== "activity" && (
                <div className="py-12 text-center text-text-muted">
                  No {activeTab} found for this contact.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Associated Records */}
        <div className="flex flex-col gap-2">
          <ToggleableList
            title="Companies"
            count={associatedRecords.companies.length}
            icon={Building2}
            items={associatedRecords.companies}
            onAdd={() => {}}
            renderItem={(company) => (
              <>
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  <Building2
                    size={14}
                    className="text-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text">{company.name}</div>
                  <div className="text-xs text-text-muted">
                    {company.domain}
                  </div>
                </div>
              </>
            )}
          />

          <ToggleableList
            title="Deals"
            count={associatedRecords.deals.length}
            icon={DollarSign}
            items={associatedRecords.deals}
            onAdd={() => {}}
            renderItem={(deal) => (
              <>
                <div className="w-8 h-8 bg-success/10 rounded flex items-center justify-center">
                  <DollarSign
                    size={14}
                    className="text-success"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text">{deal.name}</div>
                  <div className="text-xs text-text-muted">
                    {deal.amount} • {deal.stage}
                  </div>
                </div>
              </>
            )}
          />

          <ToggleableList
            title="Tickets"
            count={associatedRecords.tickets.length}
            icon={Ticket}
            items={associatedRecords.tickets}
            onAdd={() => {}}
            renderItem={(ticket) => (
              <>
                <div className="w-8 h-8 bg-error/10 rounded flex items-center justify-center">
                  <Ticket
                    size={14}
                    className="text-error"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text">{ticket.subject}</div>
                  <div className="text-xs text-text-muted">
                    {ticket.id} • {ticket.status}
                  </div>
                </div>
              </>
            )}
          />

          <ToggleableList
            title="Attachments"
            count={0}
            icon={Paperclip}
            items={[]}
            onAdd={() => {}}
            renderItem={() => null}
          />

          <ToggleableList
            title="Contact Details"
            count={5}
            icon={User}
            items={[
              { label: "Contact create attribution", value: "-" },
              { label: "Past Feedback", value: "0" },
              { label: "List memberships", value: "Manage" },
              { label: "Playbooks", value: "0" },
              { label: "Workflow memberships", value: "Manage" },
            ]}
            renderItem={(item) => (
              <div className="flex items-center justify-between w-full">
                <span className="text-text-muted">{item.label}</span>
                {item.value === "Manage" ? (
                  <button className="text-info hover:underline">
                    {item.value}
                  </button>
                ) : (
                  <span className="text-text">{item.value}</span>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Company;
