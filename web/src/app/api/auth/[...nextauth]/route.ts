import { handlers } from '@/lib/auth';
import { runMigrations } from '@/lib/db';

export const GET = async (...args: Parameters<typeof handlers.GET>) => {
  await runMigrations();
  return handlers.GET(...args);
};

export const POST = async (...args: Parameters<typeof handlers.POST>) => {
  await runMigrations();
  return handlers.POST(...args);
};
