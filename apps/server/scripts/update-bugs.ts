/* eslint-disable node/prefer-global/process */
/* eslint-disable node/prefer-global/buffer */
import { writeFile } from "node:fs/promises";

import { env } from "../src/config/env";

const apiUrl = `https://${env.JIRA_DOMAIN}/rest/api/3`;
const auth = Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString("base64");
const authHeader = `Basic ${auth}`;

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    description?: any;
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  startAt: number;
  maxResults: number;
  total: number;
}

async function getBugsIssues(): Promise<JiraIssue[]> {
  try {
    const jql = `project = ${env.JIRA_PROJECT_KEY} AND status = "Bugs"`;
    const params = new URLSearchParams({
      jql,
      maxResults: "1000",
      fields: "summary,description,key",
    });

    const response = await fetch(`${apiUrl}/search/jql?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API error: ${response.status} - ${errorText}`);
    }

    const result: JiraSearchResponse = await response.json();
    return result.issues;
  }
  catch (error) {
    throw new Error(`Failed to fetch Bugs issues: ${(error as Error).message}`);
  }
}

async function saveBackup(issues: JiraIssue[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-bugs-${timestamp}.json`;
  const filepath = `./scripts/${filename}`;

  await writeFile(filepath, JSON.stringify(issues, null, 2));
  return filepath;
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
    throw new Error(`Failed to update issue ${issueKey}: ${response.status} - ${errorText}`);
  }
}

async function main() {
  console.log("Fetching all issues in Bugs status...");

  const issues = await getBugsIssues();

  console.log(`\nFound ${issues.length} issues in Bugs status`);

  console.log("\nSaving backup...");
  const backupPath = await saveBackup(issues);
  console.log(`✓ Backup saved to: ${backupPath}`);

  console.log("\nUpdating issues...");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const issue of issues) {
    try {
      const currentTitle = issue.fields.summary;
      const description = issue.fields.description;

      if (!description?.content?.[0]?.content?.[0]?.text) {
        console.log(`⊘ ${issue.key}: No description text, skipping`);
        skipped++;
        continue;
      }

      const descriptionText = description.content[0].content[0].text;
      const nameMatch = currentTitle.match(/Bug Report - (.+?) - /);
      const userName = nameMatch ? nameMatch[1] : "Anonymous";

      const truncatedDescription = descriptionText.substring(0, 45);
      const newTitle = `${userName} - ${truncatedDescription}`;

      if (currentTitle === newTitle) {
        console.log(`✓ ${issue.key}: Already updated, skipping`);
        skipped++;
        continue;
      }

      await updateIssueTitle(issue.key, newTitle);
      console.log(`✓ ${issue.key}: ${currentTitle} → ${newTitle}`);
      updated++;
    }
    catch (error) {
      console.error(`✗ ${issue.key}: ${(error as Error).message}`);
      failed++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${issues.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
