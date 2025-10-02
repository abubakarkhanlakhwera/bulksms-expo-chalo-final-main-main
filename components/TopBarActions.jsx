// components/TopBarActions.jsx
import { usePathname, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";

const Item = ({ label, onPress, active }) => {
  const c = getColors("light");
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? c.brand.primary : c.border,
        backgroundColor: active ? c.brand.primarySoft : "transparent",
        marginLeft: 8,
      }}
    >
      <Text
        style={{
          color: active ? c.brand.primary : c.brand.onPrimary,
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
export default function TopBarActions() {
  const router = useRouter();
  const path = usePathname() || "/";
  const is = (p) => path === p;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 4 }}>
      <Item label="Import" active={is("/import")} onPress={() => router.push("/import")} />
      <Item label="Queue" active={is("/queue")} onPress={() => router.push("/queue")} />
      <Item label="Report" active={is("/report")} onPress={() => router.push("/report")} />
      <Item label="Settings" active={is("/settings")} onPress={() => router.push("/settings")} />
    </View>
  );
}
