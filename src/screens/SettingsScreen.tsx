import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton } from '@/components/atoms';
import { useAuth } from '@/state/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={[type.label, { color: colors.inkFaint, marginBottom: spacing.sm }]}>PROFILE</Text>
        <View style={[styles.group, { marginBottom: spacing.xl }]}>
          <Row label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        </View>

        <Text style={[type.label, { color: colors.inkFaint, marginBottom: spacing.sm }]}>LEGAL</Text>
        <View style={styles.group}>
          <Row label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <View style={styles.divider} />
          <Row label="Terms of Service" onPress={() => navigation.navigate('Terms')} />
        </View>

        <Text style={[type.label, { color: colors.inkFaint, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          ACCOUNT
        </Text>
        <View style={styles.group}>
          <Row label="Delete my account" danger onPress={() => navigation.navigate('DeleteAccount')} />
        </View>

        <PrimaryButton
          label="Sign out"
          variant="outline"
          onPress={() => void signOut()}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Text style={[type.body, { color: danger ? colors.danger : colors.ink, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  group: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
});
