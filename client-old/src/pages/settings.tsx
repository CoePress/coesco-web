import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils";
import useGetConfig from "@/hooks/system/use-get-config";

const groupColors = {
  active: "bg-success hover:bg-success/80",
  idle: "bg-warning hover:bg-warning/80",
  stopped: "bg-error hover:bg-error/80",
  offline: "bg-default hover:bg-default/80",
} as const;

const SettingsPage = () => {
  const { config, loading, error } = useGetConfig();

  if (loading) return <div className="p-4">Loading configuration...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!config) return null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col gap-6 p-6">
        {/* Production Settings */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Production Settings</h2>
          <div className="p-4 rounded-lg bg-card border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Daily Quota:</span>
              <span>{config.production?.daily_quota} hours</span>
            </div>
          </div>
        </section>

        {/* Machine States */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Machine States</h2>
          <div className="grid gap-4">
            {Object.entries(config.machine_states || {}).map(
              ([state, values]) => (
                <div
                  key={state}
                  className="p-4 rounded-lg bg-card border shadow-sm">
                  <h3 className="font-medium capitalize mb-3">{state}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(values as string[]).map((value) => (
                      <Badge
                        key={value}
                        className={cn(
                          "text-white",
                          groupColors[state as keyof typeof groupColors]
                        )}>
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* Reports */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="grid gap-4">
            {config.reports?.map((report: any) => (
              <div
                key={report.name}
                className="p-4 rounded-lg bg-card border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{report.name}</h3>
                  <Badge variant={report.enabled ? "default" : "secondary"}>
                    {report.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-2">
                  {report.description}
                </p>
                <div className="text-sm">
                  <span className="font-medium">Schedule:</span>{" "}
                  {report.schedule}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blocked IPs */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Blocked IP Addresses</h2>
          <div className="p-4 rounded-lg bg-card border shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {config.blocked_ips?.map((ip: any) => (
                <div
                  key={ip}
                  className="p-2 bg-muted/30 rounded text-center text-sm">
                  {ip}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
