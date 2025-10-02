// components/TopQuickNav.jsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { hexToRgba } from "../assets/colors";

const fallbackColors = {
  queue: "#0D9488",
  dashboard: "#4F46E5",
  settings: "#F59E0B",
};

const getAccent = (colors, key) => {
  if (!colors?.brand) return fallbackColors[key];
  if (key === "queue") return colors.brand.secondary || fallbackColors.queue;
  if (key === "dashboard") return colors.brand.primary || fallbackColors.dashboard;
  if (key === "settings") return colors.brand.accent || fallbackColors.settings;
  return fallbackColors.dashboard;
};

const getSelectedTextColor = (colors, key) => {
  if (!colors?.brand) return "#FFFFFF";
  if (key === "queue") return colors.brand.onSecondary || "#0B1220";
  if (key === "settings") return colors.brand.onAccent || "#0B1220";
  return colors.brand.onPrimary || "#FFFFFF";
};

const tone = (hex, alpha) => {
  if (typeof hex === "string" && hex.startsWith("#") && hex.length === 7) {
    return hexToRgba(hex, alpha);
  }
  return `rgba(79, 70, 229, ${alpha})`;
};

export default function TopQuickNav({ colors, active, hideSettings = false }) {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { key: "queue", label: "Queue", icon: "list-circle-outline", route: "/queue" },
    { key: "dashboard", label: "Dashboard", icon: "home-outline", route: "/" },
  ];

  if (!hideSettings) {
    items.push({ key: "settings", label: "Settings", icon: "settings-outline", route: "/settings" });
  }

  const determineActive = (item) => {
    if (active) return active === item.key;
    if (item.route === "/") return pathname === item.route;
    return pathname.startsWith(item.route);
  };

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {items.map((item) => {
        const accent = getAccent(colors, item.key);
        const selected = determineActive(item);
        const backgroundColor = selected ? accent : tone(accent, 0.12);
        const borderColor = selected ? tone(accent, 0.4) : tone(accent, 0.25);
        const textColor = selected ? getSelectedTextColor(colors, item.key) : accent;
        const iconColor = selected ? getSelectedTextColor(colors, item.key) : accent;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (!selected) router.push(item.route);
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor,
              backgroundColor,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: tone(accent, selected ? 0.45 : 0.2),
              shadowOpacity: selected ? 0.25 : 0.12,
              shadowOffset: { width: 0, height: selected ? 6 : 3 },
              shadowRadius: selected ? 10 : 6,
              elevation: selected ? 6 : 2,
            }}
          >
            <Ionicons name={item.icon} size={18} color={iconColor} />
            <Text style={{ color: textColor, fontWeight: "700" }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
