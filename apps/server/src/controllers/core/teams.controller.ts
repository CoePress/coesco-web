import type { Request, Response } from "express";

import { z } from "zod";

import { graphAuthService, graphClientService, teamsService } from "@/services";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";
import { getEmployeeContext } from "@/utils/context";

const SendChannelMessageSchema = z.object({
  webhookUrl: z.string().url("Invalid webhook URL").optional(),
  message: z.string().min(1, "Message is required"),
  title: z.string().optional(),
  themeColor: z.string().optional(),
  mentionEmails: z.array(z.string().email()).optional(),
});

const SendAdaptiveCardSchema = z.object({
  webhookUrl: z.string().url("Invalid webhook URL").optional(),
  card: z.any(),
});

const SendDirectMessageSchema = z.object({
  recipientEmail: z.string().email("Invalid email"),
  message: z
    .string()
    .min(1, "Message required")
    .max(28000, "Message too long"),
});

export class TeamsController {
  sendChannelMessage = asyncWrapper(async (req: Request, res: Response) => {
    const validData = SendChannelMessageSchema.parse(req.body);
    const result = await teamsService.sendChannelMessage(validData);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  });

  sendAdaptiveCard = asyncWrapper(async (req: Request, res: Response) => {
    const validData = SendAdaptiveCardSchema.parse(req.body);
    const result = await teamsService.sendAdaptiveCard({
      webhookUrl: validData.webhookUrl,
      card: validData.card,
      message: "",
    });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  });

  initiateAuth = asyncWrapper(async (req: Request, res: Response) => {
    const ctx = getEmployeeContext();
    const authUrl = await graphAuthService.getAuthorizationUrl(ctx.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { authUrl } });
  });

  handleCallback = asyncWrapper(async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send(`
        <html>
          <body>
            <h1>Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>${error_description || ""}</p>
            <script>
              window.opener?.postMessage({ type: 'teams-auth-error', error: '${error}' }, '*');
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }

    if (!code || !state) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send("Missing code or state");
    }

    try {
      const { employeeId } = JSON.parse(
        Buffer.from(state as string, "base64").toString(),
      );

      await graphAuthService.exchangeCodeForToken(code as string, employeeId);

      res.send(`
        <html>
          <body>
            <h1>Teams Connected Successfully!</h1>
            <p>You can close this window and return to the app.</p>
            <script>
              window.opener?.postMessage({ type: 'teams-connected' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    }
    catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(`
        <html>
          <body>
            <h1>Connection Failed</h1>
            <p>An error occurred while connecting to Teams. Please try again.</p>
            <p style="color: red; font-size: 12px;">${error instanceof Error ? error.message : "Unknown error"}</p>
            <script>
              window.opener?.postMessage({ type: 'teams-auth-error' }, '*');
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  });

  getConnectionStatus = asyncWrapper(async (req: Request, res: Response) => {
    const ctx = getEmployeeContext();
    const isConnected = await graphAuthService.isConnected(ctx.id);
    res
      .status(HTTP_STATUS.OK)
      .json({ success: true, data: { isConnected } });
  });

  sendDirectMessage = asyncWrapper(async (req: Request, res: Response) => {
    const ctx = getEmployeeContext();
    const validData = SendDirectMessageSchema.parse(req.body);

    try {
      await graphClientService.sendDirectMessage(
        ctx.id,
        validData.recipientEmail,
        validData.message,
      );

      res.status(HTTP_STATUS.OK).json({ success: true });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send direct message";
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: errorMessage
      });
    }
  });

  disconnect = asyncWrapper(async (req: Request, res: Response) => {
    const ctx = getEmployeeContext();
    await graphAuthService.disconnect(ctx.id);
    res.status(HTTP_STATUS.OK).json({ success: true });
  });
}
