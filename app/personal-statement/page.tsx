// This route was renamed to /applications so the URL matches the
// user-facing label ("Applications"). A permanent redirect keeps any
// bookmarks, external links, or shared URLs working.
import { permanentRedirect } from 'next/navigation';

export default function PersonalStatementRedirect() {
  permanentRedirect('/applications');
}
