import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';

// Placeholder copy only. Both documents must be reviewed (ideally by
// someone qualified) before launch, and CONTACT_EMAIL replaced with a real
// address.
const CONTACT_EMAIL = '[contact email to be added]';

interface Section {
  heading: string;
  body: string[];
}

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: 'What we collect',
    body: [
      'Your phone number, which is how you sign in.',
      'Your profile: name, avatar colour or photo, skills and a short bio.',
      'Jobs you post or apply to, offerings you list, and booking requests.',
      'Messages you send in Halpal chats, and reviews you leave or receive.',
    ],
  },
  {
    heading: 'Why we collect it',
    body: [
      'To sign you in and keep your account secure.',
      'To match customers with workers, and to run each job from posting through completion.',
      'To let both sides of a job talk to each other and review each other afterwards.',
      'To look into disputes, using the job record and its chat.',
    ],
  },
  {
    heading: 'Who can see it',
    body: [
      'Open jobs are visible to anyone signed in to Halpal.',
      'Your name, rating, skills and offerings are visible to other users.',
      'A chat is visible only to its two participants, and to Halpal staff when a dispute is raised.',
      'The app does not show your phone number to other users.',
      'We do not sell your data.',
    ],
  },
  {
    heading: 'Deleting your data',
    body: [
      `You can ask us to delete your account and its data by emailing ${CONTACT_EMAIL}. In-app deletion is coming soon.`,
      'Some records, such as completed jobs that are under dispute, may need to be kept for a limited time.',
    ],
  },
  {
    heading: 'Contact',
    body: [`Questions about this policy: ${CONTACT_EMAIL}.`],
  },
];

const TERMS_SECTIONS: Section[] = [
  {
    heading: 'Using Halpal',
    body: [
      'Halpal connects people who need simple jobs done with people who can do them. Halpal is not a party to the agreement between a customer and a worker.',
      'You must give accurate information and keep your account to yourself.',
    ],
  },
  {
    heading: 'Jobs and bookings',
    body: [
      'Customers describe each job honestly, including its location, timing and budget.',
      'Workers only accept jobs they can safely complete.',
      'A job is complete when the customer confirms it with the completion code. If something goes wrong, either side can raise a dispute.',
    ],
  },
  {
    heading: 'Conduct',
    body: [
      'No harassment, discrimination, illegal work or unsafe requests.',
      'We may remove content or suspend accounts that break these terms.',
    ],
  },
  {
    heading: 'Liability',
    body: [
      'To the extent the law allows, Halpal is not liable for how a job is carried out or for loss or damage arising from it.',
    ],
  },
  {
    heading: 'Contact',
    body: [`Questions about these terms: ${CONTACT_EMAIL}.`],
  },
];

function LegalDocument({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <View style={styles.draftBanner}>
          <Text style={[type.bodyStrong, { color: colors.danger }]}>Draft, to be reviewed before launch</Text>
        </View>
        <Text style={[type.display, { color: colors.ink, marginTop: spacing.lg }]}>{title}</Text>
        {sections.map((section) => (
          <View key={section.heading} style={{ marginTop: spacing.lg }}>
            <Text style={[type.h2, { color: colors.ink }]}>{section.heading}</Text>
            {section.body.map((line) => (
              <Text key={line} style={[type.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PrivacyPolicyScreen() {
  return <LegalDocument title="Privacy Policy" sections={PRIVACY_SECTIONS} />;
}

export function TermsScreen() {
  return <LegalDocument title="Terms of Service" sections={TERMS_SECTIONS} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  draftBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
