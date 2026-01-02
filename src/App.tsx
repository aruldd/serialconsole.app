import { useState } from 'react';
import { Stack, Divider } from '@mantine/core';
import Split from 'react-split';
import { useSerialPort } from './hooks/useSerialPort';
import { Header } from './components/Header';
import { SerialConnection } from './components/SerialConnection';
import { DataSender } from './components/DataSender';
import { MessageHistory } from './components/MessageHistory';
import { SentMessages } from './components/SentMessages';
import { SerialConnectionConfig } from './types';
import { DEFAULT_BAUD_RATE, DEFAULT_LINE_ENDING, SPLIT_PANE_SIZES, SPLIT_PANE_MIN_SIZE, SPLIT_GUTTER_SIZE } from './constants';
import './App.css';

function App() {
  const {
    isConnected,
    messages,
    connect,
    disconnect,
    send,
    clearMessages,
    portName,
    availablePorts,
    refreshPorts,
    requestNewPort,
  } = useSerialPort();

  const [config, setConfig] = useState<SerialConnectionConfig>({
    baudRate: DEFAULT_BAUD_RATE,
    lineEnding: DEFAULT_LINE_ENDING,
  });


  return (
    <div style={{ height: '100vh' }}>
      <Split
        direction="horizontal"
        minSize={SPLIT_PANE_MIN_SIZE}
        sizes={[...SPLIT_PANE_SIZES]}
        style={{ height: '100vh', display: 'flex' }}
        gutterSize={SPLIT_GUTTER_SIZE}
        gutterAlign="center"
        snapOffset={0}
      >
        {/* Left Pane: Message History */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MessageHistory
            messages={messages}
            onClear={clearMessages}
            onResend={send}
            isConnected={isConnected}
            currentConfig={config}
          />
        </div>

        {/* Right Pane: Connection and Send Tools */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',  }}>
          <Stack gap={0} style={{ height: '100%' }}>
            <Header />
            <Divider />
            <SerialConnection
              isConnected={isConnected}
              onConnect={connect}
              onDisconnect={disconnect}
              onConfigChange={setConfig}
              portName={portName}
              availablePorts={availablePorts}
              refreshPorts={refreshPorts}
              requestNewPort={requestNewPort}
            />
            <Divider />
            <DataSender
              isConnected={isConnected}
              onSend={send}
              config={config}
              onConfigChange={setConfig}
            />
            <Divider />
            <SentMessages
              messages={messages}
              onResend={send}
              isConnected={isConnected}
              currentConfig={config}
            />
          </Stack>
        </div>
      </Split>
    </div>
  );
}

export default App;

