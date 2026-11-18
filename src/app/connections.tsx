import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Avatar, openReport, OptionsSheet, type SheetOption } from '../components/Community';
import { Button, Card, EmptyState, InlineError, LinkText, Row, SampleTag, Section, Txt } from '../components/ui';
import { SAMPLE_PEOPLE } from '../data/seed';
import { useCommunity } from '../lib/communityStore';
import { CONNECT, idsIn } from '../lib/connections';
import { useStore } from '../lib/store';
import { F } from '../theme';

/** Requests waiting for you, requests you sent, your connections and the people you blocked. */
export default function ConnectionsScreen() {
  const { users } = useStore();
  const community = useCommunity();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const user = (id: string) => users.find((u) => u.id === id);
  const act = async (key: string, fn: () => Promise<unknown>) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not do that.');
    } finally {
      setBusy(null);
    }
  };
  const incoming = community.incoming;
  const outgoing = idsIn(community.connections, 'outgoing');
  const connected = idsIn(community.connections, 'connected');
  const blocked = Array.from(community.blocked);

  const Person = ({ id, children }: { id: string; children?: React.ReactNode }) => {
    const u = user(id);
    return (
      <Card style={{ gap: 10 }}>
        <Row style={{ flexWrap: 'nowrap' }} gap={10}>
          <Avatar user={u} size={36} />
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <Txt style={{ fontFamily: F.bodyBold }} numberOfLines={1}>@{u?.handle ?? 'someone'}</Txt>
              {SAMPLE_PEOPLE.includes(id) ? <SampleTag /> : null}
            </Row>
            {u ? <Txt v="caption">{u.name} · {u.region}</Txt> : null}
          </View>
          <LinkText label="Profile ›" onPress={() => router.push({ pathname: '/user/[id]', params: { id } })} accessibilityLabel={`@${u?.handle ?? 'someone'}'s profile`} />
        </Row>
        {children}
      </Card>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }}>
      <InlineError message={error} />
      <Section title={`Requests (${incoming.length})`}>
        {incoming.length === 0 ? <Txt v="muted">No requests waiting.</Txt> : null}
        {incoming.map((id) => (
          <Person key={id} id={id}>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label={CONNECT.accept} size="sm" style={{ flex: 1 }} busy={busy === `a${id}`} onPress={() => act(`a${id}`, () => community.run((s) => s.answerConnection(id, true)))} />
              <Button label={CONNECT.decline} kind="secondary" size="sm" style={{ flex: 1 }} busy={busy === `d${id}`} onPress={() => act(`d${id}`, () => community.run((s) => s.answerConnection(id, false)))} />
              <Button label={CONNECT.block} kind="danger" size="sm" onPress={() => openReport('block', id, id)} />
            </Row>
          </Person>
        ))}
        <Txt v="caption">They aren't told if you decline, and can't ask again for 30 days.</Txt>
      </Section>

      <Section title={`Connections (${connected.length})`}>
        {connected.length === 0 ? (
          <EmptyState glyph="community" title="No connections yet" body="Find people near you and tap Connect. Once they accept, you can message each other." action={{ label: 'Find people', onPress: () => router.replace({ pathname: '/community', params: { tab: 'people' } }) }} />
        ) : null}
        {connected.map((id) => (
          <Person key={id} id={id}>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button
                label={CONNECT.message}
                size="sm"
                kind="secondary"
                style={{ flex: 1 }}
                busy={busy === `m${id}`}
                onPress={() => act(`m${id}`, async () => router.push({ pathname: '/chat/[id]', params: { id: await community.run((s) => s.startDirect(id)) } }))}
              />
              <Button
                label="More"
                size="sm"
                kind="secondary"
                onPress={() =>
                  setMenu([
                    { label: CONNECT.remove, danger: true, onPress: () => void act(`r${id}`, () => community.run((s) => s.removeConnection(id))) },
                    { label: CONNECT.block, danger: true, onPress: () => openReport('block', id, id) },
                  ])
                }
              />
            </Row>
          </Person>
        ))}
      </Section>

      {outgoing.length ? (
        <Section title={`Sent (${outgoing.length})`}>
          {outgoing.map((id) => (
            <Person key={id} id={id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt v="caption">Waiting for them to accept.</Txt>
                <Button label={CONNECT.cancel} size="sm" kind="secondary" busy={busy === `c${id}`} onPress={() => act(`c${id}`, () => community.run((s) => s.removeConnection(id)))} />
              </Row>
            </Person>
          ))}
        </Section>
      ) : null}

      <Section title={`Blocked (${blocked.length})`}>
        {blocked.length === 0 ? <Txt v="muted">Nobody. Blocking hides someone's posts, replies and messages from you, ends any connection and stops messages both ways.</Txt> : null}
        {blocked.map((id) => (
          <Person key={id} id={id}>
            <Button label={CONNECT.unblock} size="sm" kind="secondary" busy={busy === `u${id}`} onPress={() => act(`u${id}`, () => community.run((s) => s.unblock(id)))} />
          </Person>
        ))}
      </Section>
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
