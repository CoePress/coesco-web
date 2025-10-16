import type { EmailLog } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { emailLogRepository } from "@/repositories";

export class EmailLogService {
  async createEmailLog(data: Partial<EmailLog>) {
    return emailLogRepository.create(data);
  }

  async updateEmailLog(id: string, data: Partial<EmailLog>) {
    return emailLogRepository.update(id, data);
  }

  async deleteEmailLog(id: string) {
    return emailLogRepository.delete(id);
  }

  async getAllEmailLogs(params?: IQueryParams<EmailLog>) {
    return emailLogRepository.getAll(params);
  }

  async getEmailLogById(id: string, params?: IQueryParams<EmailLog>) {
    return emailLogRepository.getById(id, params);
  }
}
