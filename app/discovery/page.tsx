// This route was renamed to /story-builder so the URL matches the
// user-facing label ("Story Builder"). A permanent redirect keeps any
// bookmarks, external links, or shared URLs working.
import { permanentRedirect } from 'next/navigation';

export default function DiscoveryRedirect() {
  permanentRedirect('/story-builder');
}
