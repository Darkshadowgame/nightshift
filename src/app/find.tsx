import { Redirect, useLocalSearchParams } from 'expo-router';

/** Find is now Search (search.tsx): old links keep working. */
export default function FindRedirect() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  return <Redirect href={{ pathname: '/search', params: { ...(q ? { q } : {}), tab: 'events' } }} />;
}
