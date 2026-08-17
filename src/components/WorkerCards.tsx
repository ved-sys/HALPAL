import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { JobApplication, WorkerOffering } from '@/types/models';
import { PrimaryButton, RatingLine, VerificationStamp } from './atoms';

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '2A' },
      ]}
    >
      <Text style={[type.bodyStrong, { color }]}>{initials}</Text>
    </View>
  );
}

export function ApplicantRow({
  application,
  onAccept,
  onShortlist,
  onReject,
}: {
  application: JobApplication;
  onAccept: () => void;
  onShortlist: () => void;
  onReject: () => void;
}) {
  const { worker } = application;
  const decided = application.status === 'accepted' || application.status === 'rejected';
  return (
    <View style={[styles.applicantCard, shadow.card]}>
      <View style={styles.applicantHeader}>
        <Avatar name={worker.fullName} color={worker.avatarColor} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[type.bodyStrong, { color: colors.ink }]}>{worker.fullName}</Text>
          <RatingLine rating={worker.avgRating} count={worker.totalJobsCompleted} />
        </View>
        <Text style={[type.mono, { color: colors.primaryDark }]}>₹{application.quotedRate}</Text>
      </View>

      <VerificationStamp tier={worker.verificationTier} />

      {application.note && (
        <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.sm }]}>
          "{application.note}"
        </Text>
      )}

      {application.status === 'shortlisted' && (
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.shortlistTag}>
            <Text style={[type.label, { color: colors.primaryDark }]}>SHORTLISTED</Text>
          </View>
        </View>
      )}

      {!decided && (
        <View style={styles.actionRow}>
          <PrimaryButton label="Accept" variant="teal" onPress={onAccept} style={{ flex: 1 }} />
          {application.status !== 'shortlisted' && (
            <PrimaryButton label="Shortlist" variant="outline" onPress={onShortlist} style={{ flex: 1 }} />
          )}
          <Pressable onPress={onReject} style={styles.rejectBtn}>
            <Text style={[type.small, { color: colors.danger }]}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function OfferingCard({ offering, onPress }: { offering: WorkerOffering; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.offeringCard, shadow.card]}>
        <View style={styles.applicantHeader}>
          <Avatar name={offering.worker.fullName} color={offering.worker.avatarColor} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[type.bodyStrong, { color: colors.ink }]}>{offering.worker.fullName}</Text>
            <RatingLine rating={offering.worker.avgRating} count={offering.worker.totalJobsCompleted} />
          </View>
          {offering.pricingType === 'custom' && offering.moderationStatus === 'pending_review' && (
            <View style={styles.pendingTag}>
              <Text style={[type.label, { color: colors.inkSoft }]}>IN REVIEW</Text>
            </View>
          )}
        </View>
        <Text style={[type.h3, { color: colors.ink, marginTop: spacing.sm }]}>{offering.title}</Text>
        <Text style={[type.small, { color: colors.inkSoft, marginTop: 2 }]} numberOfLines={2}>
          {offering.description}
        </Text>
        <View style={styles.offeringFooter}>
          <Text style={[type.mono, { color: colors.primaryDark }]}>₹{offering.rate}/session</Text>
          <VerificationStamp tier={offering.worker.verificationTier} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  applicantCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  applicantHeader: { flexDirection: 'row', alignItems: 'center' },
  shortlistTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  rejectBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md },
  offeringCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offeringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingTag: {
    backgroundColor: colors.canvasAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});
