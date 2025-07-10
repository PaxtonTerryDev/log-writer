# LogRider

The name is inspired by Hog Rider, the best Clash of Clans troop. Also, the name `Log` was already taken. Don't worry though, I named everything else normally!

A TypeScript class-aware logging library that provides clear context in log outputs with flexible configuration options.

`Log` is designed for object-oriented codebases where understanding the source of a log message is critical. It's lightweight, performant, and easy to integrate into any project.

## Features

- **Class and Instance Context**: Explicitly associate logs with the class and even specific instances that generate them
- **Simple API**: Get started immediately with an intuitive and clean API
- **Flexible Configuration**: File-based configuration with runtime overrides
- **Multiple Transports**: Console, file, JSON, and rotating log destinations
- **Log Rotation & Archiving**: Automatic file rotation with size or date-based strategies, compression, and retention policies
- **Level Filtering**: Per-transport level filtering and global level controls
- **Colored Output**: Level-based color coding with per-transport color configuration
- **Standard Log Levels**: Supports `error`, `warn`, `info`, `debug`, and `trace`
- **Optional Timestamps**: Add timestamps to your logs when needed
- **Customizable Output**: Control which parts of the log format are included
- **Production Ready**: Built-in safeguards prevent disk space issues with intelligent log management

## Installation

Install `Log` using your favorite package manager:

```bash
npm install logrider
npm install logrider
# or
pnpm add logrider
pnpm add logrider
# or
yarn add logrider
yarn add logrider
```

## Quick Start

Here's how to get started with `Log` in your TypeScript project.

### Basic Usage

Instantiate `Log` directly in your class, providing the class name as a string.

```typescript
import { Log } from "Log";

class UserService {
  private log = new Log("UserService");

  getUser(id: string) {
    this.log.info(`Fetching user with id: ${id}`);
    if (!id) {
      this.log.error("User ID is missing!");
      return;
    }
    // ...
    this.log.debug("User data processed successfully.");
  }
}

const userService = new UserService();
userService.getUser("123");
```

### Log Output

The code above will produce the following output in your console:

```
[INFO] [UserService] Fetching user with id: 123
[DEBUG] [UserService] User data processed successfully.
```

### Usage with Instance IDs

If you have multiple instances of a class and need to differentiate their logs, you can provide an optional `instanceId` as the second argument.

```typescript
import { Log } from "Log";

class Worker {
  private log: Log;

  constructor(id: string) {
    this.log = new Log("Worker", id);
  }

  processTask(task: string) {
    this.log.info(`Starting task: ${task}`);
    // ...
    this.log.info(`Finished task: ${task}`);
  }
}

const worker1 = new Worker("worker-1");
const worker2 = new Worker("worker-2");

worker1.processTask("process-images");
worker2.processTask("send-emails");
```

This will result in a clear, instance-specific log output:

```
[INFO] [Worker:worker-1] Starting task: process-images
[INFO] [Worker:worker-1] Finished task: process-images
[INFO] [Worker:worker-2] Starting task: send-emails
[INFO] [Worker:worker-2] Finished task: send-emails
```

## Configuration

### File-Based Configuration

`Log` supports file-based configuration through a `logrider.config.json` file. The library automatically searches for this file starting from the current working directory up to the root directory.

Create a `logrider.config.json` file in your project root:

```json
{
  "level": "INFO",
  "timestamp": false,
  "colors": true,
  "includeLevel": true,
  "includeName": true,
  "transports": {
    "console": {
      "type": "console"
    },
    "errors": {
      "type": "file",
      "path": "./logs/errors.log",
      "levels": {
        "include": ["ERROR", "WARN"]
      }
    },
    "audit": {
      "type": "json",
      "path": "./logs/audit.json",
      "levels": {
        "exclude": ["DEBUG", "TRACE"]
      }
    }
  },
  "defaultTransports": ["console", "audit"]
}
```

### Configuration Options

| Option              | Type     | Default       | Description                         |
| ------------------- | -------- | ------------- | ----------------------------------- |
| `level`             | string   | `"INFO"`      | Minimum log level to output         |
| `timestamp`         | boolean  | `false`       | Include timestamps in log output    |
| `colors`            | boolean  | `true`        | Enable colored output               |
| `includeLevel`      | boolean  | `true`        | Include `[LEVEL]` in log output     |
| `includeName`       | boolean  | `true`        | Include `[ClassName]` in log output |
| `transports`        | object   | -             | Named transport configurations      |
| `defaultTransports` | string[] | `["console"]` | Default transports to use           |
| Option              | Type     | Default       | Description                         |
| ------------------- | -------- | ------------- | ----------------------------------- |
| `level`             | string   | `"INFO"`      | Minimum log level to output         |
| `timestamp`         | boolean  | `false`       | Include timestamps in log output    |
| `colors`            | boolean  | `true`        | Enable colored output               |
| `includeLevel`      | boolean  | `true`        | Include `[LEVEL]` in log output     |
| `includeName`       | boolean  | `true`        | Include `[ClassName]` in log output |
| `transports`        | object   | -             | Named transport configurations      |
| `defaultTransports` | string[] | `["console"]` | Default transports to use           |

### Environment-Based Configuration

LogRider supports environment-specific configurations using the `LOGRIDER_ENV` environment variable. This allows you to have different logging configurations for development, staging, and production environments.

#### Basic Environment Configuration

Create a `logrider.config.json` file with environment-specific sections:

```json
{
  "level": "INFO",
  "timestamp": false,
  "colors": true,
  "transports": {
    "console": {
      "type": "console"
    }
  },
  "defaultTransports": ["console"],
  "development": {
    "level": "DEBUG",
    "timestamp": true,
    "colors": true,
    "transports": {
      "console": {
        "type": "console"
      },
      "debug": {
        "type": "file",
        "path": "./logs/debug.log"
      }
    },
    "defaultTransports": ["console", "debug"]
  },
  "production": {
    "level": "WARN",
    "timestamp": true,
    "colors": false,
    "transports": {
      "console": {
        "type": "console",
        "colors": false
      },
      "app-logs": {
        "type": "log",
        "path": "./logs/app.log",
        "method": "size",
        "maxSize": "50MB",
        "maxFiles": 10,
        "archive": {
          "enabled": true,
          "directory": "./logs/archive",
          "compress": true,
          "retentionDays": 90
        }
      },
      "error-logs": {
        "type": "log",
        "path": "./logs/errors.log",
        "method": "date",
        "dateFormat": "YYYY-MM-DD",
        "maxFiles": 365,
        "levels": {
          "include": ["ERROR", "WARN"]
        },
        "archive": {
          "enabled": true,
          "directory": "./logs/archive/errors",
          "compress": true,
          "retentionDays": 365
        }
      }
    },
    "defaultTransports": ["console", "app-logs", "error-logs"]
  }
}
```

#### Environment Usage

Set the `LOGRIDER_ENV` environment variable to specify which environment configuration to use:

```bash
# Use development configuration
export LOGRIDER_ENV=development
node app.js

# Use production configuration  
export LOGRIDER_ENV=production
node app.js

# Use root configuration (default behavior)
unset LOGRIDER_ENV
node app.js
```

#### How Environment Configuration Works

1. **Environment Detection**: LogRider checks the `LOGRIDER_ENV` environment variable
2. **Configuration Merging**: If an environment is specified and exists in the config:
   - The environment-specific configuration is merged with the root configuration
   - Environment-specific settings take precedence over root settings
   - Other environment sections are ignored
3. **Fallback Behavior**: If no environment is specified or the environment doesn't exist:
   - Uses the root configuration (backward compatible)
   - Warns if specified environment is not found

#### Environment Configuration Examples

**Development Environment:**
- Debug-level logging enabled
- Timestamps included for better debugging
- Additional debug file transport
- Colored console output

**Production Environment:**
- Warning-level logging only
- Structured logging with rotation
- Separate error log files
- No colored output for cleaner logs
- Automatic archiving and compression

**Staging Environment:**
```json
{
  "staging": {
    "level": "INFO",
    "timestamp": true,
    "colors": false,
    "transports": {
      "console": {
        "type": "console"
      },
      "staging-logs": {
        "type": "log",
        "path": "./logs/staging.log",
        "method": "size",
        "maxSize": "25MB",
        "maxFiles": 5
      }
    },
    "defaultTransports": ["console", "staging-logs"]
  }
}
```

This environment-based configuration system allows you to:
- Maintain a single configuration file for all environments
- Keep development settings verbose and production settings minimal
- Easily switch between environments without code changes
- Maintain backward compatibility with existing configurations

### Transport Types

#### Console Transport

```json
{
  "type": "console",
  "colors": true,
  "levels": {
    "include": ["ERROR", "WARN", "INFO"]
  }
}
```

#### File Transport

```json
{
  "type": "file",
  "path": "./logs/app.log",
  "colors": false,
  "levels": {
    "exclude": ["DEBUG", "TRACE"]
  }
}
```

#### JSON Transport

```json
{
  "type": "json",
  "path": "./logs/structured.json",
  "colors": false,
  "levels": {
    "include": ["ERROR", "WARN"]
  }
}
```

#### Log Transport (Rotating Files)

The `log` transport provides automatic file rotation, archiving, and intelligent log management - perfect for production applications.

**Size-based Rotation:**

```json
{
  "type": "log",
  "path": "./logs/app.log",
  "method": "size",
  "maxSize": "10MB",
  "maxFiles": 5,
  "colors": false,
  "archive": {
    "enabled": true,
    "directory": "./logs/archive",
    "compress": true,
    "retentionDays": 30
  }
}
```

**Date-based Rotation:**

```json
{
  "type": "log",
  "path": "./logs/daily.log",
  "method": "date",
  "dateFormat": "YYYY-MM-DD",
  "maxFiles": 30,
  "colors": false,
  "archive": {
    "enabled": true,
    "directory": "./logs/archive/daily",
    "compress": true,
    "retentionDays": 90
  }
}
```

**Log Transport Options:**

| Option                  | Type                 | Default                     | Description                                                               |
| ----------------------- | -------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `method`                | `"size"` \| `"date"` | -                           | **Required.** Rotation strategy                                           |
| `maxSize`               | string               | `"10MB"`                    | Maximum file size (for size method)                                       |
| `maxFiles`              | number               | `5`                         | Number of rotated files to keep                                           |
| `dateFormat`            | string               | `"YYYY-MM-DD"`              | Date format for rotation (`"YYYY-MM-DD"`, `"YYYY-MM-DD-HH"`, `"YYYY-MM"`) |
| `archive.enabled`       | boolean              | `true`                      | Enable archiving of rotated files                                         |
| `archive.directory`     | string               | `"./logs/{transport-name}"` | Directory for archived files                                              |
| `archive.compress`      | boolean              | `true`                      | Compress archived files with gzip                                         |
| `archive.retentionDays` | number               | `30`                        | Days to keep archived files (0 = forever)                                 |

**Why Use Log Transport?**

- **Prevents disk space issues** - Automatic rotation prevents unbounded file growth
- **Production ready** - Handles compression, archiving, and cleanup automatically
- **Developer friendly** - Sensible defaults work out of the box
- **Configurable** - Fine-tune rotation, compression, and retention policies

### Level Filtering

Each transport can have its own level filtering:

- `include`: Only output these levels
- `exclude`: Output all levels except these

Note: `include` and `exclude` are mutually exclusive.

### Color Configuration

Each transport can have its own color configuration, allowing you to enable colors for console output while disabling them for file outputs:

```json
{
  "transports": {
    "console": {
      "type": "console",
      "colors": true
    },
    "file": {
      "type": "file",
      "path": "./logs/app.log",
      "colors": false
    },
    "coloredFile": {
      "type": "file",
      "path": "./logs/debug.log",
      "colors": true
    }
  }
}
```

**Default Color Settings:**

- **Console transport**: `colors: true` (enabled by default)
- **File transport**: `colors: false` (disabled by default)
- **JSON transport**: `colors: false` (disabled by default)
- **Log transport**: `colors: false` (disabled by default)

**Custom Color Configuration:**
You can also specify custom colors for each log level:

```json
{
  "transports": {
    "console": {
      "type": "console",
      "colors": {
        "ERROR": "red",
        "WARN": "yellow",
        "INFO": "blue",
        "DEBUG": "green",
        "TRACE": "gray"
      }
    }
  }
}
```

### Runtime Configuration

You can override configuration at runtime using the `setConfig` method:

```typescript
const log = new Log("MyClass");

// Override configuration for this logger instance
log.setConfig({
  includeLevel: false,
  includeName: false,
  timestamp: true,
  timestamp: true,
});

log.info("This is a minimal log"); // Output: 2025-07-07T12:00:00.000Z This is a minimal log
```

## API

### `new Log(className: string, instanceId?: string, configPath?: string)`

Creates a new logger instance.

- `className`: The name of the class or context for the logger
- `instanceId` (optional): A unique identifier for the instance
- `configPath` (optional): Custom path to configuration file

### Log Methods

All log methods have the same signature: `(message: string, options?: LogOptions) => void`.

- `log.error(message, options)`
- `log.warn(message, options)`
- `log.info(message, options)`
- `log.debug(message, options)`
- `log.trace(message, options)`

### Log Options

You can pass an options object as the second argument to any log method.

```typescript
interface LogOptions {
  timestamp?: boolean;
  metadata?: Record<string, any>;
  level?: LogLevel; // Override minimum level check
  colors?: boolean; // Override color usage
  transports?: (Transport | string)[]; // Override transports
  format?: string; // Override message format
  includeLevel?: boolean; // Override includeLevel from config
  includeName?: boolean; // Override includeName from config
}
```

### Examples with Options

**With Timestamp:**

```typescript
const log = new Log("MyClass");
log.info("This is a timed log entry.", { timestamp: true });
// Output: 2025-07-07T12:00:00.000Z [INFO] [MyClass] This is a timed log entry.
```

**With Metadata:**

```typescript
log.error("Database connection failed", {
  metadata: { host: "localhost", port: 5432, retries: 3 },
});
```

**With Custom Format:**

```typescript
log.info("Custom message", {
  format: "{timestamp} - {level}: {message} ({context})",
});
```

**With Specific Transports:**

```typescript
log.error("Critical error", {
  transports: ["console", "errors"], // Only output to these transports
});
```

### Configuration Methods

```typescript
// Get current configuration
const config = log.getConfig();

// Update configuration
log.setConfig({ includeLevel: false });

// Set default transports
log.setDefaultTransports(["console", "file"]);

// Get transport names
const transports = log.getTransportNames();
```

## Output Format Examples

### Standard Format

```
[INFO] [UserService] Fetching user data
```

### With Timestamp

```
2025-07-07T12:00:00.000Z [INFO] [UserService] Fetching user data
```

### With Instance ID

```
[INFO] [Worker:thread-1] Processing task
```

### Without Level (includeLevel: false)

```
[UserService] Fetching user data
```

### Without Name (includeName: false)

```
[INFO] Fetching user data
```

### Minimal Format (both disabled)

```
Fetching user data
```

## Advanced Usage

### Production Configuration Example

Here's a comprehensive configuration suitable for production applications:

```json
{
  "level": "INFO",
  "timestamp": true,
  "colors": false,
  "transports": {
    "console": {
      "type": "console",
      "colors": true,
      "levels": {
        "include": ["ERROR", "WARN", "INFO"]
      }
    },
    "app-logs": {
      "type": "log",
      "path": "./logs/app.log",
      "method": "size",
      "maxSize": "50MB",
      "maxFiles": 10,
      "colors": false,
      "archive": {
        "enabled": true,
        "directory": "./logs/archive",
        "compress": true,
        "retentionDays": 90
      }
    },
    "error-logs": {
      "type": "log",
      "path": "./logs/errors.log",
      "method": "date",
      "dateFormat": "YYYY-MM-DD",
      "maxFiles": 365,
      "colors": false,
      "levels": {
        "include": ["ERROR", "WARN"]
      },
      "archive": {
        "enabled": true,
        "directory": "./logs/archive/errors",
        "compress": true,
        "retentionDays": 365
      }
    },
    "audit": {
      "type": "json",
      "path": "./logs/audit.json",
      "colors": false,
      "levels": {
        "exclude": ["DEBUG", "TRACE"]
      }
    }
  },
  "defaultTransports": ["console", "app-logs", "error-logs"]
}
```

### Multiple Transport Example

```typescript
const log = new Log("PaymentService");

// Critical errors go to multiple destinations
log.error("Payment processing failed", {
  transports: ["console", "errors", "audit"],
  metadata: { orderId: "12345", amount: 99.99 },
});

// Debug info only to console
log.debug("Payment validation passed", {
  transports: ["console"],
});
```

### Programmatic Color Configuration

```typescript
import { Log, ConsoleTransport, FileTransport } from "Log";

// Create transports with different color settings
const consoleTransport = new ConsoleTransport("console", undefined, true);
const fileTransport = new FileTransport("./app.log", "file", undefined, false);
const coloredFileTransport = new FileTransport(
  "./debug.log",
  "coloredFile",
  undefined,
  true
);

const log = new Log("MyService");

// Update configuration to use custom transports
log.setConfig({
  ...log.getConfig(),
  transports: {
    console: consoleTransport,
    file: fileTransport,
    coloredFile: coloredFileTransport,
  },
});

// Console output will have colors, file output won't
log.setDefaultTransports(["console", "file"]);
log.info("This message shows colors in console but not in file");
```

## TypeScript Support

`Log` is built with TypeScript and provides full type safety:

```typescript
import { Log, LogLevel, LogOptions, LogTransport, RotationMethod } from "Log";

const log = new Log("TypedService");

// All methods are fully typed
const options: LogOptions = {
  timestamp: true,
  metadata: { userId: 123 },
  level: LogLevel.DEBUG,
  level: LogLevel.DEBUG,
};

log.info("Typed message", options);

// You can also use LogTransport directly for programmatic configuration
const rotatingTransport = new LogTransport("./logs/app.log", {
  method: RotationMethod.SIZE,
  maxSize: "10MB",
  maxFiles: 5,
  archiveDir: "./logs/archive",
  compress: true,
  retentionDays: 30,
});
```

## Testing

When testing code that uses `Log`, you can easily mock the logger:

```typescript
import { Log } from "Log";

// Mock all log methods
const mockLog = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
} as unknown as Log;

// Use in your tests
class TestService {
  constructor(private log: Log = mockLog) {}
}
```

## License

ISC
