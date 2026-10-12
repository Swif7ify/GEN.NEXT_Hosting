import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BACKEND_PRESETS } from '../config';
import { checkApiHealth } from '../apiClient';

interface HeaderProps {
  backendUrl: string;
  onBackendUrlChange: (url: string) => void;
}

export function Header({ backendUrl, onBackendUrlChange }: HeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await checkApiHealth(backendUrl);
      setTestResult(`Online (${data.status})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unreachable';
      setTestResult(`Failed: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <View style={styles.badgeRow}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>React Native · Mobile</Text>
          </View>
          <Text style={styles.title}>Deployment Playground</Text>
          <Text style={styles.subtitle}>Multi-Cloud Backend Connectivity</Text>
        </View>

        <TouchableOpacity
          style={styles.configToggleBtn}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.configToggleText}>{expanded ? 'Close' : 'Server ⚙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Current Host Bar */}
      <View style={styles.hostBar}>
        <Text style={styles.hostLabel}>Target Server:</Text>
        <Text style={styles.hostValue} numberOfLines={1}>
          {backendUrl}
        </Text>
      </View>

      {/* Expanded Server Config Panel */}
      {expanded && (
        <View style={styles.configPanel}>
          <Text style={styles.panelTitle}>Configure Backend URL:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.urlInput}
              value={backendUrl}
              onChangeText={onBackendUrlChange}
              placeholder="http://192.168.1.79:5000"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
              activeOpacity={0.7}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.testBtnText}>Ping</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Presets */}
          <View style={styles.presetRow}>
            {BACKEND_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.url}
                style={[
                  styles.presetChip,
                  backendUrl === preset.url && styles.presetChipActive,
                ]}
                onPress={() => {
                  onBackendUrlChange(preset.url);
                  setTestResult(null);
                }}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    backendUrl === preset.url && styles.presetChipTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {testResult && (
            <Text
              style={[
                styles.testStatusText,
                testResult.startsWith('Online')
                  ? styles.testStatusSuccess
                  : styles.testStatusError,
              ]}
            >
              {testResult}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  configToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  configToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  hostBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  hostLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 6,
  },
  hostValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#2563eb',
    fontWeight: '500',
    flex: 1,
  },
  configPanel: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  testBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  presetChipText: {
    fontSize: 10,
    color: '#64748b',
  },
  presetChipTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  testStatusText: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  testStatusSuccess: {
    color: '#059669',
  },
  testStatusError: {
    color: '#e11d48',
  },
});
