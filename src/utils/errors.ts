export class PlaneApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public url?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'PlaneApiError';
  }
}

export class AuthenticationError extends PlaneApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export function formatErrorForMcp(error: unknown): string {
  if (error instanceof PlaneApiError) {
    let msg = `Plane API error (${error.status}): ${error.message}`;
    if (error.url) msg += ` [${error.url}]`;
    if (error.details) msg += `\n${JSON.stringify(error.details, null, 2)}`;
    return msg;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
