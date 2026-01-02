import { useState } from 'react';
import { Paper, TextInput, Textarea, Select, Button, Stack, Text, Group, SegmentedControl } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { DataFormat, SerialConnectionConfig, LineEnding } from '../types';
import { FORMAT_OPTIONS, LINE_ENDING_OPTIONS } from '../utils/serialUtils';

interface DataSenderProps {
  isConnected: boolean;
  onSend: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  config: SerialConnectionConfig;
  onConfigChange: (config: SerialConnectionConfig) => void;
}

export function DataSender({ isConnected, onSend, config, onConfigChange }: DataSenderProps) {
  const [data, setData] = useState('');
  const [format, setFormat] = useState<DataFormat>('ascii');
  const [sending, setSending] = useState(false);
  const [lineEnding, setLineEnding] = useState<LineEnding>(config.lineEnding || 'none');
  const [customLineEnding, setCustomLineEnding] = useState(config.customLineEnding || '');

  const handleSend = async () => {
    if (!data.trim() || !isConnected) return;

    setSending(true);
    try {
      const sendConfig: SerialConnectionConfig = {
        ...config,
        // Only apply line ending for ASCII format
        lineEnding: format === 'ascii' ? lineEnding : 'none',
        customLineEnding: format === 'ascii' && lineEnding === 'custom' ? customLineEnding : undefined,
      };
      await onSend(data, format, sendConfig);
      setData(''); // Clear input after successful send
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  return (
    <Paper p="md">
      <Stack gap="md">
        <Text fw={500} size="lg">Send Data</Text>

        <Stack gap="xs">
          <Text size="sm" fw={500}>Format</Text>
          <SegmentedControl
            value={format}
            onChange={(value) => setFormat(value as DataFormat)}
            data={FORMAT_OPTIONS}
            disabled={!isConnected}
            fullWidth
          />
        </Stack>

        <Textarea
          label="Data"
          placeholder={
            format === 'hex' ? 'Enter hex values (e.g., 0xFF 0x00 0x1A or FF 00 1A)' :
            format === 'binary' ? 'Enter binary values (e.g., 0b11111111 0b00000000 or 11111111 00000000)' :
            format === 'decimal' ? 'Enter decimal values (e.g., 255 0 26)' :
            format === 'base64' ? 'Enter base64 string' :
            'Enter text data'
          }
          value={data}
          onChange={(e) => setData(e.currentTarget.value)}
          onKeyDown={handleKeyPress}
          disabled={!isConnected || sending}
          styles={{ input: { fontFamily: 'monospace' } }}
          minRows={3}
          resize="vertical"
        />

        <Text size="xs" c="dimmed">
          {format === 'hex' && 'Format: hex with 0x prefix (0xFF 0x00 0x1A) or space-separated (FF 00 1A)'}
          {format === 'binary' && 'Format: binary with 0b prefix (0b11111111 0b00000000) or space-separated (11111111 00000000)'}
          {format === 'decimal' && 'Format: space-separated decimal values 0-255 (e.g., 255 0 26)'}
          {format === 'base64' && 'Format: base64 encoded string'}
          {format !== 'hex' && format !== 'binary' && format !== 'decimal' && format !== 'base64' && 
            'Press Ctrl+Enter or Cmd+Enter to send'}
        </Text>

        {format === 'ascii' && (
          <>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Line Ending</Text>
              <SegmentedControl
                value={lineEnding}
                onChange={(value) => {
                  setLineEnding(value as LineEnding);
                  const newConfig: SerialConnectionConfig = {
                    ...config,
                    lineEnding: value as LineEnding,
                    customLineEnding: value === 'custom' ? customLineEnding : undefined,
                  };
                  onConfigChange(newConfig);
                }}
                data={LINE_ENDING_OPTIONS}
                disabled={!isConnected}
                fullWidth
              />
            </Stack>

            {lineEnding === 'custom' && (
              <TextInput
                label="Custom Line Ending"
                placeholder="Enter custom line ending"
                value={customLineEnding}
                onChange={(e) => {
                  const newValue = e.currentTarget.value;
                  setCustomLineEnding(newValue);
                  const newConfig: SerialConnectionConfig = {
                    ...config,
                    lineEnding,
                    customLineEnding: newValue,
                  };
                  onConfigChange(newConfig);
                }}
                disabled={!isConnected}
              />
            )}
          </>
        )}

        <Button
          leftSection={<IconSend size={16} />}
          onClick={handleSend}
          disabled={!isConnected || !data.trim() || sending}
          loading={sending}
          fullWidth
        >
          Send
        </Button>
      </Stack>
    </Paper>
  );
}

