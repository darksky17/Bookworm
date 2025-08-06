import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import theme from '../design-system/theme/theme'; // Adjust import path as needed

const FilterChip = ({
  label,
  isActive = false,
  onPress,
  activeColor = "limegreen",
  inactiveColor = "lightgray",
  textColor,
  activeTextColor,
  inactiveTextColor,
  style,
  textStyle,
  disabled = false,
  ...props
}) => {
  const chipBackgroundColor = isActive ? activeColor : inactiveColor;
  const chipTextColor = textColor || 
    (isActive 
      ? (activeTextColor || theme.colors.text) 
      : (inactiveTextColor || theme.colors.text)
    );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          paddingVertical: theme.spacing.vertical.xs,
          paddingHorizontal: theme.spacing.horizontal.md,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: chipBackgroundColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          {
            fontSize: theme.fontSizes.small,
            fontFamily: theme.fontFamily.regular,
            color: chipTextColor,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default FilterChip;