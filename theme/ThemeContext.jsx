// theme/ThemeContext.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { baseColors } from "./colors";

const THEME_KEY = "APP_THEME_MODE";
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // default
  const colors = baseColors[mode];

  // Load theme from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_KEY);
        if (savedMode) setMode(savedMode);
      } catch (err) {
        console.log("Error loading theme:", err);
      }
    })();
  }, []);

  // Save theme whenever it changes
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(THEME_KEY, mode);
      } catch (err) {
        console.log("Error saving theme:", err);
      }
    })();
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
