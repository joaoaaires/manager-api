## Why

The current manual validation in `src/config/load.validation.ts` is repetitive and less robust than standard schema validation libraries. Migrating to Zod will provide better type safety, easier maintenance, and more descriptive error messages for configuration issues.

## What Changes

- Add `zod` as a project dependency.
- Refactor `src/config/load.validation.ts` to use Zod schemas instead of manual checks.
- Update the configuration loading flow to utilize Zod's parsing and error reporting.

## Capabilities

### New Capabilities
- `config-validation`: Robust validation and type-safe parsing of environment variables using Zod.

### Modified Capabilities
<!-- None -->

## Impact

- **Dependencies**: New dependency on `zod`.
- **Codebase**: Refactoring of the configuration validation layer in `src/config/load.validation.ts`.
- **Runtime**: Configuration loading will fail with Zod-formatted error messages if environment variables are missing or invalid.
