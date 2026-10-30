import { I18nManager, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Layout direction is managed in-app instead of through I18nManager.forceRTL,
 * which needs a full reload and does not work in Expo Go. Native RTL is
 * disabled in app.json, but Expo Go on an Arabic device may still report
 * isRTL=true, so every flip is XOR-ed against the native flag.
 */
export function directionStyles(wantRTL: boolean, nativeRTL = I18nManager.isRTL) {
  const flip = wantRTL !== nativeRTL;
  const row: ViewStyle['flexDirection'] = flip ? 'row-reverse' : 'row';
  const start: TextStyle['textAlign'] = flip ? 'right' : 'left';
  return {
    isRTL: wantRTL,
    row,
    textAlign: start,
    writingDirection: (wantRTL ? 'rtl' : 'ltr') as TextStyle['writingDirection'],
    /** Multiply horizontal translations / arrow rotations by this. */
    sign: wantRTL ? -1 : 1,
  };
}

export type Direction = ReturnType<typeof directionStyles>;
