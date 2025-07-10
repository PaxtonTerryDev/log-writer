# TypeScript Class-Aware Logging Rider Library

## Project Overview

Create a TypeScript logging rider library optimized for object-oriented codebases that provides clear class context in log outputs. The library should prioritize simplicity, performance, and developer experience while avoiding over-engineering.

**Target Output Format:**

```
[ERROR] [SubprocessManager:worker-1] Failed to start process
[INFO] [ApiService] Fetching user data
[DEBUG] [DatabaseManager] Connection established
```

## Core Design Principles

1. **Simplicity First**: Clean, intuitive API that works immediately without complex setup
2. **Performance Conscious**: Minimal runtime overhead, no expensive stack trace analysis
3. **Type Safe**: Full TypeScript support with proper interfaces and type checking
4. **Flexible**: Support both simple and advanced use cases without forcing complexity
5. **Testable**: Easy to mock and test in unit tests

## Architecture Decision: Interface-Based Approach

**Chosen Approach**: Interface-based logging with optional instance IDs
**Rejected Approaches**:

- Automatic stack trace analysis (performance overhead, reliability issues)
- Complex registry pattern (over-engineering, memory management complexity)

**Reasoning**: Manual class name specification provides predictable behavior, zero runtime detection overhead, and works consistently across all environments (development, production, minified builds).

## Core Feature Requirements

### 1. Primary Logging Interface

```typescript
class Log {
  constructor(className: string, instanceId?: string);

  // Standard log levels
  error(message: string, options?: LogOptions): void;
  warn(message: string, options?: LogOptions): void;
  info(message: string, options?: LogOptions): void;
  debug(message: string, options?: LogOptions): void;
  trace(message: string, options?: LogOptions): void;
}
```

### 2. Log Levels & Filtering

- **Standard Levels**: ERROR, WARN, INFO, DEBUG, TRACE
- **Configurable Filtering**: Minimum log level configuration
- **Runtime Level Changes**: Ability to change log levels without restart
- **Level-Based Color Coding**: Different colors for each log level in console output

### 3. Output Formatting

- **Structured Format**: `[LEVEL] [ClassName:instanceId] message`
- **Timestamps**: Optional timestamp inclusion
- **Color Support**: Console color coding for better readability
- **Custom Templates**: Configurable message format templates

### 4. Multiple Output Targets

- **Console Output**: Colored, human-readable format for development
- **File Logging**: Structured output for production
- **JSON Format**: Machine-readable structured logs
- **Custom Transports**: Extensible transport system

## Implementation Requirements

### Core Classes

**Log Class** (Primary Interface)

```typescript
export class Log {
  constructor(private className: string, private instanceId?: string) {}

  private formatMessage(level: LogLevel, message: string): string {
    const context = this.instanceId
      ? `${this.className}:${this.instanceId}`
      : this.className;
    return `[${level}] [${context}] ${message}`;
  }

  error(message: string, options?: LogOptions): void;
  warn(message: string, options?: LogOptions): void;
  info(message: string, options?: LogOptions): void;
  debug(message: string, options?: LogOptions): void;
  trace(message: string, options?: LogOptions): void;
}
```

**Configuration Management**

```typescript
interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colors: boolean;
  transports: Transport[];
}
```

**Transport System**

```typescript
interface Transport {
  write(level: LogLevel, message: string, metadata?: Record<string, any>): void;
}

class ConsoleTransport implements Transport;
class FileTransport implements Transport;
class JSONTransport implements Transport;
```

### Usage Patterns

**Basic Usage**

```typescript
class UserService {
  log = new Log("UserService");

  getUser(id: string) {
    this.log.info(`Fetching user ${id}`);
    this.log.debug("Database query executed");
  }
}
```

**With Instance IDs** (when multiple instances need distinction)

```typescript
class Worker {
  log = new Log("Worker", `thread-${threadId}`);

  processTask() {
    this.log.info("Processing task");
  }
}
```

**Static Method Support**

```typescript
class UtilityClass {
  private static log = new Log("UtilityClass");

  static processData() {
    this.log.info("Processing data");
  }
}
```

## Advanced Features

### 1. Configuration Management

- Environment-based presets (development/production)
- Configuration file support with hot-reload
- Per-class log level overrides
- Runtime configuration changes

### 2. Performance Optimizations

- Lazy message evaluation (only format if level will output)
- Message caching for repeated logs
- Async logging option to prevent blocking
- Efficient transport batching

### 3. Development Experience

- TypeScript-first design with full type safety
- Auto-completion support
- Source map integration for accurate line numbers
- Testing utilities and mock loggers

### 4. Production Features

- Log rotation and archival
- Structured metadata support
- Error handling and graceful degradation
- Performance metrics and monitoring

## Testing Requirements

- **Unit Test Support**: Easy mocking and test assertion utilities
- **Log Capture**: Ability to capture and inspect logs in tests
- **Deterministic Output**: Consistent formatting for snapshot testing
- **Performance Tests**: Benchmarks for throughput and memory usage

## Error Handling

- **Graceful Degradation**: Continue functioning if transports fail
- **Error Recovery**: Automatic retry mechanisms for failed log writes
- **Fallback Mechanisms**: Console fallback if primary transports fail
- **Silent Failure Prevention**: Always provide feedback on critical errors

## Package Structure

```
src/
├── core/
│   ├── log.ts      # Main Log class
│   ├── interfaces.ts     # Core interfaces (Loggable, Transport, etc.)
│   └── config.ts         # Configuration management
├── transports/
│   ├── console.ts        # Console transport
│   ├── file.ts          # File transport
│   └── json.ts          # JSON transport
├── utils/
│   ├── colors.ts        # Color utilities
│   ├── formatter.ts     # Message formatting
│   └── performance.ts   # Performance utilities
└── index.ts             # Public API exports
```

## Success Criteria

1. **Simple API**: `new Log("ClassName")` works immediately
2. **Performance**: No measurable overhead in production builds
3. **Reliability**: Consistent behavior across all JavaScript environments
4. **Type Safety**: Full TypeScript support with no `any` types in public API
5. **Testing**: 100% test coverage with comprehensive examples
6. **Documentation**: Clear examples and API documentation

## Non-Requirements

- **Automatic Class Detection**: Explicitly avoided due to performance and reliability concerns
- **Complex Registry System**: Manual instantiation preferred for simplicity
- **Binary Log Formats**: Focus on human-readable and JSON formats
- **Log Aggregation**: External systems should handle log collection
- **Authentication**: Transport-level security handled externally

## Implementation Notes

- Start with console transport and basic formatting
- Add file transport and configuration system
- Implement advanced features incrementally
- Maintain backward compatibility throughout development
- Consider performance implications of every feature addition

This specification prioritizes practical utility over theoretical completeness, focusing on solving real logging problems in TypeScript applications while maintaining code clarity and performance.
