import { Button } from "@/components";
import { FaHubspot, FaMicrosoft, FaJira, FaSlack } from "react-icons/fa";

const integrations = [
  {
    name: "Microsoft Teams",
    description: "Team chat and collaboration.",
    icon: (
      <FaMicrosoft
        className="text-blue-600"
        size={28}
      />
    ),
    status: "active",
  },
  {
    name: "HubSpot",
    description: "CRM and marketing automation platform.",
    icon: (
      <FaHubspot
        className="text-orange-500"
        size={28}
      />
    ),
    status: "active",
  },
  {
    name: "Jira",
    description: "Issue tracking and agile project management.",
    icon: (
      <FaJira
        className="text-blue-400"
        size={28}
      />
    ),
    status: "active",
  },
  {
    name: "Concur",
    description: "Expense management and travel solutions.",
    icon: (
      <FaSlack
        className="text-blue-700"
        size={28}
      />
    ),
    status: "active",
  },
  {
    name: "Slack",
    description: "Messaging for teams.",
    icon: (
      <FaSlack
        className="text-purple-500"
        size={28}
      />
    ),
    status: "inactive",
  },
];

const Integrations = () => (
  <div className="flex flex-1 flex-col items-center justify-center bg-background">
    <div className="bg-foreground rounded border p-4 shadow-md w-full max-w-xl">
      <h1 className="text-xl font-bold text-text-muted">Integrations</h1>
      <p className="text-text-muted mb-2">Connect to other business apps</p>
      <div className="space-y-2">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center gap-2 bg-surface rounded border p-2">
            <div className="p-2 border rounded">{integration.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-text-muted">
                {integration.name}
              </div>
              <div className="text-sm text-text-muted">
                {integration.description}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm">
              {integration.status === "active" ? "Manage" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Integrations;
