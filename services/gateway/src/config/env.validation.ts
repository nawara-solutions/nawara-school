// Env vars are validated at boot; the service refuses to start on a missing
// or malformed var rather than failing at 3am (CLAUDE.md §9).
// TODO: define a schema (e.g. zod/Joi) covering this service's required vars.
