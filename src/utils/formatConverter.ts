import { DataFormat, FormatConversionResult } from '../types';

/**
 * Convert input string to bytes based on format
 */
export function stringToBytes(input: string, format: DataFormat): FormatConversionResult {
  try {
    let bytes: Uint8Array;
    let displayText: string;

    switch (format) {
      case 'hex':
        // Support both 0x prefix format and plain hex
        // Examples: "0xFF 0x00 0x1A" or "FF 00 1A" or "0xFF001A"
        let hexValues: number[] = [];
        
        // Check if input contains 0x prefixes
        if (input.includes('0x') || input.includes('0X')) {
          // Parse 0x prefixed values (case insensitive)
          const hexPattern = /0[xX]([0-9a-fA-F]+)/g;
          let match;
          while ((match = hexPattern.exec(input)) !== null) {
            const hexStr = match[1];
            // Each hex value can be any length, we'll split into bytes
            // Pad to even length if needed
            const paddedHex = hexStr.length % 2 === 0 ? hexStr : '0' + hexStr;
            // Split into byte pairs
            for (let i = 0; i < paddedHex.length; i += 2) {
              const byteStr = paddedHex.substr(i, 2);
              hexValues.push(parseInt(byteStr, 16));
            }
          }
          
          if (hexValues.length === 0) {
            return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid hex format with 0x prefix' };
          }
        } else {
          // Original format: space-separated or continuous hex
          const hexClean = input.replace(/\s+/g, '').toLowerCase();
          if (!/^[0-9a-f]*$/.test(hexClean)) {
            return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid hex format' };
          }
          if (hexClean.length % 2 !== 0) {
            return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid hex format (odd number of hex digits)' };
          }
          hexValues = hexClean.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
        }
        
        bytes = new Uint8Array(hexValues);
        displayText = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
        break;

      case 'binary':
        // Support both 0b prefix format and plain binary
        // Examples: "0b11111111 0b00000000" or "11111111 00000000" or "0b1111111100000000"
        let binaryValues: number[] = [];
        
        // Check if input contains 0b prefixes
        if (input.includes('0b') || input.includes('0B')) {
          // Parse 0b prefixed values (case insensitive)
          const binaryPattern = /0[bB]([01]+)/g;
          let match;
          while ((match = binaryPattern.exec(input)) !== null) {
            const binaryStr = match[1];
            // Each binary value can be any length, we'll split into 8-bit bytes
            // Pad to multiple of 8 if needed
            const paddedBinary = binaryStr.padEnd(Math.ceil(binaryStr.length / 8) * 8, '0');
            // Split into 8-bit chunks
            for (let i = 0; i < paddedBinary.length; i += 8) {
              const byteStr = paddedBinary.substr(i, 8);
              binaryValues.push(parseInt(byteStr, 2));
            }
          }
          
          if (binaryValues.length === 0) {
            return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid binary format with 0b prefix' };
          }
        } else {
          // Original format: space-separated or continuous binary
          const binaryClean = input.replace(/\s+/g, '');
          if (!/^[01]*$/.test(binaryClean)) {
            return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid binary format (must contain only 0 and 1)' };
          }
          if (binaryClean.length % 8 !== 0) {
            return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid binary format (must be multiple of 8 bits)' };
          }
          binaryValues = binaryClean.match(/.{1,8}/g)?.map(byte => parseInt(byte, 2)) || [];
        }
        
        bytes = new Uint8Array(binaryValues);
        displayText = Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
        break;

      case 'ascii':
        bytes = new TextEncoder().encode(input);
        displayText = input;
        break;

      case 'decimal':
        // Parse space-separated decimal values
        const decimals = input.trim().split(/\s+/).map(d => {
          const num = parseInt(d, 10);
          if (isNaN(num) || num < 0 || num > 255) {
            throw new Error(`Invalid decimal value: ${d}`);
          }
          return num;
        });
        bytes = new Uint8Array(decimals);
        displayText = Array.from(bytes).join(' ');
        break;

      case 'utf8':
        bytes = new TextEncoder().encode(input);
        displayText = input;
        break;

      case 'base64':
        try {
          // Remove data URL prefix if present
          const base64Clean = input.replace(/^data:.*?;base64,/, '');
          const binaryString = atob(base64Clean);
          bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          displayText = input;
        } catch (e) {
          return { bytes: new Uint8Array(0), displayText: '', error: 'Invalid base64 format' };
        }
        break;

      default:
        return { bytes: new Uint8Array(0), displayText: '', error: 'Unknown format' };
    }

    return { bytes, displayText };
  } catch (error) {
    return {
      bytes: new Uint8Array(0),
      displayText: '',
      error: error instanceof Error ? error.message : 'Conversion error'
    };
  }
}

/**
 * Convert bytes to string based on format
 */
export function bytesToString(bytes: Uint8Array, format: DataFormat): string {
  try {
    switch (format) {
      case 'hex':
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');

      case 'binary':
        return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');

      case 'ascii':
        return new TextDecoder('ascii').decode(bytes);

      case 'decimal':
        return Array.from(bytes).join(' ');

      case 'utf8':
        return new TextDecoder('utf-8').decode(bytes);

      case 'base64':
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);

      default:
        return '';
    }
  } catch (error) {
    return `[Error converting to ${format}]`;
  }
}

/**
 * Get line ending bytes
 */
export function getLineEndingBytes(lineEnding: string, custom?: string): Uint8Array {
  switch (lineEnding) {
    case 'cr':
      return new Uint8Array([0x0D]); // \r
    case 'lf':
      return new Uint8Array([0x0A]); // \n
    case 'crlf':
      return new Uint8Array([0x0D, 0x0A]); // \r\n
    case 'custom':
      if (custom) {
        return new TextEncoder().encode(custom);
      }
      return new Uint8Array(0);
    default:
      return new Uint8Array(0);
  }
}

