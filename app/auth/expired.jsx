// app/auth/expired.jsx
import { useRouter } from 'expo-router';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { getColors } from '../../assets/colors';

export default function ExpiredAuth() {
  const c = getColors('light');
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>Session expired</Text>
        <Text style={{ color: c.textMuted, textAlign: 'center' }}>Your session has expired. Please sign in again to continue.</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.85} style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: c.brand.primary, borderRadius: 8 }}>
          <Text style={{ color: c.brand.onPrimary, fontWeight: '700' }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
