import { useState, useEffect, useRef } from 'react';
import { Paper, Select, Stack, Text, ScrollArea, Code } from '@mantine/core';
import { SerialMessage, DataFormat } from '../types';
import { FORMAT_OPTIONS } from '../utils/serialUtils';
import { bytesToString } from '../utils/formatConverter';

interface DataReceiverProps {
  messages: SerialMessage[];
}

export function DataReceiver({ messages }: DataReceiverProps) {
  const [format, setFormat] = useState<DataFormat>('hex');
  const [autoScroll, setAutoScroll] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Get only received messages
  const receivedMessages = messages.filter(m => m.type === 'received');

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [receivedMessages, autoScroll]);

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Text fw={500} size="lg">Received Data</Text>

        <Select
          label="Display Format"
          placeholder="Select format"
          value={format}
          onChange={(value) => value && setFormat(value as DataFormat)}
          data={FORMAT_OPTIONS}
        />

        <ScrollArea
          h={200}
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
          <Stack gap="xs">
            {receivedMessages.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                No data received yet
              </Text>
            ) : (
              receivedMessages.map((message) => {
                const displayText = bytesToString(message.data, format);
                return (
                  <div key={message.id}>
                    <Text size="xs" c="dimmed">
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                    <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {displayText}
                    </Code>
                  </div>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

