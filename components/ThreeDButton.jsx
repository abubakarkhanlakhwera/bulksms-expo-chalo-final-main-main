// components/ThreeDButton.jsx
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function ThreeDButton({
  label,
  onPress,
  color1,
  color2,
  disabled = false,
  textColor = "#fff",
  style,
  textStyle,
  children,
}) {
  const [pressed, setPressed] = useState(false);

  const gradientColors = disabled
    ? [color1, color1]
    : pressed
    ? [color2, color1]
    : [color1, color2];

  const content =
    children ?? (
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {label}
      </Text>
    );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) setPressed(true);
      }}
      onPressOut={() => {
        if (!disabled) setPressed(false);
      }}
      disabled={disabled}
      style={[{ borderRadius: 12, opacity: disabled ? 0.85 : 1 }, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.button,
          disabled
            ? styles.buttonDisabled
            : pressed
            ? styles.buttonPressed
            : styles.buttonDefault,
        ]}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDefault: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  buttonPressed: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.5,
  },
});
