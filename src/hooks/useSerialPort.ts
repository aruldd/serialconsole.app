import { useState, useCallback, useRef, useEffect } from 'react';
import { SerialMessage, SerialConnectionConfig, DataFormat } from '../types';
import { bytesToString, stringToBytes } from '../utils/formatConverter';
import { appendLineEnding } from '../utils/serialUtils';

interface UseSerialPortReturn {
  port: SerialPort | null;
  isConnected: boolean;
  messages: SerialMessage[];
  portName: string | null;
  connect: (baudRate: number) => Promise<void>;
  disconnect: () => Promise<void>;
  send: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  clearMessages: () => void;
  error: string | null;
}

export function useSerialPort(): UseSerialPortReturn {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SerialMessage[]>([]);
  const [portName, setPortName] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const portRef = useRef<SerialPort | null>(null);

  // Update port ref when port changes
  useEffect(() => {
    portRef.current = port;
  }, [port]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('[Serial] Component unmounting - cleaning up...');
      // Cleanup readers and writers
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {
          // Reader might already be closed, ignore
        });
        readerRef.current = null;
      }
      
      if (writerRef.current) {
        try {
          writerRef.current.releaseLock();
        } catch (e) {
          // Writer might already be released or closed, ignore
        }
        writerRef.current = null;
      }
      
      if (portRef.current) {
        portRef.current.close().catch(() => {
          // Port might already be closed, ignore
        });
      }
    };
  }, []); // Only run on unmount

  const connect = useCallback(async (baudRate: number) => {
    console.log('[Serial] Connect called with baudRate:', baudRate);
    try {
      setError(null);
      
      // Check if Web Serial API is available
      console.log('[Serial] Checking Web Serial API availability...');
      if (!('serial' in navigator)) {
        console.error('[Serial] Web Serial API not available');
        throw new Error('Web Serial API is not supported in this browser');
      }
      console.log('[Serial] Web Serial API is available');

      // Clean up any existing connection first
      console.log('[Serial] Cleaning up existing connection...');
      if (readerRef.current) {
        console.log('[Serial] Cancelling existing reader...');
        try {
          await readerRef.current.cancel();
          console.log('[Serial] Reader cancelled');
        } catch (e) {
          console.warn('[Serial] Error cancelling reader:', e);
        }
        readerRef.current = null;
      }
      
      if (writerRef.current) {
        console.log('[Serial] Releasing existing writer lock...');
        try {
          await writerRef.current.releaseLock();
          console.log('[Serial] Writer lock released');
        } catch (e) {
          console.warn('[Serial] Error releasing writer lock:', e);
        }
        writerRef.current = null;
      }
      
      if (port) {
        console.log('[Serial] Closing existing port...');
        try {
          await port.close();
          console.log('[Serial] Port closed');
        } catch (e) {
          console.warn('[Serial] Error closing port:', e);
        }
        setPort(null);
      }
      console.log('[Serial] Cleanup complete');

      // Request port (user might cancel this)
      console.log('[Serial] Requesting port from user...');
      let selectedPort: SerialPort;
      try {
        selectedPort = await navigator.serial.requestPort();
        const portInfo = selectedPort.getInfo();
        console.log('[Serial] Port selected:', portInfo);
        
        // Try to get port name - it might be in the port object or we can construct it
        // On Windows, COM ports are typically named like "COM3", "COM4", etc.
        // The port info might not directly give us the name, so we'll try to access it
        let name = null;
        try {
          // Try to access the port's name if available
          if ('name' in selectedPort && typeof (selectedPort as any).name === 'string') {
            name = (selectedPort as any).name;
          } else {
            // Construct a name from port info
            const info = portInfo;
            if (info.usbVendorId && info.usbProductId) {
              name = `USB (${info.usbVendorId.toString(16)}:${info.usbProductId.toString(16)})`;
            } else {
              name = 'Serial Port';
            }
          }
        } catch (e) {
          // Fallback name
          name = 'Serial Port';
        }
        setPortName(name);
      } catch (err) {
        console.error('[Serial] Error requesting port:', err);
        // User cancelled port selection or other error
        if (err instanceof DOMException) {
          if (err.name === 'NotFoundError' || err.name === 'AbortError') {
            console.log('[Serial] User cancelled port selection');
            // User cancelled - don't show error, just return
            return;
          }
        }
        throw err;
      }
      
      // Open port with configuration
      console.log('[Serial] Opening port with baudRate:', baudRate);
      try {
        await selectedPort.open({ baudRate });
        console.log('[Serial] Port opened successfully');
      } catch (openError) {
        console.error('[Serial] Error opening port:', openError);
        // Port might already be open
        if (openError instanceof DOMException && openError.name === 'InvalidStateError') {
          console.log('[Serial] Port already open, attempting to close and reopen...');
          // Try to close and reopen
          try {
            await selectedPort.close();
            console.log('[Serial] Port closed, reopening...');
            await selectedPort.open({ baudRate });
            console.log('[Serial] Port reopened successfully');
          } catch (retryError) {
            console.error('[Serial] Error reopening port:', retryError);
            throw new Error('Port is already in use or cannot be opened');
          }
        } else {
          throw openError;
        }
      }

      // Set up writer
      console.log('[Serial] Setting up writer...');
      const writer = selectedPort.writable?.getWriter();
      if (!writer) {
        console.error('[Serial] Failed to get writer - writable stream is null');
        throw new Error('Failed to get writer');
      }
      writerRef.current = writer;
      console.log('[Serial] Writer set up successfully');

      // Set up reader
      console.log('[Serial] Setting up reader...');
      const reader = selectedPort.readable?.getReader();
      if (!reader) {
        console.error('[Serial] Failed to get reader - readable stream is null');
        // Clean up writer if reader fails
        try {
          await writer.releaseLock();
        } catch (e) {
          // Ignore
        }
        writerRef.current = null;
        throw new Error('Failed to get reader');
      }
      readerRef.current = reader;
      console.log('[Serial] Reader set up successfully');

      setPort(selectedPort);
      setIsConnected(true);
      console.log('[Serial] Connection established successfully!');
      console.log('[Serial] Final port state check - readable:', selectedPort.readable !== null, 'writable:', selectedPort.writable !== null);
      
      // Verify port is actually open
      if (!selectedPort.readable || !selectedPort.writable) {
        console.error('[Serial] WARNING: Port streams are null after connection!');
        console.error('[Serial] Readable:', selectedPort.readable, 'Writable:', selectedPort.writable);
      }

      // Start reading loop
      console.log('[Serial] Starting read loop...');
      console.log('[Serial] Port state - readable:', selectedPort.readable !== null, 'writable:', selectedPort.writable !== null);
      console.log('[Serial] Reader ref:', readerRef.current !== null, 'Writer ref:', writerRef.current !== null);
      const readLoop = async () => {
        let currentReader = reader; // Use local variable that we can update
        try {
          let readCount = 0;
          while (true) {
            // Check if port is still open
            if (!selectedPort.readable) {
              console.log('[Serial] Port readable stream is null, exiting read loop');
              break;
            }
            
            if (!readerRef.current || readerRef.current !== currentReader) {
              console.log('[Serial] Reader ref changed or is null, exiting read loop');
              break;
            }
            readCount++;
            console.log(`[Serial] Read attempt #${readCount} - Waiting for data...`);
            console.log('[Serial] Using reader:', currentReader === reader ? 'original' : 'new');
            
            const readResult = await currentReader.read();
            console.log('[Serial] Read result:', { 
              done: readResult.done, 
              hasValue: !!readResult.value, 
              valueLength: readResult.value?.length || 0 
            });
            
            if (readResult.done) {
              console.log('[Serial] Read stream returned done=true');
              console.log('[Serial] Port state after read done:');
              console.log('  - readable exists:', selectedPort.readable !== null);
              console.log('  - readable locked:', selectedPort.readable?.locked || false);
              console.log('  - writable exists:', selectedPort.writable !== null);
              console.log('  - isConnected state:', isConnected);
              console.log('  - port in state:', port === selectedPort);
              
              // When done=true, the reader's stream has ended
              // For serial ports, this usually means the port was closed
              // But let's check if we can continue
              
              // Check if port readable stream still exists
              if (!selectedPort.readable) {
                console.log('[Serial] Port readable stream is null - port is closed');
                break;
              }
              
              // If the stream is locked, it means we still have a reader active
              // This shouldn't happen if done=true, but let's handle it
              if (selectedPort.readable.locked) {
                console.log('[Serial] Stream is still locked - reader may not have been released properly');
                // Try to wait a moment for it to unlock
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              // Try to get a new reader if stream is available
              if (!selectedPort.readable.locked) {
                console.log('[Serial] Attempting to get new reader from port...');
                try {
                  const newReader = selectedPort.readable.getReader();
                  console.log('[Serial] Successfully got new reader - continuing read loop');
                  // Release old reader reference
                  if (currentReader === readerRef.current) {
                    readerRef.current = null;
                  }
                  // Update to new reader
                  readerRef.current = newReader;
                  currentReader = newReader;
                  // Continue with new reader
                  continue;
                } catch (e) {
                  console.error('[Serial] Failed to get new reader:', e);
                  console.error('[Serial] Error details:', {
                    name: e instanceof Error ? e.name : 'Unknown',
                    message: e instanceof Error ? e.message : String(e)
                  });
                  break;
                }
              } else {
                console.log('[Serial] Cannot get new reader - stream is locked or port is closing');
                break;
              }
            }
            
            if (readResult.value && readResult.value.length > 0) {
              console.log('[Serial] Received data:', readResult.value.length, 'bytes');
              const message: SerialMessage = {
                id: `${Date.now()}-${Math.random()}`,
                type: 'received',
                data: readResult.value,
                timestamp: new Date(),
                format: 'hex', // Default format for display
                displayText: bytesToString(readResult.value, 'hex'),
              };
              setMessages(prev => [...prev, message]);
            } else {
              console.log('[Serial] Read returned empty value (but not done)');
            }
          }
        } catch (readError) {
          console.error('[Serial] Read loop error:', readError);
          console.error('[Serial] Read error details:', {
            name: readError instanceof Error ? readError.name : 'Unknown',
            message: readError instanceof Error ? readError.message : String(readError),
            stack: readError instanceof Error ? readError.stack : undefined
          });
          // If reader was cancelled or closed, that's expected
          if (readError instanceof Error) {
            if (readError.name !== 'NetworkError' && !readError.message.includes('closed') && !readError.message.includes('CLOSED')) {
              setError(`Read error: ${readError.message}`);
            }
          }
        } finally {
          console.log('[Serial] Read loop ended, cleaning up...');
          console.log('[Serial] Port state in finally:');
          console.log('  - readable:', selectedPort.readable !== null);
          console.log('  - writable:', selectedPort.writable !== null);
          console.log('  - port in state:', port === selectedPort);
          
          // Clean up reader reference only if it's still the current one
          if (readerRef.current === currentReader) {
            readerRef.current = null;
          }
          
          // Only mark as disconnected if port is actually closed
          // If port is still open (especially writable), we can still send data
          if (!selectedPort.readable && !selectedPort.writable) {
            console.log('[Serial] Port is closed - marking as disconnected');
            setIsConnected(false);
          } else if (!selectedPort.writable) {
            console.log('[Serial] Port writable stream is closed - marking as disconnected');
            setIsConnected(false);
          } else {
            console.log('[Serial] Port is still open (writable available) - keeping connection active for sending');
            // Keep isConnected true if we can still send data
            // The read loop ending doesn't mean we can't send
            console.log('[Serial] Writer ref exists:', writerRef.current !== null);
          }
        }
      };

      readLoop();
    } catch (err) {
      console.error('[Serial] Connect error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      console.error('[Serial] Setting error:', errorMessage);
      setError(errorMessage);
      setIsConnected(false);
      setPort(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    console.log('[Serial] Disconnect called');
    try {
      setError(null);
      setIsConnected(false);
      setPortName(null);
      
      // Cancel reader if it exists (before closing port)
      if (readerRef.current) {
        console.log('[Serial] Cancelling reader...');
        try {
          await readerRef.current.cancel();
          console.log('[Serial] Reader cancelled');
        } catch (e) {
          console.warn('[Serial] Error cancelling reader:', e);
        }
        readerRef.current = null;
      }
      
      // Release writer lock if it exists (before closing port)
      if (writerRef.current) {
        console.log('[Serial] Releasing writer lock...');
        try {
          await writerRef.current.releaseLock();
          console.log('[Serial] Writer lock released');
        } catch (e) {
          console.warn('[Serial] Error releasing writer lock:', e);
        }
        writerRef.current = null;
      }
      
      // Close port if it exists (this will close all streams)
      if (port) {
        console.log('[Serial] Closing port...');
        try {
          await port.close();
          console.log('[Serial] Port closed');
        } catch (e) {
          console.warn('[Serial] Error closing port:', e);
        }
        setPort(null);
      }
      console.log('[Serial] Disconnect complete');
    } catch (err) {
      console.error('[Serial] Disconnect error:', err);
      // Even if there's an error, we should still update state
      setIsConnected(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      // Only set error if it's not a "closed" error
      if (!errorMessage.includes('CLOSED') && !errorMessage.includes('closed')) {
        setError(errorMessage);
      }
    }
  }, [port]);

  const send = useCallback(async (
    data: string,
    format: DataFormat,
    config: SerialConnectionConfig
  ) => {
    console.log('[Serial] Send called with data:', data.substring(0, 50), 'format:', format);
    console.log('[Serial] Send state - isConnected:', isConnected, 'writerRef:', writerRef.current !== null, 'port:', port !== null);
    try {
      // Check if writer exists - this is the real indicator of connection
      if (!writerRef.current) {
        // Try to get a new writer if port is still open
        if (port && port.writable && !port.writable.locked) {
          console.log('[Serial] Writer missing but port is open - attempting to get new writer...');
          try {
            const newWriter = port.writable.getWriter();
            writerRef.current = newWriter;
            console.log('[Serial] Successfully got new writer');
            setIsConnected(true);
          } catch (e) {
            console.error('[Serial] Failed to get new writer:', e);
            throw new Error('Not connected - no writer available and cannot create new one');
          }
        } else {
          console.error('[Serial] Cannot send - writer does not exist and port is not available');
          throw new Error('Not connected - no writer available');
        }
      }

      // If isConnected is false but writer exists, update the state
      if (!isConnected && writerRef.current) {
        console.log('[Serial] Writer exists but isConnected is false - updating connection state');
        setIsConnected(true);
      }

      setError(null);

      // Convert string to bytes
      const conversion = stringToBytes(data, format);
      if (conversion.error) {
        throw new Error(conversion.error);
      }

      // Append line ending
      const dataWithEnding = appendLineEnding(
        conversion.bytes,
        config.lineEnding,
        config.customLineEnding
      );

      // Send data - check if writer is still valid
      if (!writerRef.current) {
        throw new Error('Connection lost');
      }
      await writerRef.current.write(dataWithEnding);

      // Add to messages
      const message: SerialMessage = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'sent',
        data: dataWithEnding,
        timestamp: new Date(),
        format,
        displayText: conversion.displayText || data,
        originalData: data, // Store original data string for resending
      };
      setMessages(prev => [...prev, message]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send data';
      setError(errorMessage);
      // If write failed, the connection might be lost
      if (errorMessage.includes('closed') || errorMessage.includes('CLOSED')) {
        setIsConnected(false);
      }
    }
  }, [isConnected, port]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    port,
    isConnected,
    messages,
    portName,
    connect,
    disconnect,
    send,
    clearMessages,
    error,
  };
}

