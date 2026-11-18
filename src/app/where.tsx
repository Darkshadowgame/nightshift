import { Redirect, useLocalSearchParams } from 'expo-router';

/** Where to? is now Search › Addresses (search.tsx): old links keep working. */
export default function WhereRedirect() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  return <Redirect href={{ pathname: '/search', params: { ...(q ? { q } : {}), tab: 'addresses' } }} />;
}
