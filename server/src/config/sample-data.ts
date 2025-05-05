import { ICreateMachineStateDTO, IMachineState } from "../utils/types";

const states = ["RUNNING", "IDLE", "ALARM", "HOLD", "STOPPED"];
const executions = ["RUNNING", "STOPPED", "READY", "FEED_HOLD", "INTERRUPTED"];
const controllerModes = [
  "JOB",
  "EDIT",
  "MDI",
  "HANDLE",
  "JOG",
  "ZERO_RETURN",
  "REF",
  "TEACH",
];

const machineIds = [
  "0772cd3c-6b0b-4016-869f-acc992eec365",
  "5f0774db-95d4-48a5-a506-b1e720d79073",
  "a7272a1d-f26c-47b8-b8d7-711f939d85da",
];

export const sampleStates: ICreateMachineStateDTO[] = Array.from(
  { length: 1000 },
  (_, i) => {
    const now = new Date();
    return {
      machineId: machineIds[Math.floor(Math.random() * machineIds.length)],
      timestamp: new Date(now.getTime() - i * 60000),
      state: states[Math.floor(Math.random() * states.length)],
      execution: executions[Math.floor(Math.random() * executions.length)],
      controller:
        controllerModes[Math.floor(Math.random() * controllerModes.length)],
      program: `P${1000 + i}`,
      tool: `T${200 + i}`,
      position: {
        X: 100 + Math.random() * 50,
        Y: 100 + Math.random() * 50,
        Z: 100 + Math.random() * 50,
        A: 0,
        B: 0,
        C: 0,
      },
      feedRate: 100 + Math.floor(Math.random() * 50),
      spindleSpeed: 1000 + Math.floor(Math.random() * 500),
    };
  }
);
