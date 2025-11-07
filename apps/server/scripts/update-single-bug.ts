/* eslint-disable node/prefer-global/process */
/* eslint-disable node/prefer-global/buffer */
import { env } from "../src/config/env";

const apiUrl = `https://${env.JIRA_DOMAIN}/rest/api/3`;
const auth = Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString("base64");
const authHeader = `Basic ${auth}`;

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
  };
}

async function getMostRecentBug(): Promise<JiraIssue> {
  const jql = `project = ${env.JIRA_PROJECT_KEY} AND status = "Bugs" ORDER BY created DESC`;
  const params = new URLSearchParams({
    jql,
    maxResults: "1",
    fields: "summary,description,key",
  });

  const response = await fetch(`${apiUrl}/search/jql?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API error: ${response.status} - ${errorText}`);
  }

  const result: any = await response.json();
  return result.issues[0];
}

async function updateIssueTitle(issueKey: string, newTitle: string): Promise<void> {
  const response = await fetch(`${apiUrl}/issue/${issueKey}`, {
    method: "PUT",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      fields: {
        summary: newTitle,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update issue: ${response.status} - ${errorText}`);
  }
}

async function main() {
  console.log("Fetching most recent bug...");

  const issue = await getMostRecentBug();

  console.log(`\nMost recent bug: ${issue.key}`);
  console.log(`Current title: ${issue.fields.summary}`);
  console.log(`\nFull description object:`, JSON.stringify(issue.fields.description, null, 2));

  const description = issue.fields.description;
  if (!description?.content?.[0]?.content?.[0]?.text) {
    console.log("No description text found");
    return;
  }

  const descriptionText = description.content[0].content[0].text;
  console.log(`\nDescription text: ${descriptionText}`);

  const currentTitle = issue.fields.summary;
  const nameMatch = currentTitle.match(/Bug Report - (.+?) - /);
  const userName = nameMatch ? nameMatch[1] : "Anonymous";

  const truncatedDescription = descriptionText.substring(0, 45);
  const newTitle = `${userName} - ${truncatedDescription}`;

  console.log(`\nNew title: ${newTitle}`);

  console.log("\nUpdating issue...");
  await updateIssueTitle(issue.key, newTitle);

  console.log("✓ Issue updated successfully!");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
