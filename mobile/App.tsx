import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './src/components/Header';
import { ServiceStatusSection } from './src/components/ServiceStatusSection';
import { DatabasePlaygroundSection } from './src/components/DatabasePlaygroundSection';
import { getDefaultBackendUrl } from './src/config';

export default function App() {
  const [backendUrl, setBackendUrl] = useState(getDefaultBackendUrl());

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Header
          backendUrl={backendUrl}
          onBackendUrlChange={setBackendUrl}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service Status Section */}
          <ServiceStatusSection backendUrl={backendUrl} />

          {/* Database Playground Section */}
          <DatabasePlaygroundSection backendUrl={backendUrl} />

          {/* Mobile Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>
              Deployment Playground — React Native Mobile
            </Text>
            <Text style={styles.footerSubtitle}>
              Expo · React Native · Express · Supabase · MongoDB · Redis
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    gap: 4,
  },
  footerTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  footerSubtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94a3b8',
    textAlign: 'center',
  },
});
