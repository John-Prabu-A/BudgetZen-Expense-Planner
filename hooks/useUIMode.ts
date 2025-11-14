import { usePreferences } from '@/context/Preferences';

/**
 * Custom hook that provides responsive spacing and font sizes based on UI Mode preference
 * Returns an object with values that adjust based on user's UI Mode selection
 *
 * Modes:
 * - 'compact': Minimal spacing and smaller fonts (80% of standard)
 * - 'standard': Default spacing and fonts (100% - baseline)
 * - 'spacious': Extra spacing and larger fonts (120% of standard)
 */
export const useUIMode = () => {
  const { uiMode } = usePreferences();

  // Base units (in pixels)
  const baseSpacingUnit = 4;
  const baseFontSize = 16;

  // Define multipliers for each UI mode
  const modeMultipliers = {
    compact: {
      spacing: 0.8,
      font: 0.9,
    },
    standard: {
      spacing: 1,
      font: 1,
    },
    spacious: {
      spacing: 1.2,
      font: 1.1,
    },
  };

  const { spacing: spacingMultiplier, font: fontMultiplier } = modeMultipliers[uiMode];

  // Dynamically calculate spacing and font sizes
  const dynamicSizes = {
    // Spacing values
    xs: baseSpacingUnit * 1 * spacingMultiplier,      // 4px
    sm: baseSpacingUnit * 2 * spacingMultiplier,      // 8px
    md: baseSpacingUnit * 3 * spacingMultiplier,      // 12px
    lg: baseSpacingUnit * 4 * spacingMultiplier,      // 16px
    xl: baseSpacingUnit * 6 * spacingMultiplier,      // 24px
    xxl: baseSpacingUnit * 8 * spacingMultiplier,     // 32px

    // Font size values
    fontXs: baseFontSize * 0.75 * fontMultiplier, // 12px
    fontSm: baseFontSize * 0.875 * fontMultiplier, // 14px
    fontMd: baseFontSize * 1 * fontMultiplier,     // 16px
    fontLg: baseFontSize * 1.125 * fontMultiplier, // 18px
    fontXl: baseFontSize * 1.25 * fontMultiplier,  // 20px
    fontXxl: baseFontSize * 1.5 * fontMultiplier, // 24px

    // Common padding patterns
    paddingHorizontal: baseSpacingUnit * 4 * spacingMultiplier, // 16px
    paddingVertical: baseSpacingUnit * 4 * spacingMultiplier,   // 16px

    // Common gap values
    gapSmall: baseSpacingUnit * 2 * spacingMultiplier,  // 8px
    gapMedium: baseSpacingUnit * 3 * spacingMultiplier, // 12px
    gapLarge: baseSpacingUnit * 4 * spacingMultiplier,  // 16px

    // Card/Container spacing
    cardPadding: baseSpacingUnit * 3 * spacingMultiplier,   // 12px
    containerPadding: baseSpacingUnit * 4 * spacingMultiplier, // 16px

    // Margin bottom for sections
    marginBottom: baseSpacingUnit * 4 * spacingMultiplier, // 16px
  };

  return { ...dynamicSizes, uiMode };
};
