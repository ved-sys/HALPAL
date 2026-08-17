import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';
import { JobCategory, VerificationTier } from '@/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PostJob'>;

const categories: JobCategory[] = ['Care', 'Tutoring/Skills', 'Manual Help', 'Errands', 'Events', 'Tech Help'];
const tiers: { value: VerificationTier; label: string }[] = [
  { value: 'level_1', label: 'ID only' },
  { value: 'level_2', label: 'ID + Face match' },
  { value: 'level_3', label: 'Background checked' },
];

// Very rough rule-based category guess from free text, standing in for the
// NLP tagging described in the PRD (section 12 says rule-based is fine to
// start with).
function guessCategory(text: string): JobCategory {
  const t = text.toLowerCase();
  if (/(elder|grandmother|grandfather|child|kid|baby|care)/.test(t)) return 'Care';
  if (/(teach|tutor|learn|lesson|chess|language)/.test(t)) return 'Tutoring/Skills';
  if (/(move|carry|lift|furniture|clean)/.test(t)) return 'Manual Help';
  if (/(wifi|laptop|computer|setup|printer|tech)/.test(t)) return 'Tech Help';
  if (/(event|party|decorate)/.test(t)) return 'Events';
  return 'Errands';
}

export function PostJobScreen({ navigation }: Props) {
  const { addJob } = useStore();
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<'asap' | 'scheduled'>('scheduled');
  const [tier, setTier] = useState<VerificationTier>('level_1');

  const canSubmit = description.trim().length > 10 && budgetMin && budgetMax && location.trim().length > 0;

  function submit() {
    const category = guessCategory(description);
    addJob({
      id: `job_${Date.now()}`,
      description: description.trim(),
      categoryTags: [category],
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      urgency,
      locationLabel: location.trim(),
      minVerificationTierRequired: tier,
      status: 'open',
      origin: 'customer_posted',
      createdAt: new Date().toISOString(),
      applicantCount: 0,
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={[type.display, { color: colors.ink }]}>Post a job</Text>
        <Text style={[type.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
          Describe it in your own words — no need to pick a category.
        </Text>

        <Field label="What do you need help with?">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Need someone to sit with my grandmother this afternoon while I'm at a hospital appointment."
            placeholderTextColor={colors.inkFaint}
            multiline
            style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
          />
        </Field>

        <View style={styles.row}>
          <Field label="Budget min (₹)" style={{ flex: 1 }}>
            <TextInput value={budgetMin} onChangeText={setBudgetMin} keyboardType="numeric" style={styles.input} />
          </Field>
          <Field label="Budget max (₹)" style={{ flex: 1 }}>
            <TextInput value={budgetMax} onChangeText={setBudgetMax} keyboardType="numeric" style={styles.input} />
          </Field>
        </View>

        <Field label="Location">
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Adyar, Chennai"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />
        </Field>

        <Field label="Urgency">
          <View style={styles.pillRow}>
            {(['asap', 'scheduled'] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => setUrgency(u)}
                style={[styles.pill, urgency === u && styles.pillActive]}
              >
                <Text style={[type.smallStrong, { color: urgency === u ? colors.onPrimary : colors.inkSoft }]}>
                  {u === 'asap' ? 'ASAP' : 'Scheduled'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Minimum verification required">
          <View style={styles.pillRow}>
            {tiers.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setTier(t.value)}
                style={[styles.pill, tier === t.value && styles.pillActiveTeal]}
              >
                <Text style={[type.small, { color: tier === t.value ? colors.white : colors.inkSoft }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.small, { color: colors.inkFaint, marginTop: spacing.xs }]}>
            Higher tiers narrow your worker pool but raise trust — use Background Checked for jobs involving
            children, elders, or home access while you're away.
          </Text>
        </Field>

        <PrimaryButton
          label="Post job"
          onPress={submit}
          disabled={!canSubmit}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[{ marginTop: spacing.lg }, style]}>
      <Text style={[type.smallStrong, { color: colors.inkSoft }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  row: { flexDirection: 'row', gap: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.ink,
  },
  pillRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  pillActive: { backgroundColor: colors.primary },
  pillActiveTeal: { backgroundColor: colors.teal },
});
