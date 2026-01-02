export type DataFormat = 'hex' | 'binary' | 'ascii' | 'decimal' | 'utf8' | 'base64';

export type LineEnding = 'none' | 'cr' | 'lf' | 'crlf' | 'custom';

export interface SerialMessage {
  id: string;
  type: 'sent' | 'received';
  data: Uint8Array;
  timestamp: Date;
  format: DataFormat;
  displayText: string;
  originalData?: string; // Original string data for sent messages (for resending)
}

export interface SerialConnectionConfig {
  baudRate: number;
  lineEnding: LineEnding;
  customLineEnding?: string;
}

export interface FormatConversionResult {
  bytes: Uint8Array;
  displayText: string;
  error?: string;
}

