import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { scheduleReminderNotification, cancelAllNotifications } from '../services/notifications';

export default function ProfileScreen() {
  const { user, setNickname } = useUser();
  const [nickname, setNicknameLocal] = useState(user?.nickname || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNicknameLocal(user?.nickname || '');
  }, [user?.nickname]);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert('Erreur', 'Le pseudo ne peut pas être vide.');
      return;
    }

    setLoading(true);
    try {
      await setNickname(nickname.trim());
      Alert.alert('Succès', 'Pseudo mis à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message ?? 'Impossible de mettre à jour le pseudo');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      setReminderEnabled(false);
      cancelAllNotifications();
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    setReminderEnabled(value);
    if (value) {
      try {
        await scheduleReminderNotification();
        Alert.alert('Rappel activé', 'Vous recevrez une notification quotidienne pour découvrir de nouveaux lieux.');
      } catch (error) {
        Alert.alert('Erreur', 'Impossible d\'activer le rappel');
        setReminderEnabled(false);
      }
    } else {
      cancelAllNotifications();
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.settingAction}>{rightComponent}</View>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.surface} />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileTitle}>Utilisateur</Text>
              <Text style={styles.profileSubtitle}>ID: {user?.id?.slice(0, 8)}...</Text>
            </View>
          </View>

          <View style={styles.nicknameForm}>
            <Input
              label="Pseudo"
              placeholder="Votre pseudo"
              value={nickname}
              onChangeText={setNicknameLocal}
            />
            <Button
              title="Sauvegarder"
              onPress={handleSaveNickname}
              loading={loading}
              disabled={!nickname.trim() || nickname === user?.nickname}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSettingItem(
            'notifications',
            'Notifications push',
            'Recevoir des notifications pour les nouvelles activités',
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          )}

          {renderSettingItem(
            'time',
            'Rappel quotidien',
            'Recevoir un rappel pour découvrir de nouveaux lieux',
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              disabled={!notificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Lieux ajoutés</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={colors.secondary} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Avis donnés</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="chatbubble" size={24} color={colors.warning} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Questions posées</Text>
            </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          
          {renderSettingItem(
            'information-circle',
            'Version',
            '1.0.0',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}

          {renderSettingItem(
            'help-circle',
            'Aide',
            'Comment utiliser l\'application',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}

          {renderSettingItem(
            'document-text',
            'Conditions d\'utilisation',
            'Lire les conditions',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}

          {renderSettingItem(
            'shield-checkmark',
            'Politique de confidentialité',
            'Comment nous protégeons vos données',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nicknameForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  settingAction: {
    marginLeft: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
