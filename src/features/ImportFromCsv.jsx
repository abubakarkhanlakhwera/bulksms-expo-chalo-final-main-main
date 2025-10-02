import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
// If your CSV can contain commas in quotes, use PapaParse:
import Papa from 'papaparse';

export function ImportFromCsv({ onNumbers }) {
  const [fileName, setFileName] = useState(null);

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel']
    });
    if (res.canceled) return;
    const files = (res.assets || []).filter(Boolean);
    if (!files.length) return;

    let allNumbers = [];

    for (const file of files) {
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsed = Papa.parse(content, { skipEmptyLines: true });
      if (parsed.errors.length) {
        Alert.alert('CSV error', `${file.name || 'File'}: ${parsed.errors[0].message}`);
        return;
      }
      const firstCol = parsed.data.map((row) => String(row?.[0] ?? ''));
      allNumbers = allNumbers.concat(firstCol);
    }

    const summaryName = files.length === 1
      ? files[0].name ?? 'numbers.csv'
      : `${files.length} files selected`;
    setFileName(summaryName);
    onNumbers(allNumbers);
  }

  return (
    <View>
      <Pressable onPress={pick}><Text style={{ color: '#2563eb' }}>Import numbers from CSV</Text></Pressable>
      {fileName ? <Text>Loaded: {fileName}</Text> : null}
    </View>
  );
}
