// app/index.jsx
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";
import { getQueueState, resetDailyCounts, subscribeQueue } from "../store/queueStore";

export default function HomeScreen() {
  const c = getColors("light");
  const [counts, setCounts] = useState(() => getQueueState().counts);
  useEffect(() => {
    const unsub = subscribeQueue((s) => setCounts(s.counts));
    return unsub;
  }, []);
  return (
    <View style={{ flex: 1, padding: 16, gap: 16, justifyContent: "center" }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "900",
          letterSpacing: 1,
          color: c.brand.primary,
          textShadowColor: '#c7d2fe',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Welcome
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 10 }}>
        Start by importing a CSV or XLSX with columns: <Text style={{ fontWeight: "700", color: c.brand.primary }}>name</Text>,{" "}
        <Text style={{ fontWeight: "700", color: c.brand.primary }}>phone</Text>, <Text style={{ fontWeight: "700", color: c.brand.primary }}>message</Text>.
      </Text>

      <Link href="/import" asChild>
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            backgroundColor: '#e0e7ff',
            paddingVertical: 18,
            paddingHorizontal: 32,
            borderRadius: 18,
            shadowColor: c.brand.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 2,
            borderColor: c.brand.primary,
            marginBottom: 10,
            alignSelf: 'center',
            transform: [{ translateY: -2 }],
          }}
        >
          <Text style={{
            color: c.brand.primary,
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 18,
            letterSpacing: 1,
            textShadowColor: '#fff',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            Start Import
          </Text>
        </TouchableOpacity>
      </Link>
      <View style={{ gap: 14, marginTop: 10 }}>
        <Link href="/queue" asChild>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              backgroundColor: '#22c55e',
              paddingVertical: 16,
              borderRadius: 16,
              shadowColor: '#22c55e',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
              borderWidth: 2,
              borderColor: '#16a34a',
              marginBottom: 2,
              alignSelf: 'stretch',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', letterSpacing: 0.5 }}>
              Open Queue
            </Text>
          </TouchableOpacity>
        </Link>
        <Link href="/report" asChild>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              backgroundColor: '#f59e42',
              paddingVertical: 16,
              borderRadius: 16,
              shadowColor: '#f59e42',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
              borderWidth: 2,
              borderColor: '#ea580c',
              marginBottom: 2,
              alignSelf: 'stretch',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', letterSpacing: 0.5 }}>
              Open Report
            </Text>
          </TouchableOpacity>
        </Link>
        <Link href="/settings" asChild>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              backgroundColor: '#fbbf24',
              paddingVertical: 16,
              borderRadius: 16,
              shadowColor: '#fbbf24',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
              borderWidth: 2,
              borderColor: '#b45309',
              marginBottom: 2,
              alignSelf: 'stretch',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', letterSpacing: 0.5 }}>
              Open Settings
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, color: c.brand.primary, fontWeight: 'bold', marginBottom: 4 }}>
          Total SMS Sent: <Text style={{ color: c.brand.secondary, fontWeight: '900' }}>{counts?.dailySent || 0}</Text>
        </Text>
        <TouchableOpacity
          onPress={resetDailyCounts}
          style={{
            backgroundColor: '#f87171',
            paddingVertical: 8,
            paddingHorizontal: 18,
            borderRadius: 12,
            marginTop: 2,
            shadowColor: '#f87171',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#b91c1c',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Reset Counter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

