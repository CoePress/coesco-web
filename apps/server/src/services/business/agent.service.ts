import { readFileSync } from "node:fs";
import { join } from "node:path";

import { env } from "@/config/env";

import { mcpService } from "..";

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
}

export class AgentService {
  async processMessage(employeeId: string, conversationId: string, message: string) {
    const planPrompt = await this.plan(message);

    // TODO: Send planPrompt to LLM to get structured plan JSON

    const fullMessage = {
      conversationId,
      content: planPrompt,
      type: "plan",
      timestamp: new Date(),
      metadata: {
        employeeId,
        originalRequest: message,
        status: "planning",
      },
    };

    return fullMessage;
  }

  async plan(userPrompt: string) {
    const tools = await mcpService.getTools();
    const schemas = await mcpService.getSchemas();

    const prompt = await this.getPrompt("plan", {
      user_prompt: userPrompt,
      available_tools: JSON.stringify(tools, null, 2),
      available_schemas: JSON.stringify(schemas, null, 2),
    });

    return prompt;
  }

  async execute() { }

  async reflect() { }

  async callLLM(
    provider: "claude" | "openai",
    message: string,
    options: any = {},
  ): Promise<string> {
    switch (provider) {
      case "claude":
        return await this.callClaude(message, options);
      case "openai":
        return await this.callOpenAI(message, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callClaude(message: string, options: any = {}): Promise<string> {
    const {
      model = "claude-3-5-sonnet-20241022",
      maxTokens = 1000,
      temperature = 0.7,
      apiKey = env.ANTHROPIC_API_KEY,
    } = options;

    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data: ClaudeResponse = await response.json();
    return data.content[0].text;
  }

  private async callOpenAI(message: string, options: any = {}): Promise<string> {
    const {
      model = "gpt-4",
      temperature = 0.7,
      maxTokens = 1000,
      apiKey = env.OPENAI_API_KEY,
    } = options;

    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: message }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0].message.content;
  }

  private async getPrompt(promptName: string, variables: Record<string, string> = {}) {
    const promptPath = join(__dirname, "..", "..", "prompts", `${promptName}.md`);
    let promptContent = readFileSync(promptPath, "utf-8");

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      promptContent = promptContent.replace(regex, value);
    });

    return promptContent;
  }
}
