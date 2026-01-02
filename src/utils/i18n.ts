import enMessages from '../locales/en.json';

// Flatten nested messages for react-intl
function flattenMessages(nestedMessages: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  Object.keys(nestedMessages).forEach((key) => {
    const value = nestedMessages[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      flattened[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(flattened, flattenMessages(value, newKey));
    }
  });
  
  return flattened;
}

export const messages = {
  en: flattenMessages(enMessages),
};

export type Locale = keyof typeof messages;

export const defaultLocale: Locale = 'en';

