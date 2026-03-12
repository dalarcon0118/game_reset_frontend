import { ModuleLoader } from '@core/loader/module_loader';
import { ListeroModule } from '@/features/config/listero/module';

// Mock logger
jest.mock('@/shared/utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn((msg) => console.log(`[INFO] ${msg}`)),
    warn: jest.fn((msg) => console.warn(`[WARN] ${msg}`)),
    error: jest.fn((msg, tag, err) => console.error(`[ERROR] ${msg}`, err)),
    withTag: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })
  };
  return {
    logger: mockLogger,
    default: mockLogger,
    __esModule: true,
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }
}));

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('Listero Module Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset ModuleLoader state if possible, or rely on jest module isolation
    // Since ModuleLoader uses a static property, we might need to reset modules
    jest.resetModules();
  });

  it('should load ListeroModule without hanging', async () => {
    // Re-import after resetModules
    const { ModuleLoader } = require('@core/loader/module_loader');
    const { ListeroModule } = require('@/features/config/listero/module');

    console.log('Starting ListeroModule load test...');

    const loadPromise = ModuleLoader.loadModule(ListeroModule);

    // Timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Module loading timed out')), 5000)
    );

    await Promise.race([loadPromise, timeoutPromise]);

    expect(ModuleLoader.isModuleLoaded(ListeroModule.name)).toBe(true);
    console.log('ListeroModule loaded successfully');
  });
});
