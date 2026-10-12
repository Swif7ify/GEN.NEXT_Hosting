import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { fetchSingleServiceStatus, fetchAllServicesStatus } from '../apiClient';
import { ServiceStatusType } from '../types';

interface ServiceItem {
  id: 'api' | 'supabase' | 'mongodb' | 'redis';
  title: string;
  type: string;
  status: ServiceStatusType;
  latencyMs?: number;
  message: string;
}

const INITIAL_SERVICES: Record<'api' | 'supabase' | 'mongodb' | 'redis', ServiceItem> = {
  api: {
    id: 'api',
    title: 'Express REST API',
    type: 'Backend Server',
    status: 'idle',
    message: 'Ready to check connection.',
  },
  supabase: {
    id: 'supabase',
    title: 'Supabase',
    type: 'PostgreSQL Database',
    status: 'idle',
    message: 'Ready to check connection.',
  },
  mongodb: {
    id: 'mongodb',
    title: 'MongoDB',
    type: 'Document Database',
    status: 'idle',
    message: 'Ready to check connection.',
  },
  redis: {
    id: 'redis',
    title: 'Redis',
    type: 'Key-Value Cache',
    status: 'idle',
    message: 'Ready to check connection.',
  },
};

interface ServiceStatusSectionProps {
  backendUrl: string;
}

export function ServiceStatusSection({ backendUrl }: ServiceStatusSectionProps) {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [checkingAll, setCheckingAll] = useState(false);

  const checkSingle = async (id: 'api' | 'supabase' | 'mongodb' | 'redis') => {
    setServices((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'checking', message: 'Checking connectivity...' },
    }));

    try {
      const res = await fetchSingleServiceStatus(backendUrl, id);
      setServices((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: res.status || 'connected',
          latencyMs: res.latencyMs,
          message: res.message || 'Connected successfully.',
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setServices((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'unavailable',
          message: msg,
        },
      }));
    }
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    setServices((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as Array<'api' | 'supabase' | 'mongodb' | 'redis'>).forEach((k) => {
        updated[k] = { ...updated[k], status: 'checking', message: 'Checking...' };
      });
      return updated;
    });

    try {
      const res = await fetchAllServicesStatus(backendUrl);
      if (res.services) {
        setServices((prev) => ({
          api: {
            ...prev.api,
            status: res.services!.api.status,
            latencyMs: res.services!.api.latencyMs,
            message: res.services!.api.message,
          },
          supabase: {
            ...prev.supabase,
            status: res.services!.supabase.status,
            latencyMs: res.services!.supabase.latencyMs,
            message: res.services!.supabase.message,
          },
          mongodb: {
            ...prev.mongodb,
            status: res.services!.mongodb.status,
            latencyMs: res.services!.mongodb.latencyMs,
            message: res.services!.mongodb.message,
          },
          redis: {
            ...prev.redis,
            status: res.services!.redis.status,
            latencyMs: res.services!.redis.latencyMs,
            message: res.services!.redis.message,
          },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check all failed';
      setServices((prev) => {
        const updated = { ...prev };
        (Object.keys(updated) as Array<'api' | 'supabase' | 'mongodb' | 'redis'>).forEach((k) => {
          updated[k] = { ...updated[k], status: 'unavailable', message: msg };
        });
        return updated;
      });
    } finally {
      setCheckingAll(false);
    }
  };

  const renderBadge = (status: ServiceStatusType, latency?: number) => {
    switch (status) {
      case 'connected':
        return (
          <View style={[styles.badge, styles.badgeConnected]}>
            <View style={[styles.badgeDot, styles.dotConnected]} />
            <Text style={[styles.badgeText, styles.badgeTextConnected]}>
              Connected {latency !== undefined ? `(${latency}ms)` : ''}
            </Text>
          </View>
        );
      case 'checking':
        return (
          <View style={[styles.badge, styles.badgeChecking]}>
            <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, styles.badgeTextChecking]}>Checking...</Text>
          </View>
        );
      case 'unavailable':
      case 'error':
        return (
          <View style={[styles.badge, styles.badgeUnavailable]}>
            <View style={[styles.badgeDot, styles.dotUnavailable]} />
            <Text style={[styles.badgeText, styles.badgeTextUnavailable]}>Unavailable</Text>
          </View>
        );
      case 'not_configured':
        return (
          <View style={[styles.badge, styles.badgeNotConfigured]}>
            <View style={[styles.badgeDot, styles.dotNotConfigured]} />
            <Text style={[styles.badgeText, styles.badgeTextNotConfigured]}>Not Configured</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgeIdle]}>
            <View style={[styles.badgeDot, styles.dotIdle]} />
            <Text style={[styles.badgeText, styles.badgeTextIdle]}>Idle</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitles}>
          <Text style={styles.sectionTitle}>Service Status</Text>
          <Text style={styles.sectionDesc}>Live connectivity across backend and databases</Text>
        </View>
        <TouchableOpacity
          style={styles.checkAllBtn}
          onPress={handleCheckAll}
          disabled={checkingAll}
          activeOpacity={0.7}
        >
          {checkingAll ? (
            <ActivityIndicator size="small" color="#334155" />
          ) : (
            <Text style={styles.checkAllBtnText}>Check All</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.cardsGrid}>
        {(Object.keys(services) as Array<'api' | 'supabase' | 'mongodb' | 'redis'>).map((id) => {
          const item = services[id];
          const isBusy = item.status === 'checking';

          return (
            <View key={id} style={styles.serviceCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleArea}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.type}</Text>
                </View>
                {renderBadge(item.status, item.latencyMs)}
              </View>

              <Text style={styles.cardMessage} numberOfLines={2}>
                {item.message}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.latencyText}>
                  {item.latencyMs !== undefined ? `${item.latencyMs}ms response` : 'No ping yet'}
                </Text>
                <TouchableOpacity
                  style={styles.singleCheckBtn}
                  onPress={() => checkSingle(id)}
                  disabled={isBusy || checkingAll}
                  activeOpacity={0.7}
                >
                  <Text style={styles.singleCheckBtnText}>
                    {isBusy ? 'Checking...' : 'Check'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerTitles: {
    flex: 1,
    paddingRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  checkAllBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cardsGrid: {
    gap: 8,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitleArea: {
    flex: 1,
    paddingRight: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  cardMessage: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  latencyText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  singleCheckBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  singleCheckBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeConnected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  dotConnected: {
    backgroundColor: '#10b981',
  },
  badgeTextConnected: {
    color: '#047857',
  },
  badgeChecking: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  badgeTextChecking: {
    color: '#1d4ed8',
  },
  badgeUnavailable: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  dotUnavailable: {
    backgroundColor: '#f43f5e',
  },
  badgeTextUnavailable: {
    color: '#be123c',
  },
  badgeNotConfigured: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  dotNotConfigured: {
    backgroundColor: '#f59e0b',
  },
  badgeTextNotConfigured: {
    color: '#b45309',
  },
  badgeIdle: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  dotIdle: {
    backgroundColor: '#94a3b8',
  },
  badgeTextIdle: {
    color: '#64748b',
  },
});
