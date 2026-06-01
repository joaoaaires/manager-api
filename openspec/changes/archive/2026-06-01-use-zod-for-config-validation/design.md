## Context

The project currently uses manual checks in `src/config/load.validation.ts` to validate environment variables. This approach is prone to omissions and lacks the advanced features of schema validation libraries like Zod.

## Goals / Non-Goals

**Goals:**
- Replace manual validation logic with a Zod schema.
- Improve type safety for configuration variables.
- Standardize error reporting for configuration issues.

**Non-Goals:**
- Changing the actual configuration variables or their names.
- Adding complex transformations to the config at this stage.

## Decisions

### 1. Use Zod Coercion
Since environment variables are initially strings, we will use `z.coerce.number()` for numeric fields like `PORT`, `SALT`, and `JWT_EXPIRES_IN`. This allows Zod to handle the string-to-number conversion automatically.

### 2. Schema Structure
A single `envSchema` will be defined to represent all required environment variables. This provides a central place for validation logic.

### 3. Maintain Function Signature
The `loadValidation` function will keep its signature: `(env: Env) => Env`. It will parse the input `env` using the Zod schema and return the parsed (and coerced) data. If validation fails, it will throw an error with the formatted Zod issues.

## Risks / Trade-offs

- **[Risk]**: Zod's default error messages might be too verbose for simple CLI/logs.
- **[Mitigation]**: We will catch Zod errors and format them into a more concise, readable string before throwing, ensuring developers can quickly identify which variable failed.
