import AuthService from "./auth.service";
import AlarmService from "./alarm.service";
import ConfigService from "./config.service";
import ConnectionService from "./connection.service";
import DataCollectorService from "./data-collector.service";
import MachineService from "./machine.service";
import RedisService from "./redis.service";
import SocketService from "./socket.service";
import StateService from "./state.service";
import UserService from "./user.service";
import { AppError } from "@/middleware/error-handler";
import { info } from "@/utils/logger";
import { __prod__ } from "@/config/env";
import { sampleStates } from "@/config/sample-data";

class Services {
  readonly alarm: AlarmService;
  readonly auth: AuthService;
  readonly config: ConfigService;
  readonly connection: ConnectionService;
  readonly dataCollector: DataCollectorService;
  readonly machine: MachineService;
  readonly redis: RedisService;
  readonly socket: SocketService;
  readonly state: StateService;
  readonly user: UserService;
  private static instance: Services;

  private constructor(httpServer: any) {
    this.alarm = new AlarmService();
    this.auth = new AuthService(this);
    this.config = new ConfigService();
    this.connection = new ConnectionService();
    this.dataCollector = new DataCollectorService();
    this.machine = new MachineService();
    this.redis = new RedisService();
    this.socket = new SocketService(httpServer);
    this.state = new StateService();
    this.user = new UserService();
  }

  static getInstance(httpServer?: any): Services {
    if (!Services.instance) {
      if (!httpServer) {
        throw new AppError(500, "HTTP server must be provided");
      }
      Services.instance = new Services(httpServer);
    }
    return Services.instance;
  }

  async initialize() {
    info("Services initialized");
    await this.user.initialize();

    await this.machine.initialize();
    await this.connection.initialize();
  }

  async seedSampleData() {
    if (__prod__) return;

    for (const state of sampleStates) {
      await this.state.createState(state);
    }
  }
}

export default Services;
