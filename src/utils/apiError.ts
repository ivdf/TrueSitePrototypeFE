/**
 * Extracts a clean, human-readable error message from any FastAPI error response.
 * Handles: strings, arrays of Pydantic validation errors, and plain objects.
 */
export function parseApiError(detail: any): string {
  if (!detail) return 'An unexpected error occurred.';

  // Plain string
  if (typeof detail === 'string') return detail;

  // Pydantic 422 validation array: [{ loc, msg, type }]
  if (Array.isArray(detail)) {
    return detail
      .map((err: any) => {
        const field = err.loc
          ? err.loc.filter((l: any) => l !== 'body').join(' → ')
          : '';
        const msg = err.msg || 'Invalid value';
        return field ? `${field}: ${msg}` : msg;
      })
      .join('\n');
  }

  // Object with a message field
  if (typeof detail === 'object' && detail.message) return detail.message;

  // Fallback
  return JSON.stringify(detail);
}
