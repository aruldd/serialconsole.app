import { useState } from 'react';
import { Paper, Button, Group, Badge, Stack, Text, Combobox, useCombobox, InputBase } from '@mantine/core';
import { IconPlugConnected, IconPlugConnectedX } from '@tabler/icons-react';
import { useIntl } from 'react-intl';
import { COMMON_BAUD_RATES } from '../utils/serialUtils';
import { SerialConnectionConfig } from '../types';
import { DEFAULT_LINE_ENDING, DEFAULT_BAUD_RATE } from '../constants';

interface SerialConnectionProps {
  isConnected: boolean;
  onConnect: (baudRate: number) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConfigChange: (config: SerialConnectionConfig) => void;
  portName: string | null;
}

export function SerialConnection({
  isConnected,
  onConnect,
  onDisconnect,
  onConfigChange,
  portName,
}: SerialConnectionProps) {
  const intl = useIntl();
  const t = (key: string) => intl.formatMessage({ id: key });
  const [baudRate, setBaudRate] = useState<string>(DEFAULT_BAUD_RATE.toString());
  const baudRateCombobox = useCombobox({
    onDropdownClose: () => baudRateCombobox.resetSelectedOption(),
  });

  const handleConnect = async () => {
    const config: SerialConnectionConfig = {
      baudRate: parseInt(baudRate, 10),
      lineEnding: DEFAULT_LINE_ENDING, // Default, will be overridden by DataSender
    };
    onConfigChange(config);
    try {
      await onConnect(config.baudRate);
    } catch (err) {
      console.error('[SerialConnection] Error in onConnect:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
    } catch (err) {
      console.error('[SerialConnection] Error in onDisconnect:', err);
    }
  };

  return (
    <Paper p="md">
      <Stack gap="md">
        <Text fw={500} size="md">{t('serialConnection.title')}</Text>
        <Group gap="xs" align="center" justify="space-between">
          <Group gap="xs" align="center">
            <Badge color={isConnected ? 'green' : 'gray'} size="lg">
              {isConnected ? t('common.connected') : t('common.disconnected')}
            </Badge>
            {isConnected && portName && (
              <Text size="sm" c="dimmed">
                {portName}
              </Text>
            )}
          </Group>
          <Group gap="xs" align="center">
            <Combobox
              store={baudRateCombobox}
              onOptionSubmit={(val) => {
                setBaudRate(val);
                baudRateCombobox.closeDropdown();
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => !isConnected && baudRateCombobox.toggleDropdown()}
                  disabled={isConnected}
                  style={{ width: 120 }}
                  size="sm"
                >
                  {baudRate || <span style={{ color: 'var(--mantine-color-dimmed)' }}>{t('serialConnection.baudRate')}</span>}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {COMMON_BAUD_RATES.map((rate) => (
                    <Combobox.Option value={rate.toString()} key={rate}>
                      {rate}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={!baudRate}
                title={t('common.connect')}
              >
                <IconPlugConnectedX size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                color="red"
                title={t('common.disconnect')}
              >
                <IconPlugConnected size={16} />
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}

