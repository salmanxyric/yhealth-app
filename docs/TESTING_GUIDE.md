# Senior-Level Testing Guide

## Overview

This guide outlines enterprise-grade testing practices for the YHealth application, following senior-level (15+ years) testing principles.

## Test Pyramid

```
        /\
       /E2E\         10% - End-to-End / Contract Tests
      /------\
     /Integration\   20% - Integration Tests
    /------------\
   /    Unit      \  70% - Unit Tests
  /----------------\
```

### Distribution Rules

- **70% Unit Tests**: Fast, isolated, test business logic
- **20% Integration Tests**: Test component interactions with real dependencies
- **10% Contract/E2E Tests**: Test API contracts and user flows

## Core Principles

### 1. Test Business Intent, Not Implementation

✅ **Good**: Test that meal creation validates required fields
```typescript
test('throws error when mealType is missing', async () => {
  await expect(service.createMeal('user1', { mealType: '' }))
    .rejects.toThrow('INVALID_MEAL_TYPE');
});
```

❌ **Bad**: Test internal implementation details
```typescript
test('calls dbQuery with correct SQL', () => {
  // Don't test SQL strings - test behavior
});
```

### 2. Guard Clauses as First-Class Citizens

Every guard clause should have an explicit test:

```typescript
describe('createMeal', () => {
  test('throws error for invalid userId', async () => {
    await expect(service.createMeal('', { mealType: 'breakfast' }))
      .rejects.toThrow('INVALID_USER');
  });

  test('throws error for missing mealType', async () => {
    await expect(service.createMeal('user1', { mealType: '' }))
      .rejects.toThrow('INVALID_MEAL_TYPE');
  });
});
```

### 3. Failure Paths Are Not Edge Cases

Test failure scenarios explicitly:

```typescript
describe('Failure Scenarios', () => {
  test('gracefully handles database failure', async () => {
    dbQueryMock.mockRejectedValue(new Error('DB_CONNECTION_FAILED'));
    
    await expect(service.createMeal('user1', { mealType: 'breakfast' }))
      .rejects.toThrow('DB_CONNECTION_FAILED');
  });
});
```

### 4. Deterministic Testing

- No randomness without control
- No time-dependent tests without mocking
- No network calls in unit tests
- Use `clearMocks`, `restoreMocks`, `resetMocks` in Jest config

### 5. Test Isolation

Each test should:
- Set up its own state
- Not depend on other tests
- Clean up after itself
- Use `beforeEach` to reset state

## Test Structure

### Unit Test Template

```typescript
describe('ServiceName – Unit', () => {
  let service: ServiceName;
  let mockDependency: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    mockDependency = jest.fn();
    service = new ServiceName(mockDependency);
  });

  describe('methodName', () => {
    test('describes expected behavior', async () => {
      // Arrange
      mockDependency.mockResolvedValue({ data: 'value' });

      // Act
      const result = await service.methodName('input');

      // Assert
      expect(result).toEqual({ expected: 'value' });
      expect(mockDependency).toHaveBeenCalledWith('input');
    });

    test('throws error for invalid input (guard clause)', async () => {
      await expect(service.methodName(''))
        .rejects.toThrow('INVALID_INPUT');
    });
  });

  describe('Failure Scenarios', () => {
    test('handles dependency failure gracefully', async () => {
      mockDependency.mockRejectedValue(new Error('DEPENDENCY_FAILED'));
      
      await expect(service.methodName('input'))
        .rejects.toThrow('DEPENDENCY_FAILED');
    });
  });
});
```

### Integration Test Template

```typescript
describe('ServiceName – Integration', () => {
  let service: ServiceName;
  let repository: InMemoryRepository;

  beforeAll(() => {
    repository = new InMemoryRepository();
    service = new ServiceName(repository);
  });

  beforeEach(() => {
    repository.clear(); // Clean state
  });

  test('creates and retrieves using real dependencies', async () => {
    const created = await service.create('data');
    const retrieved = await service.findById(created.id);
    
    expect(retrieved).toEqual(created);
  });
});
```

## Advanced Patterns

### Contract Testing

Test that methods always return consistent contracts:

```typescript
describe('Contract: createMeal()', () => {
  test('always returns meal object with required fields', async () => {
    const result = await service.createMeal('user1', { mealType: 'breakfast' });
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('mealType');
    expect(typeof result.id).toBe('string');
  });
});
```

### Property-Based Testing

Test invariants that should always hold:

```typescript
describe('Property-Based: Macro Calculations', () => {
  test('calculated macros are always non-negative', async () => {
    const result = await service.createMeal('user1', {
      mealType: 'lunch',
      foods: [{ calories: 100, protein: 10, carbs: 20, fat: 5 }],
    });
    
    expect(result.calories).toBeGreaterThanOrEqual(0);
    expect(result.proteinGrams).toBeGreaterThanOrEqual(0);
  });
});
```

### Failure Injection

Test how the system handles failures:

```typescript
describe('Failure Injection', () => {
  test('handles database timeout gracefully', async () => {
    dbQueryMock.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 100)
      )
    );
    
    await expect(service.createMeal('user1', { mealType: 'breakfast' }))
      .rejects.toThrow('TIMEOUT');
  });
});
```

## Jest Configuration

### Server Configuration

```javascript
// server/jest.config.js
export default {
  testEnvironment: 'node',
  clearMocks: true,        // Clear mocks between tests
  restoreMocks: true,     // Restore original implementations
  resetMocks: true,       // Reset mock state
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  errorOnDeprecated: true, // Fail on deprecated APIs
};
```

### Client Configuration

```javascript
// client/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## What Senior Engineers Do

### ✅ They Do

1. **Test business rules explicitly**
   - Every validation rule has a test
   - Every error condition is tested

2. **Design tests before features break**
   - Write tests for expected failures
   - Test edge cases proactively

3. **Enforce deterministic systems**
   - Mock time, randomness, network
   - Use controlled test data

4. **Kill flaky tests aggressively**
   - If a test is flaky, fix it immediately
   - Don't accept "works most of the time"

5. **Test failure modes as first-class citizens**
   - Database failures
   - Network timeouts
   - Invalid inputs
   - Permission errors

### ❌ They Avoid

1. **Snapshot abuse**
   - Don't use snapshots for everything
   - Use them only for complex UI structures

2. **Testing private methods**
   - Test public interfaces
   - Private methods are implementation details

3. **Over-mocking**
   - Mock only external dependencies
   - Use real implementations when possible

4. **100% coverage vanity metrics**
   - Focus on meaningful coverage
   - 85-90% with good tests > 100% with shallow tests

5. **Testing implementation details**
   - Test behavior, not how it's implemented
   - Refactoring shouldn't break tests

## Running Tests

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### All Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### CI Mode (CI/CD)
```bash
npm run test:ci
```

## Coverage Goals

- **Branches**: 85%+ (all code paths tested)
- **Functions**: 90%+ (all functions called)
- **Lines**: 90%+ (all lines executed)
- **Statements**: 90%+ (all statements executed)

## Common Pitfalls

### 1. Testing the Framework

❌ **Bad**: Testing that Express routes work
```typescript
test('route returns 200', () => {
  // Express already tests this
});
```

✅ **Good**: Testing your business logic
```typescript
test('validates meal type before creating', async () => {
  await expect(service.createMeal('user1', { mealType: 'invalid' }))
    .rejects.toThrow('INVALID_MEAL_TYPE');
});
```

### 2. Async/Await in Tests

Always use `async/await` or return promises:

```typescript
// ✅ Good
test('creates meal', async () => {
  const result = await service.createMeal('user1', { mealType: 'breakfast' });
  expect(result).toBeDefined();
});

// ❌ Bad
test('creates meal', () => {
  service.createMeal('user1', { mealType: 'breakfast' }).then(result => {
    expect(result).toBeDefined();
  });
});
```

### 3. Not Cleaning Up

Always clean up test state:

```typescript
beforeEach(() => {
  mockRepository.clear();
  jest.clearAllMocks();
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

## Questions?

If you're unsure about how to test something:

1. **What behavior am I testing?** (Not implementation)
2. **What can go wrong?** (Test failure paths)
3. **What should always be true?** (Test invariants)
4. **Is this deterministic?** (No randomness, time, network)

