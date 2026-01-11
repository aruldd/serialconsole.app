/**
 * Check if Web Serial API is supported in the current browser
 * @returns true if Web Serial API is available, false otherwise
 */
export function isWebSerialSupported(): boolean {
  return 'serial' in navigator && typeof navigator.serial !== 'undefined';
}

