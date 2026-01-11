import { useState, useEffect, ReactNode } from 'react';
import { BrowserNotSupportedModal } from './BrowserNotSupportedModal';
import { isWebSerialSupported } from '../utils/webSerialSupport';

interface WebSerialGuardProps {
  children: ReactNode;
}

export function WebSerialGuard({ children }: WebSerialGuardProps) {
  const [isWebSerialAvailable, setIsWebSerialAvailable] = useState<boolean>(true);

  // Check Web Serial API support on mount
  useEffect(() => {
    setIsWebSerialAvailable(isWebSerialSupported());
  }, []);

  return (
    <>
      <BrowserNotSupportedModal opened={!isWebSerialAvailable} />
      {isWebSerialAvailable && children}
    </>
  );
}

