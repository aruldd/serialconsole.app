import { LineEnding, DataFormat } from '../types';
import { getLineEndingBytes } from './formatConverter';
import { COMMON_BAUD_RATES, LINE_ENDING_VALUES, DATA_FORMAT_VALUES } from '../constants';

/**
 * Get line ending options with translated labels
 */
export function getLineEndingOptions(t: (key: string) => string): { value: LineEnding; label: string }[] {
  return LINE_ENDING_VALUES.map(value => ({
    value,
    label: t(`lineEndings.${value}`),
  }));
}

/**
 * Get format options with translated labels
 */
export function getFormatOptions(t: (key: string) => string): { value: DataFormat; label: string }[] {
  return DATA_FORMAT_VALUES.map(value => ({
    value: value as DataFormat,
    label: t(`formats.${value}`),
  }));
}

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

// Re-export constants
export { COMMON_BAUD_RATES };
