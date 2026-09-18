import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { categoryColor, Job } from '@/types/models';

// Signature element: job posts read like index cards pinned to a board —
// a nod to how these jobs actually get arranged today (word of mouth,
// a note on a notice board), just digitized. A tiny rotation + "pin"
// dot sells the metaphor without being cute about it.

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diffMs / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function JobCard({ job, onPress, rotate = true }: { job: Job; onPress: () => void; rotate?: boolean }) {
  const rot = rotate ? (job.id.charCodeAt(job.id.length - 1) % 3) - 1 : 0; // -1, 0, or 1 degree
  const primaryCategory = job.categoryTags[0];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.card, shadow.card, { transform: [{ rotate: `${rot}deg` }] }]}>
        <View style={styles.pin} />
        <View style={styles.headerRow}>
          <View style={[styles.categoryChip, { backgroundColor: categoryColor[primaryCategory] + '1A' }]}>
            <Text style={[type.label, { color: categoryColor[primaryCategory] }]}>
              {primaryCategory.toUpperCase()}
            </Text>
          </View>
          {job.urgency === 'asap' && (
            <View style={styles.urgentChip}>
              <Text style={[type.label, { color: colors.danger }]}>ASAP</Text>
            </View>
          )}
        </View>

        <Text style={[type.h3, { color: colors.ink, marginTop: spacing.sm }]} numberOfLines={3}>
          {job.description}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[type.small, { color: colors.inkFaint }]}>{job.locationLabel}</Text>
          <Text style={[type.small, { color: colors.inkFaint }]}>·</Text>
          <Text style={[type.small, { color: colors.inkFaint }]}>{timeAgo(job.createdAt)}</Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={[type.mono, { color: colors.primaryDark }]}>
            ₹{job.budgetMin}–₹{job.budgetMax}
          </Text>
        </View>

        {job.applicantCount > 0 && (
          <Text style={[type.small, { color: colors.inkFaint, marginTop: spacing.xs }]}>
            {job.applicantCount} {job.applicantCount === 1 ? 'application' : 'applications'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pin: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  urgentChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
  },
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
});
