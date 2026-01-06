import { useState, useEffect, useRef, useMemo } from 'react';
import { Paper, Group, Stack, Text, Checkbox, Box, Combobox, useCombobox, InputBase, ActionIcon } from '@mantine/core';
import { IconTrash, IconDownload, IconArrowsUpDown } from '@tabler/icons-react';
import { useIntl } from 'react-intl';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SerialMessage, DataFormat, SerialConnectionConfig } from '../types';
import { useExportMessages } from '../hooks/useExportMessages';
import { MessageItem } from './MessageItem';
import { AUTO_SCROLL_THRESHOLD } from '../constants';
import { getFormatOptions } from '../utils/serialUtils';

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
  const [displayFormat, setDisplayFormat] = useState<DataFormat>('ascii');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const parentRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const previousSortOrderRef = useRef<'asc' | 'desc'>('desc');
  const { exportMessages } = useExportMessages();

  const formatCombobox = useCombobox({
    onDropdownClose: () => formatCombobox.resetSelectedOption(),
  });

  const formatOptions = useMemo(() => {
    return getFormatOptions(t);
  }, [t]);

  const selectedFormatLabel = useMemo(() => {
    return formatOptions.find(opt => opt.value === displayFormat)?.label || displayFormat;
  }, [displayFormat, formatOptions]);

  const handleExport = () => {
    exportMessages(messages);
  };

  const sortedMessages = useMemo(() => {
    const sorted = [...messages];
    sorted.sort((a, b) => {
      const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
      return sortOrder === 'asc' ? timeDiff : -timeDiff;
    });
    return sorted;
  }, [messages, sortOrder]);

  // Virtual scrolling setup with dynamic size measurement
  const virtualizer = useVirtualizer({
    count: sortedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Initial estimate, will be measured dynamically
    overscan: 5, // Render 5 extra items outside viewport for smooth scrolling
    gap: 8, // Gap between items (matches xs gap)
  });

  // Auto-scroll when new messages arrive (throttled)
  // Scroll to top when sortOrder is 'desc' (newest at top), to bottom when 'asc' (oldest at top)
  // Only scroll if new messages were added (not on format change or sort change)
  useEffect(() => {
    const messageCountChanged = sortedMessages.length !== previousMessageCountRef.current;
    previousMessageCountRef.current = sortedMessages.length;

    if (!autoScroll || sortedMessages.length === 0 || !parentRef.current || !messageCountChanged) {
      return;
    }

    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scrollToPosition = () => {
      if (parentRef.current) {
        const scrollElement = parentRef.current;
        // Scroll to top when newest is at top (desc), to bottom when oldest is at top (asc)
        scrollElement.scrollTop = sortOrder === 'desc' ? 0 : scrollElement.scrollHeight;
      }
    };

    // Use requestAnimationFrame for smooth scrolling
    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(scrollToPosition, 0);
    });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [sortedMessages.length, autoScroll, sortOrder]);

  // Handle scroll position to update auto-scroll state (throttled for performance)
  // When sortOrder is 'desc' (newest at top), check if at top. When 'asc' (oldest at top), check if at bottom.
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      // Throttle scroll event handling
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        if (sortOrder === 'desc') {
          // When newest is at top, auto-scroll if user is near the top
          const isAtTop = scrollTop < AUTO_SCROLL_THRESHOLD;
          setAutoScroll(isAtTop);
        } else {
          // When oldest is at top, auto-scroll if user is near the bottom
          const isAtBottom = scrollHeight - scrollTop - clientHeight < AUTO_SCROLL_THRESHOLD;
          setAutoScroll(isAtBottom);
        }
      }, 100); // Throttle to every 100ms
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [sortOrder]);

  // Scroll to top when sort order changes to 'desc' (newest to oldest)
  useEffect(() => {
    const sortOrderChanged = sortOrder !== previousSortOrderRef.current;
    previousSortOrderRef.current = sortOrder;

    if (sortOrderChanged && sortOrder === 'desc' && parentRef.current && sortedMessages.length > 0) {
      // Scroll to top when switching to newest first
      requestAnimationFrame(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = 0;
        }
      });
    }
  }, [sortOrder, sortedMessages.length]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Paper style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack gap="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Stack gap="xs" p="md" style={{ flexShrink: 0, borderBottom: '1.5px solid var(--mantine-color-text)' }}>
          <Group justify="space-between" align="center">
            <Text fw={500} size="md">{t('messageHistory.title')}</Text>
            <Group>
              <Checkbox
                variant="outline"
                label={t('common.autoScroll')}
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.currentTarget.checked)}
                size="sm"
              />
              <Combobox
                store={formatCombobox}
                onOptionSubmit={(val) => {
                  setDisplayFormat(val as DataFormat);
                  formatCombobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron />}
                    onClick={() => formatCombobox.toggleDropdown()}
                    style={{ width: 120 }}
                    size="sm"
                  >
                    {selectedFormatLabel}
                  </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {formatOptions.map((option) => (
                      <Combobox.Option value={option.value} key={option.value}>
                        {option.label}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
              <ActionIcon
                onClick={onClear}
                variant="outline"
                color="red"
                disabled={messages.length === 0}
                size="lg"
                title={t('common.clear')}
              >
                <IconTrash size={16} />
              </ActionIcon>
              <ActionIcon
                onClick={toggleSortOrder}
                variant="outline"
                disabled={messages.length === 0}
                size="lg"
                title={sortOrder === 'asc' ? t('messageHistory.sortDescending') : t('messageHistory.sortAscending')}
              >
                <IconArrowsUpDown size={16} />
              </ActionIcon>
              <ActionIcon
                onClick={handleExport}
                variant="outline"
                disabled={messages.length === 0}
                size="lg"
                title={t('common.export')}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Stack>

        <Box
          ref={parentRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {sortedMessages.length === 0 ? (
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Text c="dimmed" size="sm" ta="center" py="xl">
                {t('messageHistory.noMessages')}
              </Text>
            </Box>
          ) : (
            <Box
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const message = sortedMessages[virtualItem.index];
                return (
                  <div
                    key={message.id}
                    data-index={virtualItem.index}
                    ref={(node) => {
                      if (node) {
                        virtualizer.measureElement(node);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <MessageItem
                      message={message}
                      onResend={onResend}
                      isConnected={isConnected}
                      currentConfig={currentConfig}
                      displayFormat={displayFormat}
                    />
                  </div>
                );
              })}
            </Box>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

