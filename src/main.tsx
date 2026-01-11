import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IntlProvider } from 'react-intl';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import App from './App';
import { messages, defaultLocale } from './utils/i18n';
import { MantineColorSchemeScript } from './components/ColorSchemeScript';
import { WebSerialGuard } from './components/WebSerialGuard';
import { mantineTheme } from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineColorSchemeScript />
    <IntlProvider locale={defaultLocale} messages={messages[defaultLocale]}>
      <MantineProvider defaultColorScheme="auto" theme={mantineTheme}>
        <Notifications position="bottom-left" />
        <WebSerialGuard>
          <App />
        </WebSerialGuard>
      </MantineProvider>
    </IntlProvider>
  </React.StrictMode>,
);

