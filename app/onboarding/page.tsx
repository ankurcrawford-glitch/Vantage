// The old 12-question onboarding flow was replaced by Story Builder
// (and the gateway grade fork). Nothing links here anymore; redirect
// old bookmarks to the current experience.
import { permanentRedirect } from 'next/navigation';

export default function OnboardingRedirect() {
  permanentRedirect('/story-builder');
}
