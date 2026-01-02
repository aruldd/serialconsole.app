import { LineEnding } from '../types';
import { getLineEndingBytes } from './formatConverter';

/**
 * Common baud rates
 */
export const COMMON_BAUD_RATES = [
  4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600
];

/**
 * Line ending options
 */
export const LINE_ENDING_OPTIONS: { value: LineEnding; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'cr', label: 'CR (\\r)' },
  { value: 'lf', label: 'LF (\\n)' },
  { value: 'crlf', label: 'CRLF (\\r\\n)' },
  { value: 'custom', label: 'Custom' },
];

/**
 * Format options
 */
export const FORMAT_OPTIONS = [
  { value: 'ascii', label: 'ASCII' },
  { value: 'hex', label: 'Hex' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'binary', label: 'Binary' },
  { value: 'utf8', label: 'UTF-8' },
  { value: 'base64', label: 'Base64' },
];

/**
 * Append line ending to data bytes
 */
export function appendLineEnding(data: Uint8Array, lineEnding: LineEnding, custom?: string): Uint8Array {
  const endingBytes = getLineEndingBytes(lineEnding, custom);
  if (endingBytes.length === 0) {
    return data;
  }
  const result = new Uint8Array(data.length + endingBytes.length);
  result.set(data);
  result.set(endingBytes, data.length);
  return result;
}

