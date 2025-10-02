import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
// If your CSV can contain commas in quotes, use PapaParse:
import Papa from 'papaparse';

export function ImportFromCsv({ onNumbers }: { onNumbers: (numbers: string[]) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel']
    });
    if (res.canceled) return;
    const file = res.assets?.[0];
    if (!file) return;

    setFileName(file.name ?? 'numbers.csv');
    const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });

    const parsed = Papa.parse<string[]>(content, { skipEmptyLines: true });
    if (parsed.errors.length) {
      Alert.alert('CSV error', parsed.errors[0].message);
      return;
    }
    // Take numbers from first column by default
    const firstCol = (parsed.data as any[]).map((row) => String(row[0] ?? ''));
    onNumbers(firstCol);
  }

  return (
    <View>
      <Pressable onPress={pick}><Text style={{ color: '#2563eb' }}>Import numbers from CSV</Text></Pressable>
      {fileName ? <Text>Loaded: {fileName}</Text> : null}
    </View>
  );
}
