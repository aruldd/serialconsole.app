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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineColorSchemeScript />
    <IntlProvider locale={defaultLocale} messages={messages[defaultLocale]}>
      <MantineProvider defaultColorScheme="auto">
        <Notifications position="bottom-left" />
        <App />
      </MantineProvider>
    </IntlProvider>
  </React.StrictMode>,
);

