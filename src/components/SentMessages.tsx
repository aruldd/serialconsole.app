import { Paper, Stack, Text, ScrollArea, Box, ActionIcon, Group } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useIntl, FormattedMessage } from 'react-intl';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { useMemo } from 'react';

interface SentMessagesProps {
  messages: SerialMessage[];
  onResend: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  isConnected: boolean;
  currentConfig: SerialConnectionConfig;
}

interface GroupedMessage {
  originalData: string;
  format: DataFormat;
  displayText: string;
  count: number;
  latestTimestamp: Date;
}

export function SentMessages({ messages, onResend, isConnected, currentConfig }: SentMessagesProps) {
  const intl = useIntl();
  const t = (key: string, values?: Record<string, any>) => intl.formatMessage({ id: key }, values);
  const sentMessages = useMemo(() => {
    const sent = messages.filter(msg => msg.type === 'sent' && msg.originalData);

    // Group messages by originalData and format
    const grouped = new Map<string, GroupedMessage>();

    sent.forEach(msg => {
      const key = `${msg.originalData}|${msg.format}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.count++;
        if (msg.timestamp > existing.latestTimestamp) {
          existing.latestTimestamp = msg.timestamp;
        }
      } else {
        grouped.set(key, {
          originalData: msg.originalData!,
          format: msg.format,
          displayText: msg.displayText || '',
          count: 1,
          latestTimestamp: msg.timestamp,
        });
      }
    });

    // Convert to array and sort by count (descending)
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  }, [messages]);

  const handleResend = async (message: GroupedMessage) => {
    if (!isConnected) return;

    try {
      await onResend(message.originalData, message.format, currentConfig);
    } catch (error) {
      console.error('[SentMessages] Resend error:', error);
    }
  };

  return (
    <Paper p="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack gap="md" style={{ height: '100%' }}>
        <Text fw={500} size="md">{t('sentMessages.title')}</Text>

        {sentMessages.length === 0 ? (
          <Text size="sm" style={{ textAlign: 'center', padding: '20px' }}>
            {t('sentMessages.noMessages')}
          </Text>
        ) : (
          <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <ScrollArea h="100%">
              <Stack gap="xs" style={{ paddingBottom: '16px' }}>
                {sentMessages.map((message, index) => (
                  <Paper
                    key={`${message.originalData}-${message.format}-${index}`}
                    p="xs"
                    withBorder
                    style={{
                      cursor: isConnected ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => isConnected && handleResend(message)}
                    onMouseEnter={(e) => {
                      if (isConnected) {
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
                          <Text size="xs" c="blue" fw={500}>
                            {message.format.toUpperCase()}
                          </Text>
                          <Text size="xs" c="dimmed">
                            <FormattedMessage
                              id="sentMessages.sentCount"
                              values={{ count: message.count }}
                            />
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
                      {isConnected && (
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          title={t('common.resend')}
                          aria-label={t('common.resend')}
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

