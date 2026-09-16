import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_PRIVATE_KEY_PATH: z.string().min(1),
  JWT_PUBLIC_KEY_PATH: z.string().min(1),
  JWT_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(2592000),
});

export type Env = z.infer<typeof schema>;

// The service refuses to start on a missing or malformed var rather than
// failing at 3am (CLAUDE.md §9).
export function validateEnv(config: Record<string, unknown>): Env {
  return schema.parse(config);
}
