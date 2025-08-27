import { PageHeader } from "@/components"
import Metrics, { MetricsCard } from "@/components/ui/metrics";
import { ClockIcon, LogInIcon, ShieldAlertIcon, UsersIcon } from "lucide-react";

const Sessions = () => {

  const kpis = [
    {
      title: "Active Sessions",
      value: "142",
      description: "Users currently logged in",
      icon: <UsersIcon size={16} />,
      change: 4.2,
    },
    {
      title: "Avg. Session Duration",
      value: "32m",
      description: "Average session length",
      icon: <ClockIcon size={16} />,
      change: -3.1,
    },
    {
      title: "New Logins",
      value: "318",
      description: "Logins in the last 24h",
      icon: <LogInIcon size={16} />,
      change: 7.8,
    },
    {
      title: "Failed Login Attempts",
      value: "27",
      description: "Security-related login failures",
      icon: <ShieldAlertIcon size={16} />,
      change: 5.0,
    },
  ];

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Sessions"
        description="Monitor and manage active user sessions"
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <Metrics>
          {kpis.map((metric, i) => (
            <MetricsCard key={i} {...metric} />
          ))}
        </Metrics>
      </div>
    </div>
  )
}

export default Sessions
