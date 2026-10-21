import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { ErrorNote, PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';
import { categoryDescription, JobCategory, WorkerOffering } from '@/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOffering'>;

const allCategories = Object.keys(categoryDescription) as JobCategory[];

export function CreateOfferingScreen({ navigation }: Props) {
  const { addOffering, profile } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<JobCategory[]>([]);
  const [pricingType, setPricingType] = useState<WorkerOffering['pricingType']>('platform_suggested');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 3 &&
    description.trim().length > 10 &&
    selectedCategories.length > 0 &&
    Number(rate) > 0;

  function toggleCategory(category: JobCategory) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  async function submit() {
    if (submitting) return;
    setActionError(null);
    setSubmitting(true);
    const res = await addOffering({
      title: title.trim(),
      description: description.trim(),
      categoryTags: selectedCategories,
      pricingType,
      rate: Number(rate),
    });
    setSubmitting(false);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    navigation.goBack();
  }

  // Verification gates applying for jobs, and the same bar applies to
  // listing a service. The check is enforced by RLS either way.
  if (profile && !profile.isVerified) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.section}>
          <View style={styles.warningBox}>
            <Text style={[type.small, { color: colors.danger }]}>
              Verify your ID from your profile before listing a service.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={[type.body, { color: colors.inkSoft, marginBottom: spacing.lg }]}>
          Describe a service you offer. Customers can request a booking, which opens a chat with you
          straight away.
        </Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Bike courier — parcels and documents"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />

        <Text style={styles.label}>What you do</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's included, what you bring, how long it usually takes"
          placeholderTextColor={colors.inkFaint}
          multiline
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        />

        <Text style={styles.label}>Categories</Text>
        <View style={styles.chipRow}>
          {allCategories.map((category) => {
            const active = selectedCategories.includes(category);
            return (
              <Pressable
                key={category}
                onPress={() => toggleCategory(category)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[type.smallStrong, { color: active ? colors.onPrimary : colors.inkSoft }]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Pricing</Text>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setPricingType('platform_suggested')}
            style={[styles.toggleBtn, pricingType === 'platform_suggested' && styles.toggleBtnActive]}
          >
            <Text
              style={[
                type.smallStrong,
                { color: pricingType === 'platform_suggested' ? colors.onPrimary : colors.inkSoft },
              ]}
            >
              Standard rate
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPricingType('custom')}
            style={[styles.toggleBtn, pricingType === 'custom' && styles.toggleBtnActive]}
          >
            <Text
              style={[type.smallStrong, { color: pricingType === 'custom' ? colors.onPrimary : colors.inkSoft }]}
            >
              Custom rate
            </Text>
          </Pressable>
        </View>
        {pricingType === 'custom' && (
          <View style={styles.noticeBox}>
            <Text style={[type.small, { color: colors.inkSoft }]}>
              Custom-priced listings are held for review before they appear.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Rate per session (₹)</Text>
        <TextInput
          value={rate}
          onChangeText={(v) => setRate(v.replace(/\D/g, ''))}
          keyboardType="numeric"
          placeholder="500"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />

        <PrimaryButton
          label={submitting ? 'Publishing…' : 'Publish offering'}
          onPress={() => void submit()}
          disabled={!canSubmit || submitting}
          style={{ marginTop: spacing.xl }}
        />
        <ErrorNote message={actionError} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  chipActive: { backgroundColor: colors.primary },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.canvasAlt, borderRadius: radius.pill, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.primary },
  noticeBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
});
