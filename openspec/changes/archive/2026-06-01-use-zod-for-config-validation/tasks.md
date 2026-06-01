## 1. Preparation

- [x] 1.1 Install `zod` dependency
- [x] 1.2 Verify `src/config/load.validation.ts` is ready for refactoring

## 2. Core Implementation

- [x] 2.1 Define the environment variable schema using Zod in `src/config/load.validation.ts`
- [x] 2.2 Refactor the `loadValidation` function to use `schema.safeParse` or `schema.parse`
- [x] 2.3 Implement Zod error formatting to provide readable error messages

## 3. Verification

- [x] 3.1 Test configuration loading with valid environment variables
- [x] 3.2 Test configuration loading with missing or invalid environment variables
