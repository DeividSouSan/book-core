// Canonical UUID shape: 8-4-4-4-12 hexadecimal characters (any version).
// Named so validation code reads as intent instead of an inline regex.
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
