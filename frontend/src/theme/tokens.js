/**
 * Toolsphoppe ERP — design tokens.
 * Single source of truth for colour, spacing, radius, shadow and type.
 * Nothing in the app should hard-code a colour; import from here or use the
 * CSS custom properties emitted in styles/global.css.
 */

export const color = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',

  accentBlue: '#2563EB',
  accentTeal: '#0F766E',

  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',
  violet: '#7C3AED',
  violetLight: '#F3E8FF',
  tealLight: '#CCFBF1',

  pageBg: '#F6F8FC',
  card: '#FFFFFF',

  sidebar: '#0B1F3A',
  sidebarSecondary: '#102A4C',
  sidebarActive: '#4F46E5',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  surfaceAlt: '#F8FAFC',
}

export const radius = {
  card: 12,
  table: 12,
  input: 8,
  button: 8,
  badge: 6,
}

export const shadow = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
  cardHover: '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
  modal: '0 12px 32px rgba(15, 23, 42, 0.16), 0 4px 8px rgba(15, 23, 42, 0.06)',
  sidebar: '1px 0 0 rgba(255, 255, 255, 0.04)',
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Inter', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  pageTitle: 24,
  sectionTitle: 16,
  body: 14,
  table: 13,
  label: 13,
  helper: 12,
}

export const motion = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
}

/**
 * Semantic status → tone mapping. Every badge in the app resolves through this,
 * so a status can never pick up a random colour.
 */
export const STATUS_TONE = {
  // Masters
  Active: 'success',
  Inactive: 'neutral',
  // Customer Request stages
  Requested: 'neutral',
  'RFQ Sent': 'info',
  Quoted: 'violet',
  'PO Received': 'primary',
  'Stock In': 'warning',
  Dispatched: 'teal',
  Invoiced: 'info',
  Completed: 'success',
  // Purchase Request
  Open: 'neutral',
  Ordered: 'success',
  // Vendor Quotation
  Received: 'info',
  Selected: 'success',
  Rejected: 'danger',
  // Comparison
  Draft: 'neutral',
  Approved: 'success',
  'Sent to Customer': 'teal',
  // Customer Quotation
  Sent: 'info',
  Accepted: 'success',
  Expired: 'danger',
  // Purchase Order
  'Partially Received': 'warning',
  Closed: 'success',
  // Inward
  Pending: 'warning',
  Added: 'success',
  // Invoices
  Final: 'success',
}

export const TONE = {
  neutral: { fg: '#475569', bg: '#F1F5F9', border: '#E2E8F0', dot: '#94A3B8' },
  primary: { fg: color.primaryDark, bg: color.primaryLight, border: '#C7D2FE', dot: color.primary },
  info: { fg: '#075985', bg: color.infoLight, border: '#BAE6FD', dot: color.info },
  success: { fg: '#15803D', bg: color.successLight, border: '#BBF7D0', dot: color.success },
  warning: { fg: '#B45309', bg: color.warningLight, border: '#FDE68A', dot: color.warning },
  danger: { fg: '#B91C1C', bg: color.dangerLight, border: '#FECACA', dot: color.danger },
  violet: { fg: '#6D28D9', bg: color.violetLight, border: '#DDD6FE', dot: color.violet },
  teal: { fg: '#0F766E', bg: color.tealLight, border: '#99F6E4', dot: color.accentTeal },
}

export const toneOf = (status) => TONE[STATUS_TONE[status] || 'neutral']
