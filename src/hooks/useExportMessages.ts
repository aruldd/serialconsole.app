import { useCallback } from 'react';
import { SerialMessage } from '../types';
import { bytesToString } from '../utils/formatConverter';

export function useExportMessages() {
  const exportMessages = useCallback((messages: SerialMessage[]) => {
    const logContent = messages.map((msg) => {
      const timestamp = msg.timestamp.toLocaleString();
      const type = msg.type === 'sent' ? '[SENT]' : '[RECEIVED]';
      const data = bytesToString(msg.data, msg.format);
      return `${timestamp} ${type} [${msg.format.toUpperCase()}]\n${data}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return { exportMessages };
}

