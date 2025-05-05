import { IDataCollectorService } from "@/utils/types";

class DataCollectorService implements IDataCollectorService {
  async startPolling(connectionId: string): Promise<void> {}

  async stopPolling(connectionId: string): Promise<void> {}

  async processMTConnectData(
    machineId: string,
    xmlData: string
  ): Promise<void> {}

  async processFanucData(machineId: string, data: any): Promise<void> {}
}

export default DataCollectorService;
