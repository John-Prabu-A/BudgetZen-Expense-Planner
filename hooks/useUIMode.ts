import { usePreferences } from '@/context/Preferences';

/**
 * Custom hook that provides spacing values based on UI Mode preference
 * Returns an object with spacing values that adjust based on user's UI Mode selection
 * 
 * Modes:
 * - 'compact': Minimal spacing (70% of standard)
 * - 'standard': Default spacing (100% - baseline)
 * - 'spacious': Extra spacing (130% of standard)
 */
export const useUIMode = () => {
  const { uiMode } = usePreferences();

  // Base spacing unit (in pixels)
  const baseUnit = 4;

  // Define spacing multipliers for each UI mode
  const modeMultiplier = {
    compact: 0.7,
    standard: 1,
    spacious: 1.3,
  };

  const multiplier = modeMultiplier[uiMode];

  // Return spacing values that scale based on UI mode
  return {
    uiMode,
    // Padding/Margin values
    xs: baseUnit * 1 * multiplier,      // 4px * multiplier
    sm: baseUnit * 2 * multiplier,      // 8px * multiplier
    md: baseUnit * 3 * multiplier,      // 12px * multiplier
    lg: baseUnit * 4 * multiplier,      // 16px * multiplier
    xl: baseUnit * 6 * multiplier,      // 24px * multiplier
    xxl: baseUnit * 8 * multiplier,     // 32px * multiplier

    // Common padding patterns
    paddingHorizontal: baseUnit * 4 * multiplier,      // 16px * multiplier
    paddingVertical: baseUnit * 4 * multiplier,        // 16px * multiplier
    paddingHorizontalSmall: baseUnit * 3 * multiplier, // 12px * multiplier
    paddingVerticalSmall: baseUnit * 3 * multiplier,   // 12px * multiplier
    paddingHorizontalLarge: baseUnit * 6 * multiplier, // 24px * multiplier
    paddingVerticalLarge: baseUnit * 6 * multiplier,   // 24px * multiplier

    // Common gap values
    gapSmall: baseUnit * 2 * multiplier,     // 8px * multiplier
    gapMedium: baseUnit * 3 * multiplier,    // 12px * multiplier
    gapLarge: baseUnit * 4 * multiplier,     // 16px * multiplier

    // Card/Container spacing
    cardPadding: baseUnit * 3 * multiplier,    // 12px * multiplier
    containerPadding: baseUnit * 4 * multiplier, // 16px * multiplier
    listItemPadding: baseUnit * 3 * multiplier, // 12px * multiplier

    // Margin bottom for sections
    marginBottomSmall: baseUnit * 2 * multiplier,   // 8px * multiplier
    marginBottomMedium: baseUnit * 3 * multiplier,  // 12px * multiplier
    marginBottomLarge: baseUnit * 6 * multiplier,   // 24px * multiplier
  };
};
