import { useState, useCallback, useRef, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { notifications } from '@mantine/notifications';
import { SerialMessage, SerialConnectionConfig, DataFormat, SerialPortOption, LineEnding } from '../types';
import { bytesToString, stringToBytes, getLineEndingBytes } from '../utils/formatConverter';
import { appendLineEnding } from '../utils/serialUtils';

interface UseSerialPortReturn {
  port: SerialPort | null;
  isConnected: boolean;
  messages: SerialMessage[];
  portName: string | null;
  availablePorts: SerialPortOption[];
  connect: (baudRate: number, selectedPort?: SerialPort) => Promise<void>;
  disconnect: () => Promise<void>;
  send: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  clearMessages: () => void;
  refreshPorts: () => Promise<void>;
  requestNewPort: () => Promise<SerialPort | null>;
  setReadConfig: (config: SerialConnectionConfig) => void;
  error: string | null;
}

/**
 * Safely cancel a reader stream
 */
async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array> | null): Promise<void> {
  if (!reader) return;
  try {
    await reader.cancel();
  } catch {
    // Reader might already be closed, ignore
  }
}

/**
 * Safely release a writer lock
 */
function releaseWriter(writer: WritableStreamDefaultWriter<Uint8Array> | null): void {
  if (!writer) return;
  try {
    writer.releaseLock();
  } catch {
    // Writer might already be released or closed, ignore
  }
}

/**
 * Safely close a serial port
 */
async function closePort(port: SerialPort | null): Promise<void> {
  if (!port) return;
  try {
    await port.close();
  } catch {
    // Port might already be closed, ignore
  }
}

/**
 * Extract port name from port info or use fallback
 */
function extractPortName(port: SerialPort, portInfo: SerialPortInfo): string {
  try {
    // Try to access the port's name if available
    if ('name' in port && typeof (port as any).name === 'string') {
      return (port as any).name;
    }
    
    // Construct a name from port info
    if (portInfo.usbVendorId && portInfo.usbProductId) {
      const vendorHex = portInfo.usbVendorId.toString(16).toUpperCase();
      const productHex = portInfo.usbProductId.toString(16).toUpperCase();
      return `USB (${vendorHex}:${productHex})`;
    }
    
    return 'Serial Port';
  } catch {
    return 'Serial Port';
  }
}

/**
 * Check if an error should be ignored (expected during disconnection)
 */
function isExpectedError(error: Error): boolean {
  const errorMsg = error.message || String(error);
  return (
    error.name === 'NetworkError' ||
    errorMsg.includes('closed') ||
    errorMsg.includes('CLOSED') ||
    errorMsg.includes('null') ||
    errorMsg.includes('locked')
  );
}

/**
 * Show error notification
 */
function showErrorNotification(title: string, message: string): void {
  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: 5000,
  });
}

/**
 * Find line ending in buffer and return the index where it ends, or -1 if not found
 */
function findLineEnding(buffer: Uint8Array, lineEnding: LineEnding, custom?: string): number {
  const endingBytes = getLineEndingBytes(lineEnding, custom);
  if (endingBytes.length === 0) return -1;
  
  // Search for the line ending pattern
  for (let i = 0; i <= buffer.length - endingBytes.length; i++) {
    let match = true;
    for (let j = 0; j < endingBytes.length; j++) {
      if (buffer[i + j] !== endingBytes[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return i + endingBytes.length; // Return position after the line ending
    }
  }
  return -1;
}

/**
 * Create a received message from data
 */
function createReceivedMessage(data: Uint8Array): SerialMessage {
  const displayText = bytesToString(data, 'hex');
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: 'received',
    data,
    timestamp: new Date(),
    format: 'hex',
    displayText,
  };
}

/**
 * Create a sent message from data
 */
function createSentMessage(
  data: Uint8Array,
  format: DataFormat,
  displayText: string,
  originalData: string
): SerialMessage {
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: 'sent',
    data,
    timestamp: new Date(),
    format,
    displayText,
    originalData,
  };
}

/**
 * Generate a unique ID for a port based on its info
 */
function generatePortId(portInfo: SerialPortInfo): string {
  if (portInfo.usbVendorId && portInfo.usbProductId) {
    return `usb-${portInfo.usbVendorId}-${portInfo.usbProductId}`;
  }
  return `port-${Date.now()}-${Math.random()}`;
}

/**
 * Get available ports and convert to options
 */
async function getAvailablePorts(): Promise<SerialPortOption[]> {
  if (!('serial' in navigator) || !navigator.serial) {
    return [];
  }

  try {
    const ports = await navigator.serial.getPorts();
    return ports.map(port => {
      const portInfo = port.getInfo();
      const name = extractPortName(port, portInfo);
      const id = generatePortId(portInfo);
      return { port, name, id };
    });
  } catch (error) {
    console.error('[Serial] Error getting available ports:', error);
    // Report to Sentry but don't show user notification for port enumeration errors
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: { operation: 'getAvailablePorts' },
        level: 'warning',
      });
    }
    return [];
  }
}

export function useSerialPort(): UseSerialPortReturn {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SerialMessage[]>([]);
  const [portName, setPortName] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<SerialPortOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const portRef = useRef<SerialPort | null>(null);
  const readBufferRef = useRef<Uint8Array>(new Uint8Array(0)); // Buffer for line-ending mode
  const readConfigRef = useRef<SerialConnectionConfig | null>(null); // Store read config

  // Keep port ref in sync with state
  useEffect(() => {
    portRef.current = port;
  }, [port]);

  // Load available ports on mount
  useEffect(() => {
    getAvailablePorts().then(setAvailablePorts);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelReader(readerRef.current);
      readerRef.current = null;
      
      releaseWriter(writerRef.current);
      writerRef.current = null;
      
      closePort(portRef.current);
    };
  }, []);

  /**
   * Clean up existing connection resources
   */
  const cleanupExistingConnection = useCallback(async (): Promise<void> => {
    await cancelReader(readerRef.current);
    readerRef.current = null;
    
    releaseWriter(writerRef.current);
    writerRef.current = null;
    
    if (port) {
      await closePort(port);
      setPort(null);
    }
  }, [port]);

  /**
   * Request and select a new serial port
   */
  const requestNewPort = useCallback(async (): Promise<SerialPort | null> => {
    if (!('serial' in navigator) || !navigator.serial) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      const selectedPort = await navigator.serial.requestPort();
      // Refresh available ports after requesting a new one
      const ports = await getAvailablePorts();
      setAvailablePorts(ports);
      return selectedPort;
    } catch (err) {
      // User cancelled port selection - don't report to Sentry
      if (err instanceof DOMException) {
        if (err.name === 'NotFoundError' || err.name === 'AbortError') {
          return null;
        }
      }
      // Report unexpected errors to Sentry
      if (err instanceof Error) {
        Sentry.captureException(err, {
          tags: { operation: 'requestNewPort' },
        });
      }
      throw err;
    }
  }, []);

  /**
   * Refresh available ports list
   */
  const refreshPorts = useCallback(async (): Promise<void> => {
    const ports = await getAvailablePorts();
    setAvailablePorts(ports);
  }, []);

  /**
   * Open port with retry logic for already-open ports
   */
  const openPort = useCallback(async (port: SerialPort, baudRate: number): Promise<void> => {
    try {
      await port.open({ baudRate });
    } catch (openError) {
      // Port might already be open, try to close and reopen
      if (openError instanceof DOMException && openError.name === 'InvalidStateError') {
        await port.close();
        await port.open({ baudRate });
      } else {
        throw openError;
      }
    }
  }, []);

  /**
   * Set up writer stream
   */
  const setupWriter = useCallback((port: SerialPort): WritableStreamDefaultWriter<Uint8Array> => {
    const writer = port.writable?.getWriter();
    if (!writer) {
      throw new Error('Failed to get writer - writable stream is null');
    }
    return writer;
  }, []);

  /**
   * Set up reader stream
   */
  const setupReader = useCallback((port: SerialPort): ReadableStreamDefaultReader<Uint8Array> => {
    const reader = port.readable?.getReader();
    if (!reader) {
      throw new Error('Failed to get reader - readable stream is null');
    }
    return reader;
  }, []);

  /**
   * Read loop for receiving data from serial port
   */
  const startReadLoop = useCallback((
    port: SerialPort,
    initialReader: ReadableStreamDefaultReader<Uint8Array>
  ): void => {
    const readLoop = async () => {
      let currentReader = initialReader;
      
      try {
        while (true) {
          // Check if port is still valid
          if (!port?.readable || readerRef.current !== currentReader) {
            break;
          }
          
          const readResult = await currentReader.read();
          
          // Handle end of stream
          if (readResult.done) {
            if (!port.readable) break;
            
            // Wait if stream is locked
            if (port.readable.locked) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Try to get a new reader if stream is available
            if (port.readable && !port.readable.locked) {
              try {
                const newReader = port.readable.getReader();
                if (currentReader === readerRef.current) {
                  readerRef.current = null;
                }
                readerRef.current = newReader;
                currentReader = newReader;
                continue;
              } catch (e) {
                console.error('[Serial] Failed to get new reader:', e);
                break;
              }
            } else {
              break;
            }
          }
          
          // Process received data
          if (readResult.value?.length) {
            const config = readConfigRef.current;
            const readUntilLineEnding = config?.readUntilLineEnding;
            
            if (readUntilLineEnding && config) {
              // Buffer mode: accumulate data until line ending is found
              const newBuffer = new Uint8Array(readBufferRef.current.length + readResult.value.length);
              newBuffer.set(readBufferRef.current);
              newBuffer.set(readResult.value, readBufferRef.current.length);
              readBufferRef.current = newBuffer;
              
              // Look for the configured line ending in the buffer
              const lineEndingPos = findLineEnding(
                readBufferRef.current,
                config.readLineEnding || 'crlf',
                config.readCustomLineEnding
              );
              
              if (lineEndingPos >= 0) {
                // Found line ending, extract message
                const messageData = readBufferRef.current.slice(0, lineEndingPos);
                const remainingData = readBufferRef.current.slice(lineEndingPos);
                
                if (messageData.length > 0) {
                  const message = createReceivedMessage(messageData);
                  setMessages(prev => [...prev, message]);
                }
                
                // Keep remaining data in buffer
                readBufferRef.current = remainingData;
              }
              // If no line ending found, keep buffering
            } else {
              // Normal mode: create message immediately
              const message = createReceivedMessage(readResult.value);
              setMessages(prev => [...prev, message]);
            }
          }
        }
      } catch (readError) {
        console.error('[Serial] Read loop error:', readError);
        
        // Only show unexpected errors
        if (readError instanceof Error && !isExpectedError(readError)) {
          const errorMsg = `Read error: ${readError.message || String(readError)}`;
          setError(errorMsg);
          showErrorNotification('Read Error', errorMsg);
          // Report unexpected read errors to Sentry
          Sentry.captureException(readError, {
            tags: { operation: 'readLoop' },
            extra: { errorMessage: errorMsg },
          });
        }
      } finally {
        // Clean up reader reference
        if (readerRef.current === currentReader) {
          readerRef.current = null;
        }
        
        // Update connection status based on port state
        if (!port.readable && !port.writable) {
          setIsConnected(false);
        } else if (!port.writable) {
          setIsConnected(false);
        }
      }
    };

    readLoop();
  }, []);

  /**
   * Connect to a serial port
   */
  const connect = useCallback(async (baudRate: number, selectedPort?: SerialPort): Promise<void> => {
    try {
      setError(null);
      
      // Clean up any existing connection
      await cleanupExistingConnection();

      // Use provided port or request a new one
      let portToConnect: SerialPort;
      if (selectedPort) {
        portToConnect = selectedPort;
      } else {
        const newPort = await requestNewPort();
        if (!newPort) {
          // User cancelled port selection
          return;
        }
        portToConnect = newPort;
        // Refresh available ports after requesting a new one
        await refreshPorts();
      }

      // Extract and set port name
      const portInfo = portToConnect.getInfo();
      const name = extractPortName(portToConnect, portInfo);
      setPortName(name);

      // Open port
      await openPort(portToConnect, baudRate);

      // Set up streams
      const writer = setupWriter(portToConnect);
      const reader = setupReader(portToConnect);
      
      // Store references
      writerRef.current = writer;
      readerRef.current = reader;
      
      // Update state
      setPort(portToConnect);
      setIsConnected(true);

      // Start reading loop
      startReadLoop(portToConnect, reader);
      
    } catch (err) {
      console.error('[Serial] Connect error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      showErrorNotification('Connection Error', errorMessage);
      setIsConnected(false);
      setPort(null);
      // Report connection errors to Sentry
      if (err instanceof Error) {
        Sentry.captureException(err, {
          tags: { operation: 'connect' },
          extra: { baudRate, errorMessage },
        });
      } else {
        Sentry.captureException(new Error(errorMessage), {
          tags: { operation: 'connect' },
          extra: { baudRate, originalError: String(err) },
        });
      }
    }
  }, [cleanupExistingConnection, requestNewPort, refreshPorts, openPort, setupWriter, setupReader, startReadLoop]);

  /**
   * Set read configuration (for line ending detection)
   */
  const setReadConfig = useCallback((config: SerialConnectionConfig): void => {
    readConfigRef.current = config;
    // Clear buffer when config changes
    readBufferRef.current = new Uint8Array(0);
  }, []);

  /**
   * Disconnect from serial port
   */
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setIsConnected(false);
      setPortName(null);
      
      // Clear read buffer
      readBufferRef.current = new Uint8Array(0);
      
      // Clean up resources in order
      await cancelReader(readerRef.current);
      readerRef.current = null;
      
      releaseWriter(writerRef.current);
      writerRef.current = null;
      
      await closePort(portRef.current);
      setPort(null);
      
    } catch (err) {
      console.error('[Serial] Disconnect error:', err);
      setIsConnected(false);
      setPortName(null);
      
      // Only show unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      if (!isExpectedError(new Error(errorMessage)) && !errorMessage.includes('already')) {
        setError(errorMessage);
        showErrorNotification('Disconnect Error', errorMessage);
        // Report unexpected disconnect errors to Sentry
        if (err instanceof Error) {
          Sentry.captureException(err, {
            tags: { operation: 'disconnect' },
            extra: { errorMessage },
          });
        }
      }
    }
  }, []);

  /**
   * Send data to serial port
   */
  const send = useCallback(async (
    data: string,
    format: DataFormat,
    config: SerialConnectionConfig
  ): Promise<void> => {
    try {
      // Ensure writer exists
      if (!writerRef.current) {
        // Try to get a new writer if port is still open
        if (port?.writable && !port.writable.locked) {
          try {
            writerRef.current = port.writable.getWriter();
            setIsConnected(true);
          } catch (e) {
            console.error('[Serial] Failed to get new writer:', e);
            throw new Error('Not connected - no writer available and cannot create new one');
          }
        } else {
          throw new Error('Not connected - no writer available');
        }
      }

      // Update connection state if needed
      if (!isConnected && writerRef.current) {
        setIsConnected(true);
      }

      setError(null);

      // Convert and prepare data
      const conversion = stringToBytes(data, format);
      if (conversion.error) {
        throw new Error(conversion.error);
      }

      const dataWithEnding = appendLineEnding(
        conversion.bytes,
        config.lineEnding,
        config.customLineEnding
      );

      // Send data
      if (!writerRef.current) {
        throw new Error('Connection lost');
      }
      
      await writerRef.current.write(dataWithEnding);

      // Add to message history
      const displayText = conversion.displayText || data;
      const message = createSentMessage(dataWithEnding, format, displayText, data);
      setMessages(prev => [...prev, message]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send data';
      setError(errorMessage);
      showErrorNotification('Send Error', errorMessage);
      
      // Update connection state if write failed
      if (errorMessage.includes('closed') || errorMessage.includes('CLOSED')) {
        setIsConnected(false);
      }
      
      // Report send errors to Sentry
      if (err instanceof Error) {
        Sentry.captureException(err, {
          tags: { operation: 'send' },
          extra: { 
            format,
            dataLength: data.length,
            errorMessage,
          },
        });
      } else {
        Sentry.captureException(new Error(errorMessage), {
          tags: { operation: 'send' },
          extra: { 
            format,
            dataLength: data.length,
            originalError: String(err),
          },
        });
      }
    }
  }, [isConnected, port]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback((): void => {
    setMessages([]);
  }, []);

  return {
    port,
    isConnected,
    messages,
    portName,
    availablePorts,
    connect,
    disconnect,
    send,
    clearMessages,
    refreshPorts,
    requestNewPort,
    setReadConfig,
    error,
  };
}
