import { ConsoleTransport } from "@/transports/console";
import { FileTransport } from "@/transports/file";
import { JSONTransport } from "@/transports/json";
import { LogLevel } from "@/core/interfaces";
import { Flog } from "@/core/flog";
import { readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

// Mock console.log to capture output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  console.log = mockConsoleLog;
  console.error = mockConsoleError;
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe("ConsoleTransport", () => {
  let transport: ConsoleTransport;

  beforeEach(() => {
    transport = new ConsoleTransport();
  });

  it("should write to console.log", () => {
    transport.write(LogLevel.INFO, "Test message");
    expect(mockConsoleLog).toHaveBeenCalledWith("Test message");
  });

  it("should handle all log levels", () => {
    transport.write(LogLevel.ERROR, "Error message");
    transport.write(LogLevel.WARN, "Warning message");
    transport.write(LogLevel.INFO, "Info message");
    transport.write(LogLevel.DEBUG, "Debug message");
    transport.write(LogLevel.TRACE, "Trace message");

    expect(mockConsoleLog).toHaveBeenCalledTimes(5);
    expect(mockConsoleLog).toHaveBeenNthCalledWith(1, "Error message");
    expect(mockConsoleLog).toHaveBeenNthCalledWith(2, "Warning message");
    expect(mockConsoleLog).toHaveBeenNthCalledWith(3, "Info message");
    expect(mockConsoleLog).toHaveBeenNthCalledWith(4, "Debug message");
    expect(mockConsoleLog).toHaveBeenNthCalledWith(5, "Trace message");
  });

  it("should handle metadata parameter", () => {
    const metadata = { userId: "123", action: "login" };
    transport.write(LogLevel.INFO, "User logged in", metadata);
    expect(mockConsoleLog).toHaveBeenCalledWith("User logged in");
  });

  it("should handle empty messages", () => {
    transport.write(LogLevel.INFO, "");
    expect(mockConsoleLog).toHaveBeenCalledWith("");
  });

  it("should handle special characters", () => {
    const message = 'Message with "quotes" and symbols: @#$%^&*()';
    transport.write(LogLevel.INFO, message);
    expect(mockConsoleLog).toHaveBeenCalledWith(message);
  });
});

describe("FileTransport", () => {
  let transport: FileTransport;
  const testLogFile = join(__dirname, "test.log");

  beforeEach(() => {
    transport = new FileTransport(testLogFile);
    // Clean up test file if it exists
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
  });

  afterEach(() => {
    // Clean up test file after each test
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
  });

  it("should create log file if it does not exist", () => {
    expect(existsSync(testLogFile)).toBe(false);
    transport.write(LogLevel.INFO, "Test message");
    expect(existsSync(testLogFile)).toBe(true);
  });

  it("should write message to file with timestamp", () => {
    transport.write(LogLevel.INFO, "Test message");

    const content = readFileSync(testLogFile, "utf-8");
    expect(content).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Test message\n$/
    );
  });

  it("should append to existing file", () => {
    transport.write(LogLevel.INFO, "First message");
    transport.write(LogLevel.ERROR, "Second message");

    const content = readFileSync(testLogFile, "utf-8");
    expect(content).toContain("First message");
    expect(content).toContain("Second message");
    expect(content.split("\n").length).toBe(3); // 2 messages + empty line at end
  });

  it("should handle all log levels", () => {
    transport.write(LogLevel.ERROR, "Error message");
    transport.write(LogLevel.WARN, "Warning message");
    transport.write(LogLevel.INFO, "Info message");
    transport.write(LogLevel.DEBUG, "Debug message");
    transport.write(LogLevel.TRACE, "Trace message");

    const content = readFileSync(testLogFile, "utf-8");
    expect(content).toContain("Error message");
    expect(content).toContain("Warning message");
    expect(content).toContain("Info message");
    expect(content).toContain("Debug message");
    expect(content).toContain("Trace message");
  });

  it("should handle metadata parameter", () => {
    const metadata = { userId: "123", action: "login" };
    transport.write(LogLevel.INFO, "User logged in", metadata);

    const content = readFileSync(testLogFile, "utf-8");
    expect(content).toContain("User logged in");
  });

  it("should fallback to console on file write error", () => {
    // Create transport with invalid path
    const invalidTransport = new FileTransport("/invalid/path/test.log");

    invalidTransport.write(LogLevel.INFO, "Test message");

    expect(mockConsoleError).toHaveBeenCalledWith(
      "Failed to write to log file:",
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith("Test message");
  });

  it("should handle empty messages", () => {
    transport.write(LogLevel.INFO, "");

    const content = readFileSync(testLogFile, "utf-8");
    expect(content).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \n$/);
  });

  it("should handle special characters and Unicode", () => {
    const message = 'Message with "quotes", émojis 🚀, and Unicode 中文';
    transport.write(LogLevel.INFO, message);

    const content = readFileSync(testLogFile, "utf-8");
    expect(content).toContain(message);
  });
});

describe("JSONTransport", () => {
  let transport: JSONTransport;
  const testLogFile = join(__dirname, "test.json");

  beforeEach(() => {
    transport = new JSONTransport(testLogFile);
    // Clean up test file if it exists
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
  });

  afterEach(() => {
    // Clean up test file after each test
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
  });

  it("should create JSON log file if it does not exist", () => {
    expect(existsSync(testLogFile)).toBe(false);
    transport.write(LogLevel.INFO, "Test message");
    expect(existsSync(testLogFile)).toBe(true);
  });

  it("should write valid JSON entries", () => {
    transport.write(LogLevel.INFO, "Test message");

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry).toHaveProperty("timestamp");
    expect(jsonEntry).toHaveProperty("level", LogLevel.INFO);
    expect(jsonEntry).toHaveProperty("message", "Test message");
    expect(jsonEntry).not.toHaveProperty("metadata");
    expect(jsonEntry.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it("should append JSON entries as separate lines", () => {
    transport.write(LogLevel.INFO, "First message");
    transport.write(LogLevel.ERROR, "Second message");

    const content = readFileSync(testLogFile, "utf-8");
    const lines = content.trim().split("\n");

    expect(lines.length).toBe(2);

    const firstEntry = JSON.parse(lines[0]);
    const secondEntry = JSON.parse(lines[1]);

    expect(firstEntry.message).toBe("First message");
    expect(firstEntry.level).toBe(LogLevel.INFO);
    expect(secondEntry.message).toBe("Second message");
    expect(secondEntry.level).toBe(LogLevel.ERROR);
  });

  it("should handle all log levels", () => {
    transport.write(LogLevel.ERROR, "Error message");
    transport.write(LogLevel.WARN, "Warning message");
    transport.write(LogLevel.INFO, "Info message");
    transport.write(LogLevel.DEBUG, "Debug message");
    transport.write(LogLevel.TRACE, "Trace message");

    const content = readFileSync(testLogFile, "utf-8");
    const lines = content.trim().split("\n");

    expect(lines.length).toBe(5);

    const entries = lines.map((line) => JSON.parse(line));
    expect(entries[0].level).toBe(LogLevel.ERROR);
    expect(entries[1].level).toBe(LogLevel.WARN);
    expect(entries[2].level).toBe(LogLevel.INFO);
    expect(entries[3].level).toBe(LogLevel.DEBUG);
    expect(entries[4].level).toBe(LogLevel.TRACE);
  });

  it("should include metadata in JSON output", () => {
    const metadata = { userId: "123", action: "login", timestamp: Date.now() };
    transport.write(LogLevel.INFO, "User logged in", metadata);

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry.metadata).toEqual(metadata);
  });

  it("should handle null metadata", () => {
    transport.write(LogLevel.INFO, "Test message", null as any);

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry.metadata).toBeNull();
  });

  it("should handle undefined metadata", () => {
    transport.write(LogLevel.INFO, "Test message", undefined);

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry.metadata).toBeUndefined();
  });

  it("should fallback to console on file write error", () => {
    // Create transport with invalid path
    const invalidTransport = new JSONTransport("/invalid/path/test.json");

    invalidTransport.write(LogLevel.INFO, "Test message");

    expect(mockConsoleError).toHaveBeenCalledWith(
      "Failed to write to JSON log file:",
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith("Test message");
  });

  it("should handle empty messages", () => {
    transport.write(LogLevel.INFO, "");

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry.message).toBe("");
  });

  it("should handle special characters and Unicode", () => {
    const message = 'Message with "quotes", émojis 🚀, and Unicode 中文';
    transport.write(LogLevel.INFO, message);

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry.message).toBe(message);
  });

  it("should handle complex metadata objects", () => {
    const complexMetadata = {
      user: { id: "123", name: "John Doe" },
      request: { method: "POST", url: "/api/users" },
      response: { status: 200, duration: 150 },
      tags: ["api", "user", "create"],
    };

    transport.write(LogLevel.INFO, "API request processed", complexMetadata);

    const content = readFileSync(testLogFile, "utf-8");
    const jsonEntry = JSON.parse(content.trim());

    expect(jsonEntry.metadata).toEqual(complexMetadata);
  });
});

describe("Transport Integration with Flog", () => {
  let logger: Flog;
  const TEST_CONFIG_PATH = join(__dirname, "test-config.json");

  beforeEach(() => {
    logger = new Flog("TestClass", undefined, TEST_CONFIG_PATH);
  });

  it("should use configured transports", () => {
    logger.info("Test message");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Test message")
    );
  });

  it("should support multiple transports", () => {
    const testLogFile = join(__dirname, "multi-transport.log");
    const testJsonFile = join(__dirname, "multi-transport.json");

    try {
      const fileTransport = new FileTransport(testLogFile);
      const jsonTransport = new JSONTransport(testJsonFile);

      logger.info("Multi-transport message", {
        transports: [new ConsoleTransport(), fileTransport, jsonTransport]
      });

      // Should appear in console
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Multi-transport message")
      );

      // Should appear in log file
      expect(existsSync(testLogFile)).toBe(true);
      const logContent = readFileSync(testLogFile, "utf-8");
      expect(logContent).toContain("Multi-transport message");

      // Should appear in JSON file
      expect(existsSync(testJsonFile)).toBe(true);
      const jsonContent = readFileSync(testJsonFile, "utf-8");
      const jsonEntry = JSON.parse(jsonContent.trim());
      expect(jsonEntry.message).toContain("Multi-transport message");
    } finally {
      // Clean up
      if (existsSync(testLogFile)) unlinkSync(testLogFile);
      if (existsSync(testJsonFile)) unlinkSync(testJsonFile);
    }
  });

  it("should respect log level filtering", () => {
    logger.trace("Trace message", { level: LogLevel.WARN });
    logger.debug("Debug message", { level: LogLevel.WARN });
    logger.info("Info message", { level: LogLevel.WARN });
    logger.warn("Warning message", { level: LogLevel.WARN });
    logger.error("Error message", { level: LogLevel.WARN });

    expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    expect(mockConsoleLog).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Warning message")
    );
    expect(mockConsoleLog).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("Error message")
    );
  });

  it("should handle transport failures gracefully", () => {
    // Create a transport that will fail
    const failingTransport = new FileTransport("/invalid/path/test.log");

    expect(() => logger.info("Test message", { transports: [failingTransport] })).not.toThrow();
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Failed to write to log file:",
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it("should pass metadata to transports", () => {
    const testJsonFile = join(__dirname, "metadata-test.json");

    try {
      const jsonTransport = new JSONTransport(testJsonFile);
      
      const metadata = { userId: "123", action: "test" };
      logger.info("Test message", { metadata, transports: [jsonTransport] });

      const content = readFileSync(testJsonFile, "utf-8");
      const jsonEntry = JSON.parse(content.trim());
      expect(jsonEntry.metadata).toEqual(metadata);
    } finally {
      if (existsSync(testJsonFile)) unlinkSync(testJsonFile);
    }
  });
});
