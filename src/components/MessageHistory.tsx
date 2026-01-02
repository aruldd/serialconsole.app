import { useState, useEffect, useRef } from 'react';
import { Paper, Button, Group, Stack, Text, ScrollArea, Switch, Box } from '@mantine/core';
import { IconTrash, IconDownload } from '@tabler/icons-react';
import { useIntl } from 'react-intl';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { useExportMessages } from '../hooks/useExportMessages';
import { MessageItem } from './MessageItem';
import { INITIAL_SCROLL_HEIGHT, AUTO_SCROLL_THRESHOLD } from '../constants';

interface MessageHistoryProps {
  messages: SerialMessage[];
  onClear: () => void;
  onResend?: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  isConnected?: boolean;
  currentConfig?: SerialConnectionConfig;
}

export function MessageHistory({ messages, onClear, onResend, isConnected, currentConfig }: MessageHistoryProps) {
  const intl = useIntl();
  const t = (key: string) => intl.formatMessage({ id: key });
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollHeight, setScrollHeight] = useState(INITIAL_SCROLL_HEIGHT);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { exportMessages } = useExportMessages();

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
    exportMessages(messages);
  };

  return (
    <Paper style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Stack gap="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Group p="md" justify="space-between" align="center" style={{ flexShrink: 0 }}>
          <Text fw={500} size="md">{t('messageHistory.title')}</Text>
          <Group>
            <Switch
              label={t('common.autoScroll')}
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
              title={t('common.clear')}
            >
              <IconTrash size={16} />
            </Button>
            <Button
              onClick={handleExport}
              variant="light"
              disabled={messages.length === 0}
              size="sm"
              title={t('common.export')}
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
              const isAtBottom = scrollHeight - scrollTop - clientHeight < AUTO_SCROLL_THRESHOLD;
              setAutoScroll(isAtBottom);
            }
            }}
          >
          <Stack gap="xs" style={{ paddingBottom: '16px' }}>
            {messages.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                {t('messageHistory.noMessages')}
              </Text>
            ) : (
              messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onResend={onResend}
                  isConnected={isConnected}
                  currentConfig={currentConfig}
                />
              ))
            )}
          </Stack>
          </ScrollArea>
        </Box>
      </Stack>
    </Paper>
  );
}

