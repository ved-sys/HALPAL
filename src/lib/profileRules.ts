// Rules shared by Edit Profile and the first-run name step, so the two
// can never disagree about what counts as a valid profile.

export const NAME_MIN = 2;
export const NAME_MAX = 50;
export const BIO_MAX = 300;
export const SKILLS_MAX = 10;

/** The name new profiles are created with; prompts the first-run step. */
export const PLACEHOLDER_NAME = 'New User';
/** What a deleted account's profile is renamed to. */
export const DELETED_NAME = 'Deleted user';

/** Returns a message for an invalid name, or null when it is fine. */
export function validateFullName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < NAME_MIN) return `Enter at least ${NAME_MIN} characters.`;
  if (name.length > NAME_MAX) return `Keep it to ${NAME_MAX} characters or fewer.`;
  if (name === PLACEHOLDER_NAME || name === DELETED_NAME) return 'Choose a different name.';
  return null;
}

export function isDeletedProfile(p: { fullName: string } | null | undefined): boolean {
  return p?.fullName === DELETED_NAME;
}
