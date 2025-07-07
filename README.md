# LogWriter

A TypeScript class-aware logging library that provides clear context in log outputs with flexible configuration options.

`LogWriter` is designed for object-oriented codebases where understanding the source of a log message is critical. It's lightweight, performant, and easy to integrate into any project.

## Features

- **Class and Instance Context**: Explicitly associate logs with the class and even specific instances that generate them
- **Simple API**: Get started immediately with an intuitive and clean API
- **Flexible Configuration**: File-based configuration with runtime overrides
- **Multiple Transports**: Console, file, and JSON output destinations
- **Level Filtering**: Per-transport level filtering and global level controls
- **Colored Output**: Level-based color coding for improved readability in the console
- **Standard Log Levels**: Supports `error`, `warn`, `info`, `debug`, and `trace`
- **Optional Timestamps**: Add timestamps to your logs when needed
- **Customizable Output**: Control which parts of the log format are included

## Installation

*(Note: The package is not yet published to npm, but this shows the intended installation.)*

Install `LogWriter` using your favorite package manager:

```bash
npm install LogWriter
# or
pnpm add LogWriter
# or
yarn add LogWriter
```

## Quick Start

Here's how to get started with `LogWriter` in your TypeScript project.

### Basic Usage

Instantiate `LogWriter` directly in your class, providing the class name as a string.

```typescript
import { LogWriter } from 'LogWriter';

class UserService {
  private log = new LogWriter('UserService');

  getUser(id: string) {
    this.log.info(`Fetching user with id: ${id}`);
    if (!id) {
      this.log.error('User ID is missing!');
      return;
    }
    // ...
    this.log.debug('User data processed successfully.');
  }
}

const userService = new UserService();
userService.getUser('123');
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
import { LogWriter } from 'LogWriter';

class Worker {
  private log: LogWriter;

  constructor(id: string) {
    this.log = new LogWriter('Worker', id);
  }

  processTask(task: string) {
    this.log.info(`Starting task: ${task}`);
    // ...
    this.log.info(`Finished task: ${task}`);
  }
}

const worker1 = new Worker('worker-1');
const worker2 = new Worker('worker-2');

worker1.processTask('process-images');
worker2.processTask('send-emails');
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

`LogWriter` supports file-based configuration through a `LogWriter.config.json` file. The library automatically searches for this file starting from the current working directory up to the root directory.

Create a `LogWriter.config.json` file in your project root:

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | string | `"INFO"` | Minimum log level to output |
| `timestamp` | boolean | `false` | Include timestamps in log output |
| `colors` | boolean | `true` | Enable colored output |
| `includeLevel` | boolean | `true` | Include `[LEVEL]` in log output |
| `includeName` | boolean | `true` | Include `[ClassName]` in log output |
| `transports` | object | - | Named transport configurations |
| `defaultTransports` | string[] | `["console"]` | Default transports to use |

### Transport Types

#### Console Transport
```json
{
  "type": "console",
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
  "levels": {
    "include": ["ERROR", "WARN"]
  }
}
```

### Level Filtering

Each transport can have its own level filtering:

- `include`: Only output these levels
- `exclude`: Output all levels except these

Note: `include` and `exclude` are mutually exclusive.

### Runtime Configuration

You can override configuration at runtime using the `setConfig` method:

```typescript
const log = new LogWriter('MyClass');

// Override configuration for this logger instance
log.setConfig({
  includeLevel: false,
  includeName: false,
  timestamp: true
});

log.info('This is a minimal log'); // Output: 2025-07-07T12:00:00.000Z This is a minimal log
```

## API

### `new LogWriter(className: string, instanceId?: string, configPath?: string)`

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
  level?: LogLevel;              // Override minimum level check
  colors?: boolean;              // Override color usage
  transports?: (Transport | string)[];  // Override transports
  format?: string;               // Override message format
}
```

### Examples with Options

**With Timestamp:**
```typescript
const log = new LogWriter('MyClass');
log.info('This is a timed log entry.', { timestamp: true });
// Output: 2025-07-07T12:00:00.000Z [INFO] [MyClass] This is a timed log entry.
```

**With Metadata:**
```typescript
log.error('Database connection failed', {
  metadata: { host: 'localhost', port: 5432, retries: 3 }
});
```

**With Custom Format:**
```typescript
log.info('Custom message', {
  format: '{timestamp} - {level}: {message} ({context})'
});
```

**With Specific Transports:**
```typescript
log.error('Critical error', {
  transports: ['console', 'errors']  // Only output to these transports
});
```

### Configuration Methods

```typescript
// Get current configuration
const config = log.getConfig();

// Update configuration
log.setConfig({ includeLevel: false });

// Set default transports
log.setDefaultTransports(['console', 'file']);

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


### Multiple Transport Example

```typescript
const log = new LogWriter('PaymentService');

// Critical errors go to multiple destinations
log.error('Payment processing failed', {
  transports: ['console', 'errors', 'audit'],
  metadata: { orderId: '12345', amount: 99.99 }
});

// Debug info only to console
log.debug('Payment validation passed', {
  transports: ['console']
});
```

## TypeScript Support

`LogWriter` is built with TypeScript and provides full type safety:

```typescript
import { LogWriter, LogLevel, LogOptions } from 'LogWriter';

const log = new LogWriter('TypedService');

// All methods are fully typed
const options: LogOptions = {
  timestamp: true,
  metadata: { userId: 123 },
  level: LogLevel.DEBUG
};

log.info('Typed message', options);
```

## Testing

When testing code that uses `LogWriter`, you can easily mock the logger:

```typescript
import { LogWriter } from 'LogWriter';

// Mock all log methods
const mockLog = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn()
} as unknown as LogWriter;

// Use in your tests
class TestService {
  constructor(private log: LogWriter = mockLog) {}
}
```

## License

ISC
