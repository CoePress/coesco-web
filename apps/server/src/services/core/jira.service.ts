import { env } from "@/config/env";

interface CreateIssueOptions {
  title: string;
  description: string;
  userEmail?: string;
  userName?: string;
  screenshot?: string;
  url?: string;
  userAgent?: string;
}

interface JiraIssueResponse {
  success: boolean;
  issueKey?: string;
  issueUrl?: string;
  error?: string;
}

export class JiraService {
  private readonly apiUrl: string;
  private readonly authHeader: string;

  constructor() {
    this.apiUrl = `https://${env.JIRA_DOMAIN}/rest/api/3`;
    const auth = Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString("base64");
    this.authHeader = `Basic ${auth}`;
  }

  async createBugIssue(options: CreateIssueOptions): Promise<JiraIssueResponse> {
    try {
      const { title, description, userEmail, userName, screenshot, url, userAgent } = options;

      const descriptionContent: any[] = [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: description,
            },
          ],
        },
      ];

      if (userName || userEmail) {
        const reportedBy = userName && userEmail
          ? `${userName} (${userEmail})`
          : userName || userEmail;

        descriptionContent.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Reported by: ${reportedBy}`,
            },
          ],
        });
      }

      if (url) {
        descriptionContent.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Page URL: ${url}`,
            },
          ],
        });
      }

      if (userAgent) {
        descriptionContent.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Browser: ${userAgent}`,
            },
          ],
        });
      }

      const issueData = {
        fields: {
          project: {
            key: env.JIRA_PROJECT_KEY,
          },
          summary: title,
          description: {
            type: "doc",
            version: 1,
            content: descriptionContent,
          },
          issuetype: {
            name: "Task",
          },
        },
      };

      const response = await fetch(`${this.apiUrl}/issue`, {
        method: "POST",
        headers: {
          "Authorization": this.authHeader,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jira API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const issueKey = result.key;
      const issueUrl = `https://${env.JIRA_DOMAIN}/browse/${issueKey}`;

      await this.transitionToBugs(issueKey);

      if (screenshot) {
        await this.attachScreenshot(issueKey, screenshot);
      }

      return {
        success: true,
        issueKey,
        issueUrl,
      };
    }
    catch (error) {
      throw new Error(`Failed to create Jira issue: ${(error as Error).message}`);
    }
  }

  private async transitionToBugs(issueKey: string): Promise<void> {
    try {
      const transitionsResponse = await fetch(`${this.apiUrl}/issue/${issueKey}/transitions`, {
        method: "GET",
        headers: {
          "Authorization": this.authHeader,
          "Content-Type": "application/json",
        },
      });

      if (!transitionsResponse.ok) {
        console.error(`Failed to get transitions for issue ${issueKey}`);
        return;
      }

      const transitionsData = await transitionsResponse.json();
      const bugsTransition = transitionsData.transitions.find(
        (t: any) => t.name === "Bugs" || t.to.name === "Bugs",
      );

      if (!bugsTransition) {
        console.error(`No transition to "Bugs" status found for issue ${issueKey}`);
        return;
      }

      const transitionResponse = await fetch(`${this.apiUrl}/issue/${issueKey}/transitions`, {
        method: "POST",
        headers: {
          "Authorization": this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transition: {
            id: bugsTransition.id,
          },
        }),
      });

      if (!transitionResponse.ok) {
        const errorText = await transitionResponse.text();
        console.error(`Failed to transition issue to Bugs: ${transitionResponse.status} - ${errorText}`);
      }
    }
    catch (error) {
      console.error(`Failed to transition issue to Bugs: ${(error as Error).message}`);
    }
  }

  private async attachScreenshot(issueKey: string, screenshotBase64: string): Promise<void> {
    try {
      const base64Data = screenshotBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const formData = new FormData();
      const blob = new Blob([buffer], { type: "image/png" });
      formData.append("file", blob, "screenshot.png");

      const response = await fetch(`${this.apiUrl}/issue/${issueKey}/attachments`, {
        method: "POST",
        headers: {
          "Authorization": this.authHeader,
          "X-Atlassian-Token": "no-check",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to attach screenshot: ${response.status} - ${errorText}`);
      }
    }
    catch (error) {
      console.error(`Failed to attach screenshot: ${(error as Error).message}`);
    }
  }
}
