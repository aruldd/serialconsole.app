import { Paper, Stack, Text, ScrollArea, Box, ActionIcon, Group } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { useMemo } from 'react';

interface SentMessagesProps {
  messages: SerialMessage[];
  onResend: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  isConnected: boolean;
  currentConfig: SerialConnectionConfig;
}

export function SentMessages({ messages, onResend, isConnected, currentConfig }: SentMessagesProps) {
  const sentMessages = useMemo(() => {
    return messages
      .filter(msg => msg.type === 'sent')
      .reverse(); // Most recent first
  }, [messages]);

  const handleResend = async (message: SerialMessage) => {
    if (!isConnected || !message.originalData) return;
    
    try {
      await onResend(message.originalData, message.format, currentConfig);
    } catch (error) {
      console.error('Resend error:', error);
    }
  };

  return (
    <Paper p="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack gap="md" style={{ height: '100%' }}>
        <Text fw={500} size="lg">Sent Messages</Text>
        
        {sentMessages.length === 0 ? (
          <Text c="dimmed" size="sm" style={{ textAlign: 'center', padding: '20px' }}>
            No sent messages yet
          </Text>
        ) : (
          <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <ScrollArea h="100%">
              <Stack gap="xs" style={{ paddingBottom: '16px' }}>
                {sentMessages.map((message) => (
                  <Paper
                    key={message.id}
                    p="xs"
                    withBorder
                    style={{ 
                      cursor: isConnected && message.originalData ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => isConnected && message.originalData && handleResend(message)}
                    onMouseEnter={(e) => {
                      if (isConnected && message.originalData) {
                        e.currentTarget.style.backgroundColor = 'var(--mantine-color-blue-0)';
                        e.currentTarget.style.borderColor = 'var(--mantine-color-blue-3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '';
                    }}
                  >
                    <Group gap="xs" justify="space-between" align="flex-start">
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" align="center">
                          <Text size="xs" c="dimmed">
                            {message.timestamp.toLocaleTimeString()}
                          </Text>
                          <Text size="xs" c="blue" fw={500}>
                            {message.format.toUpperCase()}
                          </Text>
                        </Group>
                        <Text
                          size="sm"
                          style={{
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {message.displayText}
                        </Text>
                      </Stack>
                      {isConnected && message.originalData && (
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          title="Resend"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResend(message);
                          }}
                        >
                          <IconSend size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

