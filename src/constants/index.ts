import { LineEnding } from '../types';

/**
 * Common baud rates
 */
export const COMMON_BAUD_RATES = [
  4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600
];

/**
 * Default baud rate
 */
export const DEFAULT_BAUD_RATE = 115200;

/**
 * Default line ending
 */
export const DEFAULT_LINE_ENDING: LineEnding = 'none';

/**
 * Default data format
 */
export const DEFAULT_DATA_FORMAT = 'ascii';

/**
 * Line ending option values
 */
export const LINE_ENDING_VALUES: LineEnding[] = ['none', 'cr', 'lf', 'crlf', 'custom'];

/**
 * Data format values
 */
export const DATA_FORMAT_VALUES = ['ascii', 'hex', 'decimal', 'binary', 'utf8', 'base64'] as const;

/**
 * Scroll threshold for auto-scroll detection
 */
export const AUTO_SCROLL_THRESHOLD = 10;

/**
 * Initial scroll height
 */
export const INITIAL_SCROLL_HEIGHT = 600;

/**
 * Split pane sizes (left, right)
 */
export const SPLIT_PANE_SIZES = [70, 30] as const;

/**
 * Split pane minimum size
 */
export const SPLIT_PANE_MIN_SIZE = 300;

/**
 * Split gutter size
 */
export const SPLIT_GUTTER_SIZE = 2;

