import { connectionSeed } from "@/config/database";
import Machine from "@/models/machine";
import MachineConnection from "@/models/machine-connection";
import {
  IConnectionService,
  ICreateMachineConnectionDTO,
  IMachineConnection,
  MachineConnectionProtocol,
  MachineConnectionStatus,
  ValidationError,
} from "@/utils/types";

interface IUpdateMachineConnectionDTO {
  machineId?: string;
  protocol?: string;
  host?: string;
  port?: number;
  path?: string;
}

class ConnectionService implements IConnectionService {
  async initialize() {
    const connections = await MachineConnection.findAll();
    if (connections.length === 0) {
      for (const connection of connectionSeed) {
        await this.createConnection({
          ...connection,
          protocol: connection.protocol as MachineConnectionProtocol,
        });
      }
    }
  }

  async createConnection(
    data: ICreateMachineConnectionDTO
  ): Promise<IMachineConnection> {
    await this.validateConnection(data);

    const machine = await Machine.findOne({
      where: { slug: data.machineSlug },
    });
    if (!machine) throw new ValidationError("Machine not found");

    const existing = await MachineConnection.findOne({
      where: { machineSlug: data.machineSlug },
    });

    if (existing)
      throw new ValidationError("Connection for this machine already exists");

    const connection = await MachineConnection.create({
      machineId: machine.id,
      machineSlug: data.machineSlug,
      protocol: data.protocol,
      host: data.host,
      port: data.port,
      path: data.path,
      status: "DISCONNECTED" as MachineConnectionStatus,
    });

    return connection;
  }

  async getConnections(): Promise<IMachineConnection[]> {
    const connections = await MachineConnection.findAll();
    return connections;
  }

  async getConnection(id: string): Promise<IMachineConnection | null> {
    if (!id) throw new ValidationError("Connection ID is required");

    const connection = (await MachineConnection.findByPk(
      id
    )) as IMachineConnection | null;

    return connection;
  }

  async getConnectionByMachineId(
    machineId: string
  ): Promise<IMachineConnection | null> {
    if (!machineId) throw new ValidationError("Machine ID is required");

    const connection = await MachineConnection.findOne({
      where: { machineId },
    });
    return connection;
  }

  async updateConnection(
    id: string,
    data: IUpdateMachineConnectionDTO
  ): Promise<IMachineConnection> {
    if (!id) throw new ValidationError("Connection ID is required");

    const connection = await MachineConnection.findByPk(id);
    if (!connection) throw new ValidationError("Connection not found");

    if (data.machineId !== undefined) connection.machineId = data.machineId;
    if (data.protocol !== undefined)
      connection.protocol = data.protocol as MachineConnectionProtocol;
    if (data.host !== undefined) connection.host = data.host;
    if (data.port !== undefined) connection.port = data.port;
    if (data.path !== undefined) connection.path = data.path;

    await connection.save();
    return connection as unknown as IMachineConnection;
  }

  async updateConnectionStatus(
    id: string,
    status: MachineConnectionStatus
  ): Promise<IMachineConnection> {
    if (!id) throw new ValidationError("Connection ID is required");
    if (!status) throw new ValidationError("Status is required");

    const connection = await MachineConnection.findByPk(id);
    if (!connection) throw new ValidationError("Connection not found");

    connection.status = status;
    await connection.save();

    return connection as unknown as IMachineConnection;
  }

  async deleteConnection(id: string): Promise<void> {
    if (!id) throw new ValidationError("Connection ID is required");

    await MachineConnection.destroy({ where: { id } });
  }

  async validateConnection(
    connection: ICreateMachineConnectionDTO
  ): Promise<void> {
    if (!connection.machineSlug)
      throw new ValidationError("Machine slug is required");
    if (!connection.protocol) throw new ValidationError("Protocol is required");
    if (!connection.host) throw new ValidationError("Host is required");
    if (!connection.port) throw new ValidationError("Port is required");
  }
}

export default ConnectionService;
