# Web Serial Communication

A modern, feature-rich web application for serial port communication using the Web Serial API. Built with React, TypeScript, and Mantine UI.

## Features

- 🔌 **Serial Port Management**
  - Connect/disconnect to serial ports
  - Automatic port detection and refresh
  - Request new ports from the browser
  - Configurable baud rates (4800 to 921600)

- 📤 **Data Sending**
  - Multiple data formats: ASCII, Hex, Binary, Decimal, UTF-8, Base64
  - Configurable line endings (CR, LF, CRLF, Custom, None)
  - Real-time format validation
  - Keyboard shortcuts for quick sending

- 📥 **Data Receiving**
  - Real-time message display
  - Configurable read modes (continuous or line-ending based)
  - Multiple line ending detection options
  - Timestamped message history

- 📊 **Message Management**
  - Virtual scrolling for performance with large message lists
  - Message history with sent/received indicators
  - Resend functionality for sent messages
  - Export messages functionality
  - Clear message history
  - Multiple data format display options

- 🎨 **User Interface**
  - Modern, responsive design with Mantine UI
  - Dark/light theme support
  - Resizable split-pane layout
  - Internationalization (i18n) support
  - Intuitive keyboard shortcuts

## Browser Compatibility

This application uses the **Web Serial API**, which is currently supported in:
- ✅ Chrome/Edge 89+
- ✅ Opera 75+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**Note:** The Web Serial API requires a secure context (HTTPS) or localhost.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web-serial
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

## Usage

### Connecting to a Serial Port

1. Click the **"Request New Port"** button or select an available port from the dropdown
2. Select your desired baud rate (default: 115200)
3. Optionally configure read settings:
   - Enable "Read Until Line Ending" to buffer messages until a line ending is detected
   - Select the line ending type (CR, LF, CRLF, or Custom)
4. Click the **Connect** button (plug icon)

### Sending Data

1. Ensure you're connected to a serial port
2. Select your data format (ASCII, Hex, Binary, Decimal, UTF-8, or Base64)
3. Enter your data in the text area
4. For ASCII/UTF-8: Configure line ending if needed
5. Click **Send** or use keyboard shortcuts:
   - **ASCII/UTF-8**: `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - **Other formats**: `Enter`

### Receiving Data

- Received messages appear automatically in the message history panel
- Messages are timestamped and labeled as "Received"
- Use the format selector to view messages in different formats
- Enable "Read Until Line Ending" for line-based protocols

### Message History

- View all sent and received messages in the left panel
- Click on any sent message to resend it
- Use the format selector to view messages in different formats
- Clear the message history using the clear button
- Export messages using the export functionality

## Project Structure

```
web-serial/
├── src/
│   ├── components/          # React components
│   │   ├── ColorSchemeScript.tsx
│   │   ├── DataReceiver.tsx
│   │   ├── DataSender.tsx
│   │   ├── Header.tsx
│   │   ├── MessageHistory.tsx
│   │   ├── MessageItem.tsx
│   │   ├── SentMessages.tsx
│   │   ├── SerialConnection.tsx
│   │   └── ThemeToggle.tsx
│   ├── constants/          # Application constants
│   │   └── index.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useExportMessages.ts
│   │   └── useSerialPort.ts
│   ├── locales/            # Internationalization files
│   │   └── en.json
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   └── web-serial.d.ts
│   ├── utils/              # Utility functions
│   │   ├── formatConverter.ts
│   │   ├── i18n.ts
│   │   └── serialUtils.ts
│   ├── App.tsx             # Main application component
│   ├── App.css
│   ├── index.css
│   └── main.tsx            # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Mantine UI** - Component library
- **React Intl** - Internationalization
- **React Split** - Resizable panes
- **TanStack React Virtual** - Virtual scrolling for performance
- **Web Serial API** - Browser serial port access

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

## Configuration

### Default Settings

- **Default Baud Rate**: 115200
- **Default Line Ending**: None
- **Default Data Format**: ASCII
- **Common Baud Rates**: 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600

These can be modified in `src/constants/index.ts`.

## License

MIT License

Copyright (c) 2026 Aruleeswaran Anbarasan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

[Add contribution guidelines here]

