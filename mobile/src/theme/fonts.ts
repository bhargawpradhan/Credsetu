import { Platform } from 'react-native';

export const FONTS = {
  heading: Platform.select({
    web: 'Satoshi, "DM Sans", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    default: 'System',
  }),
  body: Platform.select({
    web: 'Inter, "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    default: 'System',
  }),
  accent: Platform.select({
    web: '"DM Sans", Satoshi, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    default: 'System',
  }),
};
