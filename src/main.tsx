import * as Sentry from '@sentry/react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { mantineTheme } from './theme';

Sentry.init({
  dsn: "https://1bc645e4c2d6d1b73cf349247c88c84b@o4510692838342656.ingest.de.sentry.io/4510692839653456",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.replayIntegration()
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Enable logs to be sent to Sentry
  enableLogs: true
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineColorSchemeScript />
    <IntlProvider locale={defaultLocale} messages={messages[defaultLocale]}>
      <MantineProvider defaultColorScheme="auto" theme={mantineTheme}>
        <Notifications position="bottom-left" />
        <ErrorBoundary>
          <WebSerialGuard>
            <App />
          </WebSerialGuard>
        </ErrorBoundary>
      </MantineProvider>
    </IntlProvider>
  </React.StrictMode>,
);

