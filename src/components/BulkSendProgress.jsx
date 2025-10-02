
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  total: number; sent: number; failed: number;
  paused?: boolean; cancelled?: boolean;
  onPause?: () => void; onResume?: () => void; onCancel?: () => void;
};

export function BulkSendProgress({
  total, sent, failed, paused, cancelled, onPause, onResume, onCancel
}: Props) {
  const progress = total > 0 ? (sent + failed) / total : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bulk sending progress</Text>
      <View style={styles.barOuter}>
        <View style={[styles.barInner, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.stats}>
        {sent} sent · {failed} failed · {total - sent - failed} remaining
      </Text>

      <View style={styles.row}>
        {!paused ? (
          <Pressable style={styles.btn} onPress={onPause}><Text style={styles.btnText}>Pause</Text></Pressable>
        ) : (
          <Pressable style={styles.btn} onPress={onResume}><Text style={styles.btnText}>Resume</Text></Pressable>
        )}
        <Pressable style={[styles.btn, styles.danger]} onPress={onCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </Pressable>
      </View>

      {cancelled ? <Text style={styles.note}>Cancelled</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  title: { fontWeight: '600', marginBottom: 8 },
  barOuter: { height: 10, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  barInner: { height: 10, backgroundColor: '#3b82f6' },
  stats: { marginTop: 8, color: '#333' },
  row: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#111' },
  danger: { backgroundColor: '#b91c1c' },
  btnText: { color: '#fff', fontWeight: '600' },
  note: { marginTop: 6, color: '#b91c1c' }
});
