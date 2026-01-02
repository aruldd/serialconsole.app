import { useState } from 'react';
import { Stack } from '@mantine/core';
import Split from 'react-split';
import { useSerialPort } from './hooks/useSerialPort';
import { SerialConnection } from './components/SerialConnection';
import { DataSender } from './components/DataSender';
import { MessageHistory } from './components/MessageHistory';
import { SentMessages } from './components/SentMessages';
import { SerialConnectionConfig } from './types';
import './App.css';

function App() {
  const {
    isConnected,
    messages,
    connect,
    disconnect,
    send,
    clearMessages,
    error,
    portName,
  } = useSerialPort();

  const [config, setConfig] = useState<SerialConnectionConfig>({
    baudRate: 115200,
    lineEnding: 'none',
  });


  return (
    <div style={{ height: '100vh' }}>
      <Split
        direction="horizontal"
        minSize={300}
        sizes={[70, 30]}
        style={{ height: '100vh', display: 'flex' }}
        gutterSize={8}
        gutterAlign="center"
        snapOffset={0}
      >
        {/* Left Pane: Message History */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', }}>
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
          <Stack gap="md" style={{ height: '100%' }}>
            <SerialConnection
              isConnected={isConnected}
              onConnect={connect}
              onDisconnect={disconnect}
              onConfigChange={setConfig}
              error={error}
              portName={portName}
            />
            <DataSender
              isConnected={isConnected}
              onSend={send}
              config={config}
              onConfigChange={setConfig}
            />
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

