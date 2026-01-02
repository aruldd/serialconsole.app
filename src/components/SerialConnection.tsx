import { ActionIcon, Button, Combobox, Group, InputBase, Paper, SegmentedControl, Stack, Switch, Text, useCombobox } from '@mantine/core';
import { IconPlugConnected, IconPlugConnectedX, IconRefresh } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { DEFAULT_BAUD_RATE, DEFAULT_LINE_ENDING } from '../constants';
import { LineEnding, SerialConnectionConfig, SerialPortOption } from '../types';
import { COMMON_BAUD_RATES, getLineEndingOptions } from '../utils/serialUtils';

interface SerialConnectionProps {
  isConnected: boolean;
  onConnect: (baudRate: number, selectedPort?: SerialPort) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConfigChange: (config: SerialConnectionConfig) => void;
  portName: string | null;
  availablePorts: SerialPortOption[];
  refreshPorts: () => Promise<void>;
  requestNewPort: () => Promise<SerialPort | null>;
  setReadConfig: (config: SerialConnectionConfig) => void;
}

export function SerialConnection({
  isConnected,
  onConnect,
  onDisconnect,
  onConfigChange,
  availablePorts,
  refreshPorts,
  requestNewPort,
  setReadConfig,
}: SerialConnectionProps) {
  const intl = useIntl();
  const t = (key: string) => intl.formatMessage({ id: key });
  const [baudRate, setBaudRate] = useState<string>(DEFAULT_BAUD_RATE.toString());
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [readUntilLineEnding, setReadUntilLineEnding] = useState(false);
  const [readLineEnding, setReadLineEnding] = useState<LineEnding>('crlf');
  const [readCustomLineEnding, setReadCustomLineEnding] = useState<string>('');
  const pendingPortRef = useRef<SerialPort | null>(null);
  
  const baudRateCombobox = useCombobox({
    onDropdownClose: () => baudRateCombobox.resetSelectedOption(),
  });
  
  const portCombobox = useCombobox({
    onDropdownClose: () => portCombobox.resetSelectedOption(),
  });

  const lineEndingOptions = useMemo(() => getLineEndingOptions(t), [t]);

  // Auto-select newly requested port when it appears in availablePorts
  useEffect(() => {
    if (pendingPortRef.current && availablePorts.length > 0) {
      const pendingPort = pendingPortRef.current;
      const newPortInfo = pendingPort.getInfo();
      const vendorId = newPortInfo.usbVendorId;
      const productId = newPortInfo.usbProductId;
      
      const matchingPort = availablePorts.find(p => {
        const info = p.port.getInfo();
        return info.usbVendorId === vendorId && info.usbProductId === productId;
      });
      
      if (matchingPort) {
        setSelectedPortId(matchingPort.id);
        pendingPortRef.current = null;
      }
    }
  }, [availablePorts]);

  const handleConnect = async () => {
    const config: SerialConnectionConfig = {
      baudRate: parseInt(baudRate, 10),
      lineEnding: DEFAULT_LINE_ENDING, // Default, will be overridden by DataSender
      readUntilLineEnding,
      readLineEnding,
      readCustomLineEnding: readLineEnding === 'custom' ? readCustomLineEnding : undefined,
    };
    onConfigChange(config);
    setReadConfig(config);
    try {
      // Find selected port if one is selected
      const selectedPort = selectedPortId 
        ? availablePorts.find(p => p.id === selectedPortId)?.port
        : undefined;
      
      await onConnect(config.baudRate, selectedPort);
    } catch (err) {
      console.error('[SerialConnection] Error in onConnect:', err);
    }
  };

  const handleRequestNewPort = async () => {
    try {
      const newPort = await requestNewPort();
      if (newPort) {
        // Store the port reference to auto-select it when ports refresh
        pendingPortRef.current = newPort;
        // Refresh ports to get the new one in the list
        await refreshPorts();
      }
    } catch (err) {
      console.error('[SerialConnection] Error requesting new port:', err);
    }
  };

  const handleRefreshPorts = async () => {
    await refreshPorts();
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
    } catch (err) {
      console.error('[SerialConnection] Error in onDisconnect:', err);
    }
  };

  const selectedPortName = selectedPortId 
    ? availablePorts.find(p => p.id === selectedPortId)?.name 
    : null;

  return (
    <Paper p="md">
      <Stack gap="md">
        <Text fw={500} size="md">{t('serialConnection.title')}</Text>
        <Group gap="xs" align="center" justify="space-between">
          <Group gap="xs" align="center">
            {availablePorts.length > 0 && (
              <>
                <Combobox
                  store={portCombobox}
                  onOptionSubmit={(val) => {
                    setSelectedPortId(val);
                    portCombobox.closeDropdown();
                  }}
                >
                  <Combobox.Target>
                    <InputBase
                      component="button"
                      type="button"
                      pointer
                      rightSection={<Combobox.Chevron />}
                      onClick={() => !isConnected && portCombobox.toggleDropdown()}
                      disabled={isConnected}
                      style={{ width: 150 }}
                      size="sm"
                    >
                      {selectedPortName || <span style={{ color: 'var(--mantine-color-dimmed)' }}>{t('serialConnection.selectPort')}</span>}
                    </InputBase>
                  </Combobox.Target>

                  <Combobox.Dropdown>
                    <Combobox.Options>
                      {availablePorts.map((portOption) => (
                        <Combobox.Option value={portOption.id} key={portOption.id}>
                          {portOption.name}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Combobox.Dropdown>
                </Combobox>
                <ActionIcon
                  variant="subtle"
                  onClick={handleRefreshPorts}
                  disabled={isConnected}
                  title={t('serialConnection.refreshPorts')}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </>
            )}
            <Button
              variant="light"
              size="sm"
              onClick={handleRequestNewPort}
              disabled={isConnected}
              title={t('serialConnection.requestNewPort')}
            >
              {t('serialConnection.requestNewPort')}
            </Button>
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
                <IconPlugConnected size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                color="red"
                title={t('common.disconnect')}
              >
                <IconPlugConnectedX size={16} />
              </Button>
            )}
          </Group>
        </Group>
        <Switch
          label={t('serialConnection.readUntilLineEnding')}
          checked={readUntilLineEnding}
          onChange={(e) => {
            const newValue = e.currentTarget.checked;
            setReadUntilLineEnding(newValue);
            const config: SerialConnectionConfig = {
              baudRate: parseInt(baudRate, 10),
              lineEnding: DEFAULT_LINE_ENDING,
              readUntilLineEnding: newValue,
              readLineEnding,
              readCustomLineEnding: readLineEnding === 'custom' ? readCustomLineEnding : undefined,
            };
            onConfigChange(config);
            setReadConfig(config);
          }}
          size="sm"
        />
        {readUntilLineEnding && (
          <Group gap="xs" align="center">
            <Text size="sm" fw={500}>{t('serialConnection.readLineEnding')}</Text>
            <SegmentedControl
              value={readLineEnding}
              onChange={(value) => {
                const newReadLineEnding = value as LineEnding;
                setReadLineEnding(newReadLineEnding);
                const config: SerialConnectionConfig = {
                  baudRate: parseInt(baudRate, 10),
                  lineEnding: DEFAULT_LINE_ENDING,
                  readUntilLineEnding,
                  readLineEnding: newReadLineEnding,
                  readCustomLineEnding: newReadLineEnding === 'custom' ? readCustomLineEnding : undefined,
                };
                onConfigChange(config);
                setReadConfig(config);
              }}
              data={lineEndingOptions}
              size="sm"
            />
            {readLineEnding === 'custom' && (
              <InputBase
                placeholder={t('serialConnection.customLineEndingPlaceholder')}
                value={readCustomLineEnding}
                onChange={(e) => {
                  const newValue = e.currentTarget.value;
                  setReadCustomLineEnding(newValue);
                  const config: SerialConnectionConfig = {
                    baudRate: parseInt(baudRate, 10),
                    lineEnding: DEFAULT_LINE_ENDING,
                    readUntilLineEnding,
                    readLineEnding,
                    readCustomLineEnding: newValue,
                  };
                  onConfigChange(config);
                  setReadConfig(config);
                }}
                size="sm"
                style={{ width: 150 }}
              />
            )}
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

