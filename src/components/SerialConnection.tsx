import { useState } from 'react';
import { Paper, Button, Group, Badge, Stack, Text, Combobox, useCombobox, InputBase } from '@mantine/core';
import { IconPlugConnected, IconPlugConnectedX } from '@tabler/icons-react';
import { COMMON_BAUD_RATES } from '../utils/serialUtils';
import { SerialConnectionConfig } from '../types';

interface SerialConnectionProps {
  isConnected: boolean;
  onConnect: (baudRate: number) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConfigChange: (config: SerialConnectionConfig) => void;
  error: string | null;
  portName: string | null;
}

export function SerialConnection({
  isConnected,
  onConnect,
  onDisconnect,
  onConfigChange,
  error,
  portName,
}: SerialConnectionProps) {
  const [baudRate, setBaudRate] = useState<string>('115200');
  const baudRateCombobox = useCombobox({
    onDropdownClose: () => baudRateCombobox.resetSelectedOption(),
  });

  const handleConnect = async () => {
    console.log('[SerialConnection] Connect button clicked');
    const config: SerialConnectionConfig = {
      baudRate: parseInt(baudRate, 10),
      lineEnding: 'none', // Default, will be overridden by DataSender
    };
    console.log('[SerialConnection] Config:', config);
    onConfigChange(config);
    console.log('[SerialConnection] Calling onConnect with baudRate:', config.baudRate);
    try {
      await onConnect(config.baudRate);
      console.log('[SerialConnection] onConnect completed');
    } catch (err) {
      console.error('[SerialConnection] Error in onConnect:', err);
    }
  };

  const handleDisconnect = async () => {
    console.log('[SerialConnection] Disconnect button clicked');
    try {
      await onDisconnect();
      console.log('[SerialConnection] onDisconnect completed');
    } catch (err) {
      console.error('[SerialConnection] Error in onDisconnect:', err);
    }
  };

  return (
    <Paper p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Text fw={500} size="lg">Serial Connection</Text>
            <Badge color={isConnected ? 'green' : 'gray'} size="sm">
              {isConnected ? 'Connected' : 'Disconnected'}
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
                  {baudRate || <span style={{ color: 'var(--mantine-color-dimmed)' }}>Baud Rate</span>}
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
                title="Connect"
              >
                <IconPlugConnectedX size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                color="red"
                title="Disconnect"
              >
                <IconPlugConnected size={16} />
              </Button>
            )}
          </Group>
        </Group>

        {error && (
          <Text c="red" size="sm">{error}</Text>
        )}

      </Stack>
    </Paper>
  );
}

