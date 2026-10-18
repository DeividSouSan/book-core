// Runs the action and returns the thrown error (or undefined when nothing was
// thrown) so tests can assert on the error type, code, and context fields.
export function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}
