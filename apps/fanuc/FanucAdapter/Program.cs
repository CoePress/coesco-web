var app = WebApplication.Create();

// fixed bind
app.Urls.Add("http://0.0.0.0:5000");

// simple API key auth middleware
const string API_KEY_HEADER = "X-API-KEY";
const string API_KEY_VALUE = "my-secret-key"; // change this

app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.TryGetValue(API_KEY_HEADER, out var key) || key != API_KEY_VALUE)
    {
        ctx.Response.StatusCode = 401;
        await ctx.Response.WriteAsync("Unauthorized");
        return;
    }

    await next(ctx);
});

app.MapGet("/healthz", () => "ok");
app.MapGet("/status", () => new { ok = true, stub = true });

app.Run();
