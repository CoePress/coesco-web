import { useState, useEffect } from "react";
import { Button } from "@/components";
import { useApi } from "@/hooks/use-api";

const Timezone = () => {
  const { get } = useApi();
  const [results, setResults] = useState<any>({});
  const [hourResults, setHourResults] = useState<any>(null);

  const testTimezone = async () => {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const clientData = {
      now: now.toISOString(),
      nowLocal: now.toString(),
      startOfDay: startOfDay.toISOString(),
      startOfDayLocal: startOfDay.toString(),
      endOfDay: endOfDay.toISOString(),
      endOfDayLocal: endOfDay.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      dateString: startOfDay.toISOString().slice(0, 10),
    };

    const response = await get("/test/timezone", {
      date: startOfDay.toISOString().slice(0, 10),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    setResults({
      client: clientData,
      server: response,
    });

    // Also test hours
    const hoursResponse = await get("/test/hours", {
      date: startOfDay.toISOString().slice(0, 10),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
    });

    setHourResults(hoursResponse);
  };

  useEffect(() => {
    testTimezone();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Timezone Test</h1>

      <Button onClick={testTimezone} className="mb-4">
        Refresh Test
      </Button>

      <div className="space-y-4 text-text-muted">
        <div>
          <h2 className="text-xl font-semibold mb-2">Client Side</h2>
          <pre className="bg-surface p-4 rounded overflow-auto text-xs">
            {JSON.stringify(results.client, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Server Response</h2>
          <pre className="bg-surface p-4 rounded overflow-auto text-xs">
            {JSON.stringify(results.server, null, 2)}
          </pre>
        </div>

        {hourResults && (
          <div>
            <h2 className="text-xl font-semibold mb-2">24 Hour Generation</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface">
                  <th className="p-2 text-left">Hour</th>
                  <th className="p-2 text-left">Client Label</th>
                  <th className="p-2 text-left">UTC Label</th>
                  <th className="p-2 text-left">UTC Hours</th>
                  <th className="p-2 text-left">Local Hours</th>
                </tr>
              </thead>
              <tbody>
                {hourResults.data?.hours?.map((hour: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-surface/50"}>
                    <td className="p-2">{hour.hour}</td>
                    <td className="p-2 font-bold">{hour.clientLabel}</td>
                    <td className="p-2">{hour.utcLabel}</td>
                    <td className="p-2">{hour.utcHours}</td>
                    <td className="p-2">{hour.localHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timezone;