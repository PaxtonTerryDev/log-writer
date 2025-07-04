# flog

A simple, class-aware logging library for TypeScript projects that prioritizes clear context in log outputs.

`flog` is designed for object-oriented codebases where understanding the source of a log message is critical. It's lightweight, has no dependencies outside of `chalk` for coloring, and is easy to integrate into any project.

## Features

-   **Class and Instance Context**: Explicitly associate logs with the class and even specific instances that generate them.
-   **Simple API**: Get started immediately with an intuitive and clean API.
-   **Colored Output**: Level-based color coding for improved readability in the console.
-   **Standard Log Levels**: Supports `error`, `warn`, `info`, `debug`, and `trace`.
-   **Optional Timestamps**: Add timestamps to your logs when needed.

## Installation

*(Note: The package is not yet published to npm, but this shows the intended installation.)*

Install `flog` using your favorite package manager:

```bash
npm install flog
# or
pnpm add flog
# or
yarn add flog
```

## Quick Start

Here's how to get started with `flog` in your TypeScript project.

### Basic Usage

Instantiate `Flog` directly in your class, providing the class name as a string.

```typescript
import { Flog } from 'flog';

class UserService {
  private log = new Flog('UserService');

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
import { Flog } from 'flog';

class Worker {
  private log: Flog;

  constructor(id: string) {
    this.log = new Flog('Worker', id);
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

## API

### `new Flog(className: string, instanceId?: string)`

Creates a new logger instance.

-   `className`: The name of the class or context for the logger.
-   `instanceId` (optional): A unique identifier for the instance.

### Log Methods

All log methods have the same signature: `(message: string, options?: LogOptions) => void`.

-   `log.error(message, options)`
-   `log.warn(message, options)`
-   `log.info(message, options)`
-   `log.debug(message, options)`
-   `log.trace(message, options)`

### Log Options

You can pass an options object as the second argument to any log method.

```typescript
interface LogOptions {
  timestamp?: boolean;
}
```

**Example with Timestamp:**

```typescript
const log = new Flog('MyClass');
log.info('This is a timed log entry.', { timestamp: true });
```

**Output:**

```
2025-07-02T12:00:00.000Z [INFO] [MyClass] This is a timed log entry.
```

## Configuration and Transports

`flog` supports multiple output targets through its transport system. You can configure where your logs are written and how they're formatted.

### Default Configuration

By default, `flog` uses console output with colored messages. You can access the global configuration through the `LoggerConfigManager`.

```typescript
import { LoggerConfigManager, LogLevel } from 'flog';

const configManager = LoggerConfigManager.getInstance();

// Set minimum log level
configManager.setLevel(LogLevel.INFO);

// Enable/disable timestamps globally
configManager.setTimestamp(true);

// Enable/disable colors
configManager.setColors(false);
```

### Available Transports

`flog` includes three built-in transport types:

#### Console Transport
Outputs logs to the console with optional color coding.

```typescript
import { ConsoleTransport } from 'flog';

const consoleTransport = new ConsoleTransport();
```

#### File Transport
Writes logs to a file with timestamps.

```typescript
import { FileTransport } from 'flog';

const fileTransport = new FileTransport('./logs/app.log');
```

#### JSON Transport
Writes structured JSON logs to a file, perfect for log analysis tools.

```typescript
import { JSONTransport } from 'flog';

const jsonTransport = new JSONTransport('./logs/app.json');
```

### Configuring Multiple Transports

You can configure multiple transports to write logs to different destinations simultaneously.

```typescript
import { LoggerConfigManager, ConsoleTransport, FileTransport, JSONTransport } from 'flog';

const configManager = LoggerConfigManager.getInstance();

// Configure multiple transports
configManager.setTransports([
  new ConsoleTransport(),
  new FileTransport('./logs/app.log'),
  new JSONTransport('./logs/app.json')
]);
```

### Advanced Configuration Example

```typescript
import { Flog, LoggerConfigManager, LogLevel, ConsoleTransport, FileTransport, JSONTransport } from 'flog';

// Configure the logger globally
const configManager = LoggerConfigManager.getInstance();
configManager.setLevel(LogLevel.DEBUG);
configManager.setTimestamp(true);
configManager.setTransports([
  new ConsoleTransport(),
  new FileTransport('./logs/application.log'),
  new JSONTransport('./logs/structured.json')
]);

// Use in your classes
class ApiService {
  private log = new Flog('ApiService');

  async fetchData(endpoint: string) {
    this.log.info(`Fetching data from ${endpoint}`);
    
    try {
      // Simulate API call
      this.log.debug('Making HTTP request');
      const data = await fetch(endpoint);
      this.log.info('Data fetched successfully', { 
        metadata: { endpoint, status: data.status }
      });
    } catch (error) {
      this.log.error(`Failed to fetch data: ${error.message}`);
    }
  }
}
```

### Log Output Examples

With the above configuration, a single log call will produce:

**Console Output:**
```
2025-07-02T12:00:00.000Z [INFO] [ApiService] Fetching data from /api/users
```

**File Output (application.log):**
```
2025-07-02T12:00:00.000Z [INFO] [ApiService] Fetching data from /api/users
2025-07-02T12:00:00.123Z [DEBUG] [ApiService] Making HTTP request
2025-07-02T12:00:00.456Z [INFO] [ApiService] Data fetched successfully
```

**JSON Output (structured.json):**
```json
{"timestamp":"2025-07-02T12:00:00.000Z","level":"INFO","message":"[INFO] [ApiService] Fetching data from /api/users"}
{"timestamp":"2025-07-02T12:00:00.123Z","level":"DEBUG","message":"[DEBUG] [ApiService] Making HTTP request"}
{"timestamp":"2025-07-02T12:00:00.456Z","level":"INFO","message":"[INFO] [ApiService] Data fetched successfully","metadata":{"endpoint":"/api/users","status":200}}
```

### Transport Error Handling

All transports include built-in error handling with console fallback. If a file transport fails to write (e.g., due to permissions), it will automatically fall back to console output.

```typescript
// This will fallback to console if the file path is invalid
const fileTransport = new FileTransport('/invalid/path/app.log');
```
