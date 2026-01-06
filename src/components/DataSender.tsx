import { useState, useMemo } from 'react';
import { Paper, TextInput, Textarea, Button, Stack, Text, SegmentedControl, Kbd } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useIntl, FormattedMessage } from 'react-intl';
import { DataFormat, SerialConnectionConfig, LineEnding } from '../types';
import { getFormatOptions, getLineEndingOptions } from '../utils/serialUtils';
import { stringToBytes } from '../utils/formatConverter';
import { DEFAULT_DATA_FORMAT, DEFAULT_LINE_ENDING } from '../constants';

interface DataSenderProps {
  isConnected: boolean;
  onSend: (data: string, format: DataFormat, config: SerialConnectionConfig) => Promise<void>;
  config: SerialConnectionConfig;
  onConfigChange: (config: SerialConnectionConfig) => void;
}

export function DataSender({ isConnected, onSend, config, onConfigChange }: DataSenderProps) {
  const intl = useIntl();
  const t = (key: string, values?: Record<string, any>) => intl.formatMessage({ id: key }, values);
  const [data, setData] = useState('');
  const [format, setFormat] = useState<DataFormat>(DEFAULT_DATA_FORMAT);
  const [sending, setSending] = useState(false);
  const [lineEnding, setLineEnding] = useState<LineEnding>(config.lineEnding || DEFAULT_LINE_ENDING);
  const [customLineEnding, setCustomLineEnding] = useState(config.customLineEnding || '');
  
  const formatOptions = useMemo(() => getFormatOptions(t), [t]);
  const lineEndingOptions = useMemo(() => getLineEndingOptions(t), [t]);

  // Validate data based on format
  const validation = useMemo(() => {
    if (!data.trim()) {
      return { isValid: true, error: null }; // Empty is valid (just can't send)
    }
    
    const result = stringToBytes(data, format);
    return {
      isValid: !result.error,
      error: result.error || null,
    };
  }, [data, format]);

  const handleSend = async () => {
    if (!data.trim() || !isConnected || !validation.isValid) return;

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
      console.error('[DataSender] Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // For non-ASCII formats, Enter alone sends
    // For ASCII format, Ctrl+Enter or Cmd+Enter sends
    if (format !== 'ascii' && format !== 'utf8') {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    } else {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const getDescription = () => {
    const enterKey = <Kbd size="xs">Enter</Kbd>;
    const ctrlKey = <Kbd size="xs">Ctrl</Kbd>;
    const cmdKey = <Kbd size="xs">Cmd</Kbd>;
    
    if (format === 'hex') {
      return (
        <FormattedMessage
          id="dataSender.formatHex"
          values={{ enter: enterKey }}
        />
      );
    }
    if (format === 'binary') {
      return (
        <FormattedMessage
          id="dataSender.formatBinary"
          values={{ enter: enterKey }}
        />
      );
    }
    if (format === 'decimal') {
      return (
        <FormattedMessage
          id="dataSender.formatDecimal"
          values={{ enter: enterKey }}
        />
      );
    }
    if (format === 'base64') {
      return (
        <FormattedMessage
          id="dataSender.formatBase64"
          values={{ enter: enterKey }}
        />
      );
    }
    return (
      <FormattedMessage
        id="dataSender.formatAscii"
        values={{ ctrl: ctrlKey, enter: enterKey, cmd: cmdKey }}
      />
    );
  };
  
  const getPlaceholder = () => {
    if (format === 'hex') return t('dataSender.placeholderHex');
    if (format === 'binary') return t('dataSender.placeholderBinary');
    if (format === 'decimal') return t('dataSender.placeholderDecimal');
    if (format === 'base64') return t('dataSender.placeholderBase64');
    return t('dataSender.placeholderText');
  };

  return (
    <Paper p="md">
      <Stack gap="md">
        <Text fw={500} size="md">{t('dataSender.title')}</Text>

        <Stack gap="xs">
          <Text size="sm" fw={500}>{t('common.format')}</Text>
          <SegmentedControl
            value={format}
            onChange={(value) => setFormat(value as DataFormat)}
            data={formatOptions}
            disabled={!isConnected}
            fullWidth
          />
        </Stack>

        <Textarea
          label={t('dataSender.dataLabel')}
          placeholder={getPlaceholder()}
          description={getDescription()}
          value={data}
          onChange={(e) => setData(e.currentTarget.value)}
          onKeyDown={handleKeyPress}
          disabled={!isConnected || sending}
          error={validation.error || undefined}
          styles={{ input: { fontFamily: 'monospace' } }}
          minRows={3}
          resize="vertical"
        />

        {format === 'ascii' && (
          <>
            <Stack gap="xs">
              <Text size="sm" fw={500}>{t('dataSender.lineEnding')}</Text>
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
                data={lineEndingOptions}
                disabled={!isConnected}
                fullWidth
              />
            </Stack>

            {lineEnding === 'custom' && (
              <TextInput
                label={t('dataSender.customLineEnding')}
                placeholder={t('dataSender.customLineEndingPlaceholder')}
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
          variant="outline"
          leftSection={<IconSend size={16} />}
          onClick={handleSend}
          disabled={!isConnected || !data.trim() || sending || !validation.isValid}
          loading={sending}
          fullWidth
        >
          {t('common.send')}
        </Button>
      </Stack>
    </Paper>
  );
}

