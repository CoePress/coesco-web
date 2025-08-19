using System.Xml.Linq;

var app = WebApplication.Create();

app.Urls.Add("http://0.0.0.0:5000");

const string API_KEY_HEADER = "X-API-KEY";
const string API_KEY_VALUE  = "my-secret-key";

// TEMP: in-memory CNC machine list (to be replaced by an API later)
var machines = new[]
{
    new Machine("10.0.0.10", 9001, "lathe-1",  true),
    new Machine("10.0.0.11", 9002, "mill-2",   false),
    new Machine("10.0.0.12", 9003, "router-a", true),
};

app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.TryGetValue(API_KEY_HEADER, out var key) || key != API_KEY_VALUE)
    {
        ctx.Response.StatusCode = 401;
        ctx.Response.ContentType = "text/plain";
        await ctx.Response.WriteAsync("Unauthorized");
        return;
    }
    await next(ctx);
});

app.MapGet("/api/v1/healthz", () => Results.Text("ok", "text/plain"));
app.MapGet("/api/v1/status", () => Results.Json(new { ok = true, stub = true }));
app.MapPost("/api/v1/reset", () => Results.Json(new { ok = true }));

foreach (var m in machines)
{
    var machine = m;
    app.MapGet($"/api/v1/{machine.Slug}/current", () =>
    {
        XNamespace ns  = "urn:mtconnect.org:MTConnectStreams:1.8";
        XNamespace xsi = "http://www.w3.org/2001/XMLSchema-instance";

        var doc = new XDocument(
            new XElement(ns + "MTConnectStreams",
                new XAttribute(XNamespace.Xmlns + "xsi", xsi),
                new XAttribute(xsi + "schemaLocation",
                    "urn:mtconnect.org:MTConnectStreams:1.8 MTConnectStreams_1.8.xsd"),
                new XElement(ns + "Header",
                    new XAttribute("creationTime", DateTime.UtcNow.ToString("o")),
                    new XAttribute("sender", "cpec-agent"),
                    new XAttribute("instanceId", "1"),
                    new XAttribute("version", "1.8"),
                    new XAttribute("bufferSize", "10"),
                    new XAttribute("nextSequence", "1")
                ),
                new XElement(ns + "Streams",
                    new XElement(ns + "DeviceStream",
                        new XAttribute("name", machine.Slug),
                        new XAttribute("uuid", Guid.NewGuid()),
                        new XElement(ns + "ComponentStream",
                            new XAttribute("component", "Device"),
                            new XElement(ns + "Events",
                                new XElement(ns + "Availability",
                                    machine.IsTracked ? "AVAILABLE" : "UNAVAILABLE")
                            )
                        )
                    )
                )
            )
        );

        return Results.Text(doc.ToString(SaveOptions.DisableFormatting), "application/xml");
    });
}

app.Run();

record Machine(string Host, int Port, string Slug, bool IsTracked);
