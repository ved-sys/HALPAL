import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';
import { categoryDescription, categoryColor, JobCategory } from '@/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PostJob'>;

const allCategories: JobCategory[] = [
  'Delivery & Pickup',
  'Loading & Moving Help',
  'Errands & Queueing',
  'Cleaning & Household Help',
  'Event & Setup Help',
  'General Labor',
  'Other',
];

export function PostJobScreen({ navigation }: Props) {
  const { addJob } = useStore();
  const [selectedCategories, setSelectedCategories] = useState<JobCategory[]>([]);
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<'asap' | 'scheduled'>('scheduled');
  const [scheduledDatetime, setScheduledDatetime] = useState('');

  const hasCategory = selectedCategories.length > 0;
  const includesOther = selectedCategories.includes('Other');
  const budgetsValid =
    budgetMin.length > 0 && budgetMax.length > 0 && Number(budgetMin) < Number(budgetMax);

  const canSubmit =
    hasCategory && description.trim().length > 10 && budgetsValid && location.trim().length > 0;

  function toggleCategory(category: JobCategory) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  function submit() {
    addJob({
      id: `job_${Date.now()}`,
      description: description.trim(),
      categoryTags: selectedCategories,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      urgency,
      scheduledDatetime: urgency === 'scheduled' ? scheduledDatetime.trim() || undefined : undefined,
      locationLabel: location.trim(),
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
          What kind of help do you need? Pick everything that applies.
        </Text>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {allCategories.map((category) => {
            const selected = selectedCategories.includes(category);
            return (
              <Pressable
                key={category}
                onPress={() => toggleCategory(category)}
                style={[
                  styles.categoryRow,
                  selected && { borderColor: categoryColor[category], backgroundColor: categoryColor[category] + '14' },
                ]}
              >
                <View style={[styles.checkbox, selected && { backgroundColor: categoryColor[category], borderColor: categoryColor[category] }]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyStrong, { color: colors.ink }]}>{category}</Text>
                  <Text style={[type.small, { color: colors.inkFaint, marginTop: 2 }]}>
                    {categoryDescription[category]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {includesOther && (
          <View style={styles.reviewNotice}>
            <Text style={[type.small, { color: colors.inkSoft }]}>
              Jobs tagged "Other" are held for review before they go live on the feed.
            </Text>
          </View>
        )}

        {hasCategory && (
          <>
            <Field label="What do you need help with?">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Need groceries picked up from the supermarket and dropped at my apartment."
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
            {budgetMin.length > 0 && budgetMax.length > 0 && !budgetsValid && (
              <Text style={[type.small, { color: colors.danger, marginTop: spacing.xs }]}>
                Maximum budget must be greater than minimum budget.
              </Text>
            )}

            <Field label="Location">
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Adyar, Chennai"
                placeholderTextColor={colors.inkFaint}
                style={styles.input}
              />
            </Field>

            <Field label="When do you need this done?">
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
              {urgency === 'scheduled' && (
                <TextInput
                  value={scheduledDatetime}
                  onChangeText={setScheduledDatetime}
                  placeholder="e.g. 18 Aug, 5:00 PM"
                  placeholderTextColor={colors.inkFaint}
                  style={[styles.input, { marginTop: spacing.sm }]}
                />
              )}
            </Field>

            <PrimaryButton
              label="Post job"
              onPress={submit}
              disabled={!canSubmit}
              style={{ marginTop: spacing.xl }}
            />
          </>
        )}
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '700' },
  reviewNotice: {
    marginTop: spacing.sm,
    backgroundColor: colors.canvasAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
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
});
