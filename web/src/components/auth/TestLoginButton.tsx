import { demoTestSignIn } from '@/lib/auth-demo-actions';
import { readDemoAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';

/** One-click test login. Hidden when demo auth is disabled. */
export function TestLoginButton({
  callbackUrl = '/filing',
  className,
  label = 'Enter for testing',
}: {
  callbackUrl?: string;
  className?: string;
  label?: string;
}) {
  const demo = readDemoAuth();
  if (!demo.enabled) return null;

  return (
    <form action={demoTestSignIn}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button type="submit" className={cn('ntx-btn ntx-btn-credit', className)}>
        {label}
      </button>
    </form>
  );
}
