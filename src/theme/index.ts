export const colors = {
  bg: '#0B1020',
  bg2: '#141B30',
  bg3: '#1C2542',
  purple: '#7046C8',
  purpleDeep: '#3A2470',
  gold: '#D6B477',
  goldDim: '#8E7546',
  blue: '#39B8FF',
  fire: '#FF8738',
  text: '#F5F1E8',
  textDim: '#AEB5CB',
  danger: '#FF5D6C',
  success: '#5BD69B',
  overlay: 'rgba(11,16,32,0.72)',
  glass: 'rgba(20,27,48,0.78)',
  border: 'rgba(214,180,119,0.35)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const fonts = {
  display: 'Cinzel_700Bold',
  displayRegular: 'Cinzel_400Regular',
  body: 'Lora_400Regular',
  bodyItalic: 'Lora_400Regular_Italic',
  bodyBold: 'Lora_700Bold',
  arabic: 'Cairo_400Regular',
  arabicBold: 'Cairo_700Bold',
} as const;

/** Minimum touch target recommended by both platform guidelines. */
export const TOUCH = 48;
