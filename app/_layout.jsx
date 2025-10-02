// app/_layout.jsx
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import TopBarActions from "../components/TopBarActions";
import { initSettings } from "../store/settingsStore";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";

function AppStack() {
  const { colors } = useTheme();

  useEffect(() => {
    initSettings();
  }, []);

  return (
    <>
      <StatusBar style={Platform.OS === "ios" ? "dark" : "light"} />

      <Stack
        screenOptions={{
          headerBackground: () => (
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          ),
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
            letterSpacing: 0.5,
          },
          headerShadowVisible: true,
          contentStyle: {
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          headerRight: () => <TopBarActions />,
        }}
      >
        <Stack.Screen name="index" options={{ title: "📊 Dashboard" }} />
        <Stack.Screen name="import" options={{ title: "📥 Import" }} />
        <Stack.Screen name="preview" options={{ title: "👁 Preview" }} />
        <Stack.Screen name="queue" options={{ title: "📦 Queue" }} />
        <Stack.Screen name="report" options={{ title: "📑 Report" }} />
        <Stack.Screen name="settings" options={{ title: "⚙ Settings" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppStack />
    </ThemeProvider>
  );
}
