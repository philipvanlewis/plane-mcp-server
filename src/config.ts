import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(__dirname, '..', '.env') });

const schema = z.object({
  baseUrl: z.string().url(),
  workspaceSlug: z.string().min(1),
  apiKey: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof schema>;

function load(): Config {
  const result = schema.safeParse({
    baseUrl: process.env.PLANE_BASE_URL,
    workspaceSlug: process.env.PLANE_WORKSPACE_SLUG,
    apiKey: process.env.PLANE_API_KEY,
    email: process.env.PLANE_EMAIL,
    password: process.env.PLANE_PASSWORD,
    logLevel: process.env.LOG_LEVEL,
  });
  if (!result.success) {
    const missing = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Config error: ${missing}. Check .env file.`);
  }
  return result.data;
}

export const config = load();
