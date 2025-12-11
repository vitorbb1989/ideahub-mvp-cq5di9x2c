import { Logger, LoggerService } from '@nestjs/common';

// ============================================
// Logger Mock
// ============================================

export interface MockLogger {
  log: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  verbose: jest.Mock;
  fatal?: jest.Mock;
  setContext?: jest.Mock;
}

export const createMockLogger = (): MockLogger => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  fatal: jest.fn(),
  setContext: jest.fn(),
});

// ============================================
// Winston Logger Mock (for nest-winston)
// ============================================

export interface MockWinstonLogger extends MockLogger {
  info: jest.Mock;
}

export const createMockWinstonLogger = (): MockWinstonLogger => ({
  ...createMockLogger(),
  info: jest.fn(),
});

// ============================================
// Logger Service Mock
// ============================================

export const createMockLoggerService = (): LoggerService => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  fatal: jest.fn(),
  setLogLevels: jest.fn(),
});

// ============================================
// Spy on Logger
// ============================================

export const spyOnLogger = () => {
  const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  const verboseSpy = jest.spyOn(Logger.prototype, 'verbose').mockImplementation();

  return {
    logSpy,
    errorSpy,
    warnSpy,
    debugSpy,
    verboseSpy,
    restoreAll: () => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      debugSpy.mockRestore();
      verboseSpy.mockRestore();
    },
  };
};

// ============================================
// WINSTON_MODULE_NEST_PROVIDER Mock
// ============================================

export const WINSTON_MODULE_NEST_PROVIDER = 'WINSTON_MODULE_NEST_PROVIDER';

export const mockWinstonProvider = {
  provide: WINSTON_MODULE_NEST_PROVIDER,
  useValue: createMockWinstonLogger(),
};
