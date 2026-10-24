import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { avatarPalette, colors, radius, spacing, type } from '@/theme/tokens';
import { ErrorNote, PrimaryButton } from '@/components/atoms';
import { Avatar } from '@/components/WorkerCards';
import { useStore } from '@/state/store';
import { BIO_MAX, NAME_MAX, SKILLS_MAX, validateFullName } from '@/lib/profileRules';
import { categoryDescription } from '@/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const CATEGORY_SKILLS = Object.keys(categoryDescription);

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function EditProfileScreen({ navigation }: Props) {
  const { profile, updateProfile } = useStore();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor ?? avatarPalette[0]);
  const [customSkill, setCustomSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = validateFullName(fullName);
  const customSkills = skills.filter((s) => !CATEGORY_SKILLS.includes(s));
  const atSkillLimit = skills.length >= SKILLS_MAX;

  const changed = useMemo(() => {
    if (!profile) return false;
    return (
      fullName.trim() !== profile.fullName ||
      bio.trim() !== profile.bio ||
      avatarColor !== profile.avatarColor ||
      !sameList(skills, profile.skills)
    );
  }, [profile, fullName, bio, avatarColor, skills]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={[type.body, { color: colors.inkFaint, padding: spacing.lg }]}>Loading your profile…</Text>
      </SafeAreaView>
    );
  }

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length >= SKILLS_MAX ? prev : [...prev, skill]
    );
  }

  function addCustomSkill() {
    const skill = customSkill.trim();
    if (!skill || atSkillLimit) return;
    if (!skills.some((s) => s.toLowerCase() === skill.toLowerCase())) setSkills((prev) => [...prev, skill]);
    setCustomSkill('');
  }

  async function save() {
    if (saving || !changed || nameError) return;
    setError(null);
    setSaving(true);
    const res = await updateProfile({ fullName: fullName.trim(), bio: bio.trim(), skills, avatarColor });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarRow}>
          <Avatar name={fullName.trim() || profile.fullName} color={avatarColor} size={64} />
          <View style={styles.swatchRow}>
            {avatarPalette.map((c) => (
              <Pressable
                key={c}
                onPress={() => setAvatarColor(c)}
                accessibilityLabel={`Avatar colour ${c}`}
                style={[styles.swatch, { backgroundColor: c }, avatarColor === c && styles.swatchActive]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          maxLength={NAME_MAX}
          autoCapitalize="words"
          placeholder="Your name"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />
        {nameError && fullName.length > 0 ? (
          <Text style={[type.small, { color: colors.danger, marginTop: spacing.xs }]}>{nameError}</Text>
        ) : null}

        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          maxLength={BIO_MAX}
          multiline
          placeholder="A line or two about you (optional)"
          placeholderTextColor={colors.inkFaint}
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        />
        <Text style={[type.small, styles.counter]}>
          {bio.length}/{BIO_MAX}
        </Text>

        <Text style={styles.label}>
          Skills ({skills.length}/{SKILLS_MAX})
        </Text>
        <View style={styles.chipRow}>
          {CATEGORY_SKILLS.map((skill) => {
            const active = skills.includes(skill);
            return (
              <Pressable
                key={skill}
                onPress={() => toggleSkill(skill)}
                disabled={!active && atSkillLimit}
                style={[styles.chip, active && styles.chipActive, !active && atSkillLimit && { opacity: 0.4 }]}
              >
                <Text style={[type.smallStrong, { color: active ? colors.onPrimary : colors.inkSoft }]}>{skill}</Text>
              </Pressable>
            );
          })}
          {customSkills.map((skill) => (
            <Pressable key={skill} onPress={() => toggleSkill(skill)} style={[styles.chip, styles.chipActive]}>
              <Text style={[type.smallStrong, { color: colors.onPrimary }]}>{skill} ✕</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.customRow}>
          <TextInput
            value={customSkill}
            onChangeText={setCustomSkill}
            editable={!atSkillLimit}
            maxLength={30}
            placeholder={atSkillLimit ? `Up to ${SKILLS_MAX} skills` : 'Add your own skill'}
            placeholderTextColor={colors.inkFaint}
            onSubmitEditing={addCustomSkill}
            style={[styles.input, { flex: 1 }]}
          />
          <PrimaryButton
            label="Add"
            variant="outline"
            disabled={!customSkill.trim() || atSkillLimit}
            onPress={addCustomSkill}
          />
        </View>

        <PrimaryButton
          label={saving ? 'Saving…' : 'Save'}
          disabled={saving || !changed || !!nameError}
          onPress={() => void save()}
          style={{ marginTop: spacing.xl }}
        />
        <ErrorNote message={error} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, flex: 1 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.ink },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.ink,
  },
  counter: { color: colors.inkFaint, alignSelf: 'flex-end', marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  chipActive: { backgroundColor: colors.primary },
  customRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
});
