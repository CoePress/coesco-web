import { ICreateMachineStateDTO } from "../utils/types";

const states = ["ACTIVE", "IDLE", "ALARM", "OFFLINE"];
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
  "7775e1d4-6d37-499c-8bae-dccf4b00da04",
  "242c68d0-4630-4911-b598-8584a2db7fdc",
  "f59bbe18-584f-4657-a7fa-1e7131213cb6",
  "5286cda6-0c4d-405d-ba61-47dcc69ecefb",
  "55fd955a-9665-453f-a060-9ddf588a5ae4",
  "7c3f0354-5195-41b3-87a2-df73e67ae239",
  "5e27f8b7-18ed-422b-bec7-800047056c73",
  "e997eb7f-d2dd-41b0-bea1-f95bc6cb1b60",
];

export const sampleStates: ICreateMachineStateDTO[] = Array.from(
  { length: 15000 },
  (_, i) => {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 1 * 365 * 24 * 60 * 60 * 1000);
    const timestamp = new Date(
      oneYearAgo.getTime() + ((now.getTime() - oneYearAgo.getTime()) * i) / 999
    );
    return {
      machineId: machineIds[Math.floor(Math.random() * machineIds.length)],
      timestamp,
      state: states[Math.floor(Math.random() * states.length)],
      execution: executions[Math.floor(Math.random() * executions.length)],
      controller:
        controllerModes[Math.floor(Math.random() * controllerModes.length)],
      program: `P${1000 + i}`,
      tool: `T${200 + i}`,
      spindle: {
        speed: 1000 + Math.floor(Math.random() * 500),
        load: 100 + Math.floor(Math.random() * 50),
      },
      axes: [
        { label: "X", position: 100 + Math.random() * 50 },
        { label: "Y", position: 100 + Math.random() * 50 },
        { label: "Z", position: 100 + Math.random() * 50 },
        { label: "A", position: 0 },
        { label: "B", position: 0 },
        { label: "C", position: 0 },
      ],
      feedRate: 100 + Math.floor(Math.random() * 50),
    };
  }
);
