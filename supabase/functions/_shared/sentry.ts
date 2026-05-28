const DSN = Deno.env.get('SENTRY_DSN');

export async function captureException(
  err: unknown,
  context?: { function?: string; extra?: Record<string, unknown> },
): Promise<void> {
  if (!DSN) return;
  try {
    const dsn = new URL(DSN);
    const projectId = dsn.pathname.slice(1);
    const publicKey = dsn.username;

    const message = err instanceof Error ? err.message : String(err);
    const type = err instanceof Error ? err.constructor.name : 'Error';
    const stack = err instanceof Error ? err.stack : undefined;

    await fetch(`${dsn.protocol}//${dsn.host}/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=axtor-edge/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: new Date().toISOString(),
        platform: 'javascript',
        level: 'error',
        logger: context?.function ?? 'edge-function',
        tags: context?.function ? { function: context.function } : undefined,
        exception: {
          values: [{ type, value: stack ? `${message}\n\n${stack}` : message }],
        },
        extra: context?.extra,
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Sentry nunca pode causar crash na função principal
  }
}
