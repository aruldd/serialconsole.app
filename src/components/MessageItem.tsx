import React, { useMemo, useCallback } from 'react';
import { Group, Text, Code, ActionIcon, Box } from '@mantine/core';
import { IconCopy, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { useIntl } from 'react-intl';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { bytesToString } from '../utils/formatConverter';

interface MessageItemProps {
  message: SerialMessage;
  onResend?: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  isConnected?: boolean;
  currentConfig?: SerialConnectionConfig;
  displayFormat?: DataFormat; // Override format for display
}

function MessageItemComponent({ message, onResend, isConnected, currentConfig, displayFormat }: MessageItemProps) {
  const intl = useIntl();
  const t = (key: string) => intl.formatMessage({ id: key });
  
  // Memoize expensive calculations
  const formatToUse = useMemo(() => displayFormat || message.format, [displayFormat, message.format]);
  const displayText = useMemo(() => bytesToString(message.data, formatToUse), [message.data, formatToUse]);
  const isSent = useMemo(() => message.type === 'sent', [message.type]);
  const canResend = useMemo(
    () => isSent && isConnected && message.originalData && onResend && currentConfig,
    [isSent, isConnected, message.originalData, onResend, currentConfig]
  );
  
  const handleClick = useCallback(() => {
    if (canResend && message.originalData && onResend && currentConfig) {
      onResend(message.originalData, message.format, currentConfig);
    }
  }, [canResend, message.originalData, message.format, onResend, currentConfig]);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(displayText);
    } catch (err) {
      console.error('[MessageHistory] Failed to copy:', err);
    }
  }, [displayText]);
  
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Box 
      px="md"
      onClick={canResend ? handleClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: canResend ? 'pointer' : 'default',
        transition: 'opacity 0.2s',
        position: 'relative',
      }}
    >
      <Group gap="xs" align="flex-start" wrap="nowrap">
        {/* Left side: Metadata */}
        <Box
          style={{
            minWidth: 120,
            flexShrink: 0,
            backgroundColor: 'var(--mantine-color-gray-1)',
            padding: '8px',
            borderRadius: '4px',
          }}
        >
          <Group gap={4}>
            {isSent ? (
              <IconArrowLeft size={16} color="var(--mantine-color-blue-6)" />
            ) : (
              <IconArrowRight size={16} color="var(--mantine-color-green-6)" />
            )}
            <Text size="sm" >
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </Group>
        </Box>
        
        {/* Right side: Message content */}
        <Box style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Box style={{ position: 'relative' }}>
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
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              title={t('common.copy')}
              onClick={handleCopy}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
                pointerEvents: isHovered ? 'auto' : 'none',
              }}
            >
              <IconCopy size={14} />
            </ActionIcon>
          </Box>
        </Box>
      </Group>
    </Box>
  );
}

// Memoize component to prevent unnecessary re-renders
export const MessageItem = React.memo(MessageItemComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.data === nextProps.message.data &&
    prevProps.message.format === nextProps.message.format &&
    prevProps.message.type === nextProps.message.type &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.originalData === nextProps.message.originalData &&
    prevProps.displayFormat === nextProps.displayFormat &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.onResend === nextProps.onResend &&
    prevProps.currentConfig === nextProps.currentConfig
  );
});

