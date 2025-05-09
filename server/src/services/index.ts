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

class Services {
  readonly alarmService: AlarmService;
  readonly authService: AuthService;
  readonly configService: ConfigService;
  readonly connectionService: ConnectionService;
  readonly dataCollectorService: DataCollectorService;
  readonly machineService: MachineService;
  readonly redisService: RedisService;
  readonly socketService: SocketService;
  readonly stateService: StateService;
  readonly userService: UserService;
  private static instance: Services;

  private constructor(httpServer: any) {
    this.alarmService = new AlarmService();
    this.authService = new AuthService(this);
    this.configService = new ConfigService();
    this.connectionService = new ConnectionService();
    this.dataCollectorService = new DataCollectorService(this);
    this.machineService = new MachineService();
    this.redisService = new RedisService();
    this.socketService = new SocketService(httpServer, this);
    this.stateService = new StateService(this);
    this.userService = new UserService();
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
    await this.userService.initialize();
    await this.machineService.initialize();
    await this.connectionService.initialize();
    // await this.stateService.createTestStates();
    // await this.stateService.createSampleStates();
    this.dataCollectorService.startBroadcastingMachineStates();
  }
}

export default Services;
