export class AgentService {
  async receiveMessage(_conversationId: string, _content: any) {
    return { userMsg: "hello", assistantMsg: "" };
  }

  async sendMessage() { }

  async plan() {
    // get current employee
    // get tools per the employee perms
    //
  }

  async execute() { }

  async reflect() { }

  private async getPrompt() { }

  private async injectPrompt() { }

  private async textToChunks() { }
}
