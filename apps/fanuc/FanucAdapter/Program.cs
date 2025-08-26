using FanucAdapter.Services;
using System.Xml.Linq;
using System.Xml;

var app = WebApplication.Create();

app.Urls.Add("http://0.0.0.0:5000");

const string API_KEY_HEADER = "X-API-KEY";
const string API_KEY_VALUE  = "my-secret-key";

var machines = new[]
{
    new Machine("192.231.64.127", 8193, "doosan",  true),
    new Machine("192.231.64.202", 8193, "hn80",  true),
    new Machine("192.231.64.203", 8193, "okk",  true),
};

var focas = new FocasService(machines.Select(m => (m.Slug, m.Host, (ushort)m.Port)));

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

app.MapGet("/api/v1/health", () => Results.Text("ok", "text/plain"));
app.MapPost("/api/v1/reset", () => Results.Json(new { ok = true }));

foreach (var m in machines)
{
    var machine = m;
    app.MapGet($"/api/v1/{machine.Slug}/current", () =>
    {
        var machineData = focas.GetMachineData(machine.Slug);
        
        if (machineData == null)
        {
            return Results.NotFound($"Machine {machine.Slug} not found");
        }
        
        var doc = MTConnectXmlGenerator.GenerateMTConnectStreams(machineData);
        
        var settings = new XmlWriterSettings
        {
            Indent = false,
            OmitXmlDeclaration = false,
            Encoding = System.Text.Encoding.UTF8
        };
        
        using var stringWriter = new System.IO.StringWriter();
        using (var xmlWriter = XmlWriter.Create(stringWriter, settings))
        {
            doc.WriteTo(xmlWriter);
        }
        
        return Results.Text(stringWriter.ToString(), "application/xml");
    });
}

app.Run();

record Machine(string Host, int Port, string Slug, bool IsTracked);
