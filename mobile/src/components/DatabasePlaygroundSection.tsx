import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { formatMobileName, validateMobileInput } from '../nameValidator';
import {
  saveDemoRecord,
  getDemoRecords,
} from '../apiClient';
import { DemoEntryRecord, RedisDemoRecord } from '../types';

interface DatabasePlaygroundSectionProps {
  backendUrl: string;
}

export function DatabasePlaygroundSection({ backendUrl }: DatabasePlaygroundSectionProps) {
  // Input state
  const [name, setName] = useState('Ada Lovelace');
  const [backendError, setBackendError] = useState<string | null>(null);

  // Active button / action
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Operation banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Database stored data
  const [supabaseRecords, setSupabaseRecords] = useState<DemoEntryRecord[]>([]);
  const [mongoRecords, setMongoRecords] = useState<DemoEntryRecord[]>([]);
  const [redisRecord, setRedisRecord] = useState<RedisDemoRecord | null>(null);

  // Tab view for mobile screen: 'supabase' | 'mongodb' | 'redis'
  const [activeTab, setActiveTab] = useState<'supabase' | 'mongodb' | 'redis'>('supabase');

  // Compute mobile-formatted name (concatenating "(Mobile)")
  const formattedName = useMemo(() => formatMobileName(name), [name]);

  // Live client-side validation
  const clientValidation = useMemo(() => {
    return validateMobileInput(name);
  }, [name]);

  const displayError = backendError || (!clientValidation.isValid ? clientValidation.error?.message : null);

  // Initial load
  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const [sub, mongo, redis] = await Promise.allSettled([
          getDemoRecords(backendUrl, 'supabase'),
          getDemoRecords(backendUrl, 'mongodb'),
          getDemoRecords(backendUrl, 'redis'),
        ]);

        if (!active) return;

        if (sub.status === 'fulfilled' && sub.value.success) {
          setSupabaseRecords((sub.value.records as DemoEntryRecord[]) || []);
        }
        if (mongo.status === 'fulfilled' && mongo.value.success) {
          setMongoRecords((mongo.value.records as DemoEntryRecord[]) || []);
        }
        if (redis.status === 'fulfilled' && redis.value.success) {
          setRedisRecord((redis.value.record as RedisDemoRecord) || null);
        }
      } catch {
        // silent initial load
      }
    }

    loadInitial();

    return () => {
      active = false;
    };
  }, [backendUrl]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (backendError) setBackendError(null);
  };

  // ----------------------------------------------------
  // REFRESH HANDLERS
  // ----------------------------------------------------
  const fetchSupabase = async () => {
    setActiveAction('fetch-supabase');
    try {
      const res = await getDemoRecords(backendUrl, 'supabase');
      if (res.success) {
        setSupabaseRecords((res.records as DemoEntryRecord[]) || []);
      }
    } catch {
      // silent
    } finally {
      setActiveAction(null);
    }
  };

  const fetchMongo = async () => {
    setActiveAction('fetch-mongo');
    try {
      const res = await getDemoRecords(backendUrl, 'mongodb');
      if (res.success) {
        setMongoRecords((res.records as DemoEntryRecord[]) || []);
      }
    } catch {
      // silent
    } finally {
      setActiveAction(null);
    }
  };

  const fetchRedis = async () => {
    setActiveAction('fetch-redis');
    try {
      const res = await getDemoRecords(backendUrl, 'redis');
      if (res.success) {
        setRedisRecord((res.record as RedisDemoRecord) || null);
      } else {
        setRedisRecord(null);
      }
    } catch {
      // silent
    } finally {
      setActiveAction(null);
    }
  };

  // ----------------------------------------------------
  // SAVE HANDLERS (Concatenates (Mobile))
  // ----------------------------------------------------
  const saveToSupabase = async () => {
    if (!clientValidation.isValid) return;
    setActiveAction('save-supabase');
    setBanner(null);
    setBackendError(null);

    const payloadName = formattedName;
    try {
      const res = await saveDemoRecord(backendUrl, 'supabase', payloadName);
      if (res.success && res.record) {
        const record = res.record as DemoEntryRecord;
        setSupabaseRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
        setBanner({
          type: 'success',
          message: `Saved "${payloadName}" to Supabase PostgreSQL table "demo_entries".`,
        });
      } else {
        const msg = res.error?.message || res.message || 'Supabase save failed';
        setBackendError(msg);
        setBanner({ type: 'error', message: `Supabase Error: ${msg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setBanner({ type: 'error', message: `Supabase Network error: ${msg}` });
    } finally {
      setActiveAction(null);
    }
  };

  const saveToMongo = async () => {
    if (!clientValidation.isValid) return;
    setActiveAction('save-mongo');
    setBanner(null);
    setBackendError(null);

    const payloadName = formattedName;
    try {
      const res = await saveDemoRecord(backendUrl, 'mongodb', payloadName);
      if (res.success && res.record) {
        const record = res.record as DemoEntryRecord;
        setMongoRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
        setBanner({
          type: 'success',
          message: `Saved "${payloadName}" to MongoDB collection "demo_entries".`,
        });
      } else {
        const msg = res.error?.message || res.message || 'MongoDB save failed';
        setBackendError(msg);
        setBanner({ type: 'error', message: `MongoDB Error: ${msg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setBanner({ type: 'error', message: `MongoDB Network error: ${msg}` });
    } finally {
      setActiveAction(null);
    }
  };

  const saveToRedis = async () => {
    if (!clientValidation.isValid) return;
    setActiveAction('save-redis');
    setBanner(null);
    setBackendError(null);

    const payloadName = formattedName;
    try {
      const res = await saveDemoRecord(backendUrl, 'redis', payloadName);
      if (res.success && res.record) {
        setRedisRecord(res.record as RedisDemoRecord);
        setBanner({
          type: 'success',
          message: `Cached "${payloadName}" in Redis with 300s TTL.`,
        });
      } else {
        const msg = res.error?.message || res.message || 'Redis save failed';
        setBackendError(msg);
        setBanner({ type: 'error', message: `Redis Error: ${msg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setBanner({ type: 'error', message: `Redis Network error: ${msg}` });
    } finally {
      setActiveAction(null);
    }
  };

  const isSaving = activeAction?.startsWith('save-');

  return (
    <View style={styles.container}>
      {/* Input Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Database Playground</Text>
          <View style={styles.mobileBadge}>
            <Text style={styles.mobileBadgeText}>+ (Mobile) Suffix</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          Enter a name to validate and insert. Mobile automatically appends the <Text style={{ fontWeight: '700' }}>(Mobile)</Text> tag when sending.
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.textInput,
              displayError ? styles.textInputError : styles.textInputNormal,
            ]}
            value={name}
            onChangeText={handleNameChange}
            placeholder="e.g. Ada Lovelace"
            maxLength={41} // 41 chars + " (Mobile)" = 50 chars max
          />
          <Text style={styles.charCounter}>
            {formattedName.length}/50
          </Text>
        </View>

        {/* Live Concatenated Preview */}
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Will be sent as:</Text>
          <Text style={styles.previewValue}>
            {formattedName ? `"${formattedName}"` : '<empty>'}
          </Text>
        </View>

        {/* Validation Status */}
        {displayError ? (
          <View style={styles.validationErrorRow}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : name.trim() ? (
          <View style={styles.validationSuccessRow}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Valid name — ready to submit</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.btn,
              styles.supabaseBtn,
              (!clientValidation.isValid || isSaving) && styles.btnDisabled,
            ]}
            onPress={saveToSupabase}
            disabled={!clientValidation.isValid || Boolean(activeAction)}
            activeOpacity={0.8}
          >
            {activeAction === 'save-supabase' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Supabase</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.mongoBtn,
              (!clientValidation.isValid || isSaving) && styles.btnDisabled,
            ]}
            onPress={saveToMongo}
            disabled={!clientValidation.isValid || Boolean(activeAction)}
            activeOpacity={0.8}
          >
            {activeAction === 'save-mongo' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>MongoDB</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.redisBtn,
              (!clientValidation.isValid || isSaving) && styles.btnDisabled,
            ]}
            onPress={saveToRedis}
            disabled={!clientValidation.isValid || Boolean(activeAction)}
            activeOpacity={0.8}
          >
            {activeAction === 'save-redis' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Redis</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Result Banner */}
        {banner && (
          <View
            style={[
              styles.banner,
              banner.type === 'success' ? styles.bannerSuccess : styles.bannerError,
            ]}
          >
            <Text
              style={[
                styles.bannerText,
                banner.type === 'success' ? styles.bannerTextSuccess : styles.bannerTextError,
              ]}
            >
              {banner.message}
            </Text>
            <TouchableOpacity onPress={() => setBanner(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.bannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Database Stored Records Card with Tabs */}
      <View style={styles.resultsCard}>
        <View style={styles.tabsHeader}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'supabase' && styles.tabBtnActive]}
            onPress={() => setActiveTab('supabase')}
          >
            <View style={[styles.tabDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.tabBtnText, activeTab === 'supabase' && styles.tabBtnTextActive]}>
              Supabase ({supabaseRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mongodb' && styles.tabBtnActive]}
            onPress={() => setActiveTab('mongodb')}
          >
            <View style={[styles.tabDot, { backgroundColor: '#16a34a' }]} />
            <Text style={[styles.tabBtnText, activeTab === 'mongodb' && styles.tabBtnTextActive]}>
              MongoDB ({mongoRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'redis' && styles.tabBtnActive]}
            onPress={() => setActiveTab('redis')}
          >
            <View style={[styles.tabDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={[styles.tabBtnText, activeTab === 'redis' && styles.tabBtnTextActive]}>
              Redis
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabBody}>
          {activeTab === 'supabase' && (
            <View>
              <View style={styles.tabContentHeader}>
                <Text style={styles.tabInfoText}>
                  Table: <Text style={styles.codeText}>demo_entries</Text>
                </Text>
                <TouchableOpacity
                  onPress={fetchSupabase}
                  disabled={activeAction === 'fetch-supabase'}
                  style={styles.refreshBtn}
                >
                  <Text style={styles.refreshBtnText}>
                    {activeAction === 'fetch-supabase' ? 'Refreshing...' : 'Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>

              {supabaseRecords.length === 0 ? (
                <Text style={styles.emptyText}>No records found. Click &quot;Supabase&quot; above.</Text>
              ) : (
                supabaseRecords.map((r) => (
                  <View key={String(r.id)} style={styles.recordItem}>
                    <Text style={styles.recordName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.recordTime}>
                      {new Date(r.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'mongodb' && (
            <View>
              <View style={styles.tabContentHeader}>
                <Text style={styles.tabInfoText}>
                  Collection: <Text style={styles.codeText}>demo_entries</Text>
                </Text>
                <TouchableOpacity
                  onPress={fetchMongo}
                  disabled={activeAction === 'fetch-mongo'}
                  style={styles.refreshBtn}
                >
                  <Text style={styles.refreshBtnText}>
                    {activeAction === 'fetch-mongo' ? 'Refreshing...' : 'Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>

              {mongoRecords.length === 0 ? (
                <Text style={styles.emptyText}>No documents found. Click &quot;MongoDB&quot; above.</Text>
              ) : (
                mongoRecords.map((r) => (
                  <View key={String(r.id)} style={styles.recordItem}>
                    <Text style={styles.recordName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.recordTime}>
                      {new Date(r.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'redis' && (
            <View>
              <View style={styles.tabContentHeader}>
                <Text style={styles.tabInfoText}>
                  Key: <Text style={styles.codeText}>demo:playground:latest_entry</Text>
                </Text>
                <TouchableOpacity
                  onPress={fetchRedis}
                  disabled={activeAction === 'fetch-redis'}
                  style={styles.refreshBtn}
                >
                  <Text style={styles.refreshBtnText}>
                    {activeAction === 'fetch-redis' ? 'Refreshing...' : 'Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>

              {redisRecord ? (
                <View style={styles.redisCard}>
                  <View style={styles.redisRow}>
                    <Text style={styles.redisLabel}>Cached Name:</Text>
                    <Text style={styles.redisValue}>{redisRecord.name}</Text>
                  </View>
                  <View style={styles.redisRow}>
                    <Text style={styles.redisLabel}>Remaining TTL:</Text>
                    <Text style={styles.redisTtl}>{redisRecord.ttl_seconds}s</Text>
                  </View>
                  <View style={styles.redisRow}>
                    <Text style={styles.redisLabel}>Saved At:</Text>
                    <Text style={styles.redisTime}>
                      {new Date(redisRecord.saved_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>No active cached key. Click &quot;Redis&quot; above.</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  mobileBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  mobileBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338ca',
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 16,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 60,
    fontSize: 13,
    color: '#0f172a',
  },
  textInputNormal: {
    borderColor: '#cbd5e1',
  },
  textInputError: {
    borderColor: '#fb7185',
  },
  charCounter: {
    position: 'absolute',
    right: 10,
    top: 10,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 11,
    color: '#64748b',
    marginRight: 6,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 12,
    color: '#1e293b',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  validationErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e11d48',
  },
  validationSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  successIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    marginRight: 4,
  },
  successText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#059669',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supabaseBtn: {
    backgroundColor: '#059669',
  },
  mongoBtn: {
    backgroundColor: '#15803d',
  },
  redisBtn: {
    backgroundColor: '#e11d48',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  banner: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  bannerError: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  bannerText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  bannerTextSuccess: {
    color: '#065f46',
  },
  bannerTextError: {
    color: '#9f1239',
  },
  bannerClose: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  tabBody: {
    padding: 12,
    minHeight: 140,
  },
  tabContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabInfoText: {
    fontSize: 11,
    color: '#64748b',
  },
  codeText: {
    backgroundColor: '#f1f5f9',
    fontFamily: 'monospace',
    color: '#334155',
    paddingHorizontal: 4,
  },
  refreshBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  recordItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 6,
  },
  recordTime: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  redisCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  redisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redisLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  redisValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  redisTtl: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#059669',
  },
  redisTime: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
});
