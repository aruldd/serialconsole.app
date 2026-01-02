import { Group, Text, Code, ActionIcon, Box } from '@mantine/core';
import { IconCopy } from '@tabler/icons-react';
import { useIntl } from 'react-intl';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { bytesToString } from '../utils/formatConverter';

interface MessageItemProps {
  message: SerialMessage;
  onResend?: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  isConnected?: boolean;
  currentConfig?: SerialConnectionConfig;
}

export function MessageItem({ message, onResend, isConnected, currentConfig }: MessageItemProps) {
  const intl = useIntl();
  const t = (key: string) => intl.formatMessage({ id: key });
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
      console.error('[MessageHistory] Failed to copy:', err);
    }
  };
  
  return (
    <Box 
     px="md"
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
            {isSent ? t('messageItem.sent') : t('messageItem.received')}
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
          title={t('common.copy')}
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
    </Box>
  );
}

