/* eslint-disable ts/no-unsafe-function-type */
/* eslint-disable node/prefer-global/buffer */
/* eslint-disable dot-notation */
import type { Server, Socket } from "socket.io";

import { spawn } from "node:child_process";

import { chatService, lockingService, messageService } from "@/services";

import { SocketService } from "../socket.service";

jest.mock("node:child_process");
jest.mock("@/services", () => ({
  chatService: {
    createChat: jest.fn(),
  },
  lockingService: {
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
    extendLock: jest.fn(),
    forceReleaseLock: jest.fn(),
  },
  messageService: {
    createMessage: jest.fn(),
  },
}));
jest.mock("@/utils/logger");

describe("socketService", () => {
  let socketService: SocketService;
  let mockIo: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;
  let namespaceHandlers: Map<string, Map<string, Function>>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    namespaceHandlers = new Map();

    mockSocket = {
      id: "test-socket-id",
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      handshake: {
        query: {},
        auth: {},
      },
    } as any;

    const createMockNamespace = (name: string) => ({
      on: jest.fn((event: string, handler: Function) => {
        if (!namespaceHandlers.has(name)) {
          namespaceHandlers.set(name, new Map());
        }
        namespaceHandlers.get(name)?.set(event, handler);
      }),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      adapter: {
        rooms: new Map(),
      },
    });

    mockIo = {
      of: jest.fn((namespace: any) => {
        const namespaceName = typeof namespace === "string" ? namespace.replace("/", "") : "default";
        return createMockNamespace(namespaceName);
      }),
      close: jest.fn((callback) => {
        callback?.();
      }) as any,
    } as any;

    socketService = new SocketService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    namespaceHandlers.clear();
  });

  describe("initialize", () => {
    it("should throw error if io is null", async () => {
      await expect(socketService.initialize(null as any)).rejects.toThrow(
        "Socket.IO instance not set",
      );
    });

    it("should register all namespaces", async () => {
      await socketService.initialize(mockIo);

      expect(mockIo.of).toHaveBeenCalledWith("/iot");
      expect(mockIo.of).toHaveBeenCalledWith("/metrics");
      expect(mockIo.of).toHaveBeenCalledWith("/chat");
      expect(mockIo.of).toHaveBeenCalledWith("/system");
      expect(mockIo.of).toHaveBeenCalledWith("/locks");
      expect(mockIo.of).toHaveBeenCalledWith("/session");
      expect(mockIo.of).toHaveBeenCalledWith("/performance");
    });

    it("should set up connection handlers for all namespaces", async () => {
      await socketService.initialize(mockIo);

      expect(namespaceHandlers.get("iot")?.has("connection")).toBe(true);
      expect(namespaceHandlers.get("metrics")?.has("connection")).toBe(true);
      expect(namespaceHandlers.get("chat")?.has("connection")).toBe(true);
      expect(namespaceHandlers.get("system")?.has("connection")).toBe(true);
      expect(namespaceHandlers.get("locks")?.has("connection")).toBe(true);
      expect(namespaceHandlers.get("session")?.has("connection")).toBe(true);
      expect(namespaceHandlers.get("performance")?.has("connection")).toBe(true);
    });
  });

  describe("broadcastMachineStates", () => {
    it("should broadcast to machine_states room in iot namespace", async () => {
      await socketService.initialize(mockIo);
      const testData = { machine: "test", state: "running" };

      socketService.broadcastMachineStates(testData);

      const iotNamespace = mockIo.of("/iot");
      expect(iotNamespace.to).toHaveBeenCalledWith("machine_states");
      expect(iotNamespace.emit).toHaveBeenCalledWith("machine_states", testData);
    });

    it("should not broadcast if io is null", () => {
      socketService.broadcastMachineStates({ test: "data" });

      expect(mockIo.of).not.toHaveBeenCalled();
    });
  });

  describe("broadcastSystemHealth", () => {
    it("should broadcast to health room in system namespace", async () => {
      await socketService.initialize(mockIo);
      const testData = { cpu: 50, memory: 70 };

      socketService.broadcastSystemHealth(testData);

      const systemNamespace = mockIo.of("/system");
      expect(systemNamespace.to).toHaveBeenCalledWith("health");
      expect(systemNamespace.emit).toHaveBeenCalledWith("health", testData);
    });

    it("should not broadcast if io is null", () => {
      socketService.broadcastSystemHealth({ test: "data" });

      expect(mockIo.of).not.toHaveBeenCalled();
    });
  });

  describe("broadcastSystemUpdate", () => {
    it("should broadcast to updates room in system namespace", async () => {
      await socketService.initialize(mockIo);
      const testData = { version: "1.0.0" };

      socketService.broadcastSystemUpdate(testData);

      const systemNamespace = mockIo.of("/system");
      expect(systemNamespace.to).toHaveBeenCalledWith("updates");
      expect(systemNamespace.emit).toHaveBeenCalledWith("update", testData);
    });

    it("should not broadcast if io is null", () => {
      socketService.broadcastSystemUpdate({ test: "data" });

      expect(mockIo.of).not.toHaveBeenCalled();
    });
  });

  describe("broadcastSessionRevoked", () => {
    it("should broadcast session revocation to user room", async () => {
      await socketService.initialize(mockIo);
      const userId = "user123";
      const sessionId = "session456";
      const reason = "Token expired";

      socketService.broadcastSessionRevoked(userId, sessionId, reason);

      const sessionNamespace = mockIo.of("/session");
      expect(sessionNamespace.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(sessionNamespace.emit).toHaveBeenCalledWith(
        "session:revoked",
        expect.objectContaining({
          sessionId,
          reason,
        }),
      );
    });

    it("should broadcast without reason if not provided", async () => {
      await socketService.initialize(mockIo);

      socketService.broadcastSessionRevoked("user123", "session456");

      const sessionNamespace = mockIo.of("/session");
      expect(sessionNamespace.emit).toHaveBeenCalledWith(
        "session:revoked",
        expect.objectContaining({
          sessionId: "session456",
          reason: undefined,
        }),
      );
    });

    it("should not broadcast if io is null", () => {
      socketService.broadcastSessionRevoked("user123", "session456");

      expect(mockIo.of).not.toHaveBeenCalled();
    });
  });

  describe("iOT namespace", () => {
    it("should handle machine_states:subscribe", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("iot")?.get("connection");

      connectionHandler?.(mockSocket);

      const subscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "machine_states:subscribe",
      )?.[1];

      subscribeHandler?.();

      expect(mockSocket.join).toHaveBeenCalledWith("machine_states");
      expect(mockSocket.emit).toHaveBeenCalledWith("machine_states:subscribed");
    });

    it("should handle machine_states:unsubscribe", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("iot")?.get("connection");

      connectionHandler?.(mockSocket);

      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "machine_states:unsubscribe",
      )?.[1];

      unsubscribeHandler?.();

      expect(mockSocket.leave).toHaveBeenCalledWith("machine_states");
      expect(mockSocket.emit).toHaveBeenCalledWith("machine_states:unsubscribed");
    });

    it("should handle disconnect", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("iot")?.get("connection");

      connectionHandler?.(mockSocket);

      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "disconnect",
      )?.[1];

      disconnectHandler?.("client disconnect");

      expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    });
  });

  describe("metrics namespace", () => {
    it("should handle connection", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("metrics")?.get("connection");

      connectionHandler?.(mockSocket);

      expect(mockSocket.id).toBe("test-socket-id");
    });
  });

  describe("chat namespace", () => {
    beforeEach(() => {
      (chatService.createChat as jest.Mock).mockResolvedValue({
        data: { id: "new-chat-id" },
      });
      (messageService.createMessage as jest.Mock).mockResolvedValue({});
    });

    it("should handle room:join", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("chat")?.get("connection");

      connectionHandler?.(mockSocket);

      const joinHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "room:join",
      )?.[1];

      joinHandler?.({ chatId: "chat123" });

      expect(mockSocket.join).toHaveBeenCalledWith("chat123");
    });

    it("should handle room:leave", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("chat")?.get("connection");

      connectionHandler?.(mockSocket);

      const leaveHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "room:leave",
      )?.[1];

      leaveHandler?.({ chatId: "chat123" });

      expect(mockSocket.leave).toHaveBeenCalledWith("chat123");
    });

    it("should handle message:user with existing chatId", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("chat")?.get("connection");

      connectionHandler?.(mockSocket);

      const messageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "message:user",
      )?.[1];

      const ack = jest.fn();
      await messageHandler?.(
        {
          employeeId: "emp123",
          chatId: "chat123",
          message: "Hello",
        },
        ack,
      );

      expect(messageService.createMessage).toHaveBeenCalledTimes(2);
      expect(ack).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          chatId: "chat123",
        }),
      );
    });

    it("should create new chat if chatId not provided", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("chat")?.get("connection");

      connectionHandler?.(mockSocket);

      const messageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "message:user",
      )?.[1];

      const ack = jest.fn();
      await messageHandler?.(
        {
          employeeId: "emp123",
          message: "Hello",
        },
        ack,
      );

      expect(chatService.createChat).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith("chat:url-update", {
        chatId: "new-chat-id",
      });
      expect(ack).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          chatId: "new-chat-id",
        }),
      );
    });

    it("should return error if message or employeeId missing", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("chat")?.get("connection");

      connectionHandler?.(mockSocket);

      const messageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "message:user",
      )?.[1];

      const ack = jest.fn();
      await messageHandler?.({ message: "Hello" }, ack);

      expect(ack).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining("Missing required fields"),
        }),
      );
    });

    it("should handle errors in message processing", async () => {
      (messageService.createMessage as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("chat")?.get("connection");

      connectionHandler?.(mockSocket);

      const messageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "message:user",
      )?.[1];

      const ack = jest.fn();
      await messageHandler?.(
        {
          employeeId: "emp123",
          chatId: "chat123",
          message: "Hello",
        },
        ack,
      );

      expect(ack).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Internal server error",
        }),
      );
    });
  });

  describe("system namespace", () => {
    it("should handle health:subscribe", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("system")?.get("connection");

      connectionHandler?.(mockSocket);

      const subscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "health:subscribe",
      )?.[1];

      subscribeHandler?.();

      expect(mockSocket.join).toHaveBeenCalledWith("health");
      expect(mockSocket.emit).toHaveBeenCalledWith("health:subscribed");
    });

    it("should handle health:unsubscribe", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("system")?.get("connection");

      connectionHandler?.(mockSocket);

      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "health:unsubscribe",
      )?.[1];

      unsubscribeHandler?.();

      expect(mockSocket.leave).toHaveBeenCalledWith("health");
      expect(mockSocket.emit).toHaveBeenCalledWith("health:unsubscribed");
    });

    it("should handle updates:subscribe", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("system")?.get("connection");

      connectionHandler?.(mockSocket);

      const subscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "updates:subscribe",
      )?.[1];

      subscribeHandler?.();

      expect(mockSocket.join).toHaveBeenCalledWith("updates");
      expect(mockSocket.emit).toHaveBeenCalledWith("updates:subscribed");
    });

    it("should handle updates:unsubscribe", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("system")?.get("connection");

      connectionHandler?.(mockSocket);

      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "updates:unsubscribe",
      )?.[1];

      unsubscribeHandler?.();

      expect(mockSocket.leave).toHaveBeenCalledWith("updates");
      expect(mockSocket.emit).toHaveBeenCalledWith("updates:unsubscribed");
    });
  });

  describe("locks namespace", () => {
    beforeEach(() => {
      (lockingService.acquireLock as jest.Mock).mockResolvedValue({
        success: true,
        lockInfo: { userId: "user123" },
      });
      (lockingService.releaseLock as jest.Mock).mockResolvedValue({ success: true });
      (lockingService.extendLock as jest.Mock).mockResolvedValue({
        success: true,
        lockInfo: { userId: "user123" },
      });
      (lockingService.forceReleaseLock as jest.Mock).mockResolvedValue({ success: true });
    });

    it("should handle lock:acquire", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("locks")?.get("connection");

      connectionHandler?.(mockSocket);

      const acquireHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "lock:acquire",
      )?.[1];

      const callback = jest.fn();
      await acquireHandler?.(
        { recordType: "order", recordId: "123", userId: "user123" },
        callback,
      );

      expect(lockingService.acquireLock).toHaveBeenCalledWith("order", "123", "user123");
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should handle lock:release", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("locks")?.get("connection");

      connectionHandler?.(mockSocket);

      const releaseHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "lock:release",
      )?.[1];

      const callback = jest.fn();
      await releaseHandler?.(
        { recordType: "order", recordId: "123", userId: "user123" },
        callback,
      );

      expect(lockingService.releaseLock).toHaveBeenCalledWith("order", "123", "user123");
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should handle lock:extend", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("locks")?.get("connection");

      connectionHandler?.(mockSocket);

      const extendHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "lock:extend",
      )?.[1];

      const callback = jest.fn();
      await extendHandler?.(
        { recordType: "order", recordId: "123", userId: "user123" },
        callback,
      );

      expect(lockingService.extendLock).toHaveBeenCalledWith("order", "123", "user123");
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should handle lock:force-release", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("locks")?.get("connection");

      connectionHandler?.(mockSocket);

      const forceReleaseHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "lock:force-release",
      )?.[1];

      const callback = jest.fn();
      await forceReleaseHandler?.(
        { recordType: "order", recordId: "123", userId: "admin123" },
        callback,
      );

      expect(lockingService.forceReleaseLock).toHaveBeenCalledWith(
        "order",
        "123",
        "admin123",
      );
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should emit lock:changed after successful acquire", async () => {
      await socketService.initialize(mockIo);
      const locksNamespace = mockIo.of("/locks");
      const connectionHandler = namespaceHandlers.get("locks")?.get("connection");

      connectionHandler?.(mockSocket);

      const acquireHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "lock:acquire",
      )?.[1];

      await acquireHandler?.(
        { recordType: "order", recordId: "123", userId: "user123" },
        jest.fn(),
      );

      expect(locksNamespace.emit).toHaveBeenCalledWith(
        "lock:changed",
        expect.objectContaining({
          recordType: "order",
          recordId: "123",
        }),
      );
    });
  });

  describe("session namespace", () => {
    it("should join user room on connection", async () => {
      mockSocket.handshake.auth.userId = "user123";

      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("session")?.get("connection");

      connectionHandler?.(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith("user:user123");
    });

    it("should not join room if userId not provided", async () => {
      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("session")?.get("connection");

      connectionHandler?.(mockSocket);

      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe("performance namespace", () => {
    it("should handle performance-sheet:calculate", async () => {
      const mockSpawn = {
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        stdout: {
          on: jest.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify({ result: "success" })));
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, handler) => {
          if (event === "close") {
            handler(0);
          }
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockSpawn);

      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("performance")?.get("connection");

      connectionHandler?.(mockSocket);

      const calculateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "performance-sheet:calculate",
      )?.[1];

      const callback = jest.fn();
      await calculateHandler?.(
        { formData: { test: "data" }, scriptName: "test.py" },
        callback,
      );

      expect(spawn).toHaveBeenCalledWith("python", [expect.stringContaining("test.py")]);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          result: { result: "success" },
        }),
      );
    });

    it("should handle calculation errors", async () => {
      const mockSpawn = {
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from("Python error"));
            }
          }),
        },
        on: jest.fn((event, handler) => {
          if (event === "close") {
            handler(1);
          }
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockSpawn);

      await socketService.initialize(mockIo);
      const connectionHandler = namespaceHandlers.get("performance")?.get("connection");

      connectionHandler?.(mockSocket);

      const calculateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "performance-sheet:calculate",
      )?.[1];

      const callback = jest.fn();
      await calculateHandler?.(
        { formData: { test: "data" }, scriptName: "test.py" },
        callback,
      );

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Calculation failed",
        }),
      );
    });
  });

  describe("executePythonScript", () => {
    it("should execute Python script successfully", async () => {
      const mockSpawn = {
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        stdout: {
          on: jest.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify({ result: "success" })));
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, handler) => {
          if (event === "close") {
            handler(0);
          }
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockSpawn);

      const result = await socketService["executePythonScript"]("/path/to/script.py", {
        test: "data",
      });

      expect(result).toEqual({ result: "success" });
      expect(mockSpawn.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({ test: "data" }),
      );
    });

    it("should reject on non-zero exit code", async () => {
      const mockSpawn = {
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from("Script failed"));
            }
          }),
        },
        on: jest.fn((event, handler) => {
          if (event === "close") {
            handler(1);
          }
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockSpawn);

      await expect(
        socketService["executePythonScript"]("/path/to/script.py", {}),
      ).rejects.toThrow("Script failed");
    });

    it("should reject on invalid JSON output", async () => {
      const mockSpawn = {
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        stdout: {
          on: jest.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from("invalid json"));
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, handler) => {
          if (event === "close") {
            handler(0);
          }
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockSpawn);

      await expect(
        socketService["executePythonScript"]("/path/to/script.py", {}),
      ).rejects.toThrow("Invalid JSON output");
    });

    it("should reject on process error", async () => {
      const mockSpawn = {
        stdin: {
          write: jest.fn(),
          end: jest.fn(),
        },
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, handler) => {
          if (event === "error") {
            handler(new Error("Process failed"));
          }
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockSpawn);

      await expect(
        socketService["executePythonScript"]("/path/to/script.py", {}),
      ).rejects.toThrow("Process failed");
    });
  });

  describe("getNamespace", () => {
    it("should return namespace", async () => {
      await socketService.initialize(mockIo);

      const namespace = socketService["getNamespace"]("test");

      expect(mockIo.of).toHaveBeenCalledWith("/test");
      expect(namespace).toBeDefined();
    });

    it("should throw error if io not set", () => {
      expect(() => socketService["getNamespace"]("test")).toThrow(
        "Socket.IO instance not set",
      );
    });
  });

  describe("stop", () => {
    it("should close Socket.IO server", async () => {
      await socketService.initialize(mockIo);

      await socketService.stop();

      expect(mockIo.close).toHaveBeenCalled();
    });

    it("should disconnect client sockets", async () => {
      const mockClientNamespace = {
        disconnectSockets: jest.fn(),
      };

      mockIo.of.mockImplementation((namespace: any) => {
        if (namespace === "/client") {
          return mockClientNamespace as any;
        }
        return {
          on: jest.fn(),
          to: jest.fn().mockReturnThis(),
          emit: jest.fn(),
        } as any;
      });

      await socketService.initialize(mockIo);
      await socketService.stop();

      expect(mockClientNamespace.disconnectSockets).toHaveBeenCalledWith(true);
    });

    it("should not throw if io is null", async () => {
      await expect(socketService.stop()).resolves.not.toThrow();
    });

    it("should handle close errors", async () => {
      (mockIo.close as any).mockImplementation((callback: any) => {
        callback?.(new Error("Close error"));
      });

      await socketService.initialize(mockIo);

      await expect(socketService.stop()).rejects.toThrow("Close error");
    });
  });
});
