import MachineAlarm from "@/models/machine-alarm";
import {
  IAlarmService,
  ICreateMachineAlarmDTO,
  IMachineAlarm,
  ValidationError,
} from "@/utils/types";

class AlarmService implements IAlarmService {
  async createAlarm(alarm: ICreateMachineAlarmDTO): Promise<IMachineAlarm> {
    await this.validateAlarm(alarm);
    const machineAlarm = await MachineAlarm.create(alarm);
    return machineAlarm;
  }

  async getAlarms(): Promise<IMachineAlarm[]> {
    const alarms = await MachineAlarm.findAll();
    return alarms;
  }

  async getActiveAlarms(): Promise<IMachineAlarm[]> {
    const alarms = await MachineAlarm.findAll({
      where: { resolved: false },
    });
    return alarms;
  }

  async getAlarmsByMachineId(machineId: string): Promise<IMachineAlarm[]> {
    const alarms = await MachineAlarm.findAll({
      where: { machineId },
    });
    return alarms;
  }

  async resolveAlarm(id: string): Promise<IMachineAlarm> {
    const machineAlarm = await MachineAlarm.findByPk(id);
    if (!machineAlarm) throw new ValidationError("Alarm not found");
    machineAlarm.resolved = true;
    await machineAlarm.save();
    return machineAlarm;
  }

  private async validateAlarm(alarm: ICreateMachineAlarmDTO): Promise<void> {
    if (!alarm.machineId) throw new ValidationError("Machine ID is required");
    if (!alarm.type) throw new ValidationError("Alarm type is required");
    if (!alarm.severity)
      throw new ValidationError("Alarm severity is required");
    if (!alarm.message) throw new ValidationError("Alarm message is required");
  }
}

export default AlarmService;
