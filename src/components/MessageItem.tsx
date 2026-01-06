import React, { useMemo, useCallback } from 'react';
import { Group, Text, Code, ActionIcon, Box } from '@mantine/core';
import { IconCopy, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { useIntl } from 'react-intl';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { bytesToString } from '../utils/formatConverter';

/**
 * Highlight CR and LF characters in the display text
 */
function highlightLineEndings(text: string, format: DataFormat, t: (key: string) => string): React.ReactNode {
  const highlightStyle = {
    border: '1px solid var(--mantine-color-text)',
    padding: '2px 4px',
    fontWeight: 600,
  } as const;

  if (format === 'hex') {
    // For hex format, highlight 0D (CR) and 0A (LF) as complete hex bytes
    const parts: React.ReactNode[] = [];
    const regex = /\b(0[dD]|0[aA])\b/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const isCR = match[0].toUpperCase() === '0D';
      parts.push(
        <span
          key={key++}
          style={highlightStyle}
          title={isCR ? t('messageItem.carriageReturnHex') : t('messageItem.lineFeedHex')}
        >
          {match[0]}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  } else if (format === 'ascii' || format === 'utf8') {
    // For ASCII/UTF-8, highlight actual \r and \n characters
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\r' || char === '\n') {
        // Add text before this character
        if (i > lastIndex) {
          parts.push(text.substring(lastIndex, i));
        }

        const isCR = char === '\r';
        parts.push(
          <span
            key={key++}
            style={highlightStyle}
            title={isCR ? t('messageItem.carriageReturn') : t('messageItem.lineFeed')}
          >
            {isCR ? '\\r' : '\\n'}
          </span>
        );

        lastIndex = i + 1;
      }
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }

  return text;
}

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
  const highlightedText = useMemo(() => highlightLineEndings(displayText, formatToUse, t), [displayText, formatToUse, t]);
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
            backgroundColor: 'var(--mantine-color-body)',
            padding: '8px',
            border: '1px solid var(--mantine-color-text)',
            boxShadow: 'var(--mantine-color-text) 5px 5px 0px 0px',
          }}
        >
          <Group gap={4}>
            {isSent ? (
              <IconArrowLeft size={16} color="var(--mantine-color-text)" />
            ) : (
              <IconArrowRight size={16} color="var(--mantine-color-text)" />
            )}
            <Text size="sm" color="var(--mantine-color-text)">
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </Group>
        </Box>

        {/* Right side: Message content */}
        <Box style={{ flex: 1, minWidth: 0, position: 'relative', }}>
          <Box style={{ position: 'relative' }}>
            <Code
              block
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                backgroundColor: 'var(--mantine-color-body)',
                borderRadius: '0px',
                borderBottom: '1px solid var(--mantine-color-text)',
                // boxShadow: 'var(--mantine-color-text) 5px 5px 0px 0px',
              }}
            >
              {highlightedText}
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

