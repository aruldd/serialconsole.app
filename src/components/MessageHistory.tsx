import { useState, useEffect, useRef } from 'react';
import { Paper, Button, Group, Stack, Text, ScrollArea, Code, Switch, Box, ActionIcon } from '@mantine/core';
import { IconTrash, IconDownload, IconCopy } from '@tabler/icons-react';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { bytesToString } from '../utils/formatConverter';

interface MessageHistoryProps {
  messages: SerialMessage[];
  onClear: () => void;
  onResend?: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  isConnected?: boolean;
  currentConfig?: SerialConnectionConfig;
}

export function MessageHistory({ messages, onClear, onResend, isConnected, currentConfig }: MessageHistoryProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollHeight, setScrollHeight] = useState(600);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scroll area height based on container
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        if (height > 0) {
          setScrollHeight(height);
        }
      }
    };
    
    updateHeight();
    
    // Use ResizeObserver for more accurate updates
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && viewportRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated, with a small delay for rendering
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
          }
        }, 0);
      });
    }
  }, [messages, autoScroll]);

  const handleExport = () => {
    const logContent = messages.map((msg) => {
      const timestamp = msg.timestamp.toLocaleString();
      const type = msg.type === 'sent' ? '[SENT]' : '[RECEIVED]';
      const data = bytesToString(msg.data, msg.format);
      return `${timestamp} ${type} [${msg.format.toUpperCase()}]\n${data}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack gap="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Group justify="space-between" align="center" style={{ flexShrink: 0 }}>
          <Text fw={500} size="lg">Message History</Text>
          <Group>
            <Switch
              label="Auto-scroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.currentTarget.checked)}
              size="sm"
            />
            <Button
              onClick={onClear}
              variant="light"
              color="red"
              disabled={messages.length === 0}
              size="sm"
              title="Clear"
            >
              <IconTrash size={16} />
            </Button>
            <Button
              onClick={handleExport}
              variant="light"
              disabled={messages.length === 0}
              size="sm"
              title="Export"
            >
              <IconDownload size={16} />
            </Button>
          </Group>
        </Group>

        <Box ref={containerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <ScrollArea
            h={scrollHeight}
            type="auto"
            viewportRef={viewportRef}
            onScrollPositionChange={() => {
              if (viewportRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
                const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
                setAutoScroll(isAtBottom);
              }
            }}
          >
          <Stack gap="xs" style={{ paddingBottom: '16px' }}>
            {messages.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                No messages yet
              </Text>
            ) : (
              messages.map((message) => {
                const displayText = bytesToString(message.data, message.format);
                const isSent = message.type === 'sent';
                const canResend = isSent && isConnected && message.originalData && onResend && currentConfig;
                
                const handleClick = () => {
                  if (canResend && message.originalData) {
                    onResend(message.originalData, message.format, currentConfig);
                  }
                };

                const handleCopy = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(displayText);
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                };
                
                return (
                  <div 
                    key={message.id}
                    onClick={canResend ? handleClick : undefined}
                    style={{
                      cursor: canResend ? 'pointer' : 'default',
                      transition: 'opacity 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (canResend) {
                        e.currentTarget.style.opacity = '0.8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canResend) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                  >
                    <Group gap="xs" mb={4} justify="space-between" align="center">
                      <Group gap="xs">
                        <Text
                          size="xs"
                          fw={500}
                          c={isSent ? 'blue' : 'green'}
                        >
                          {isSent ? '→ SENT' : '← RECEIVED'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {message.timestamp.toLocaleTimeString()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          [{message.format.toUpperCase()}]
                        </Text>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        title="Copy"
                        onClick={handleCopy}
                      >
                        <IconCopy size={14} />
                      </ActionIcon>
                    </Group>
                    <Code
                      block
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        backgroundColor: isSent ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-green-0)',
                      }}
                    >
                      {displayText}
                    </Code>
                  </div>
                );
              })
            )}
          </Stack>
          </ScrollArea>
        </Box>
      </Stack>
    </Paper>
  );
}

