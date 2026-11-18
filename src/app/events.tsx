import { Redirect } from 'expo-router';

/** The Events tab became Tonight's list view: old links (and notifications) land there. */
export default function EventsRedirect() {
  return <Redirect href={{ pathname: '/', params: { view: 'list' } }} />;
}
