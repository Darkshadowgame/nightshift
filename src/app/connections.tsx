import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { at, MEET_ACTION, openProfile, openReport, OptionsSheet, personMark, type SheetOption } from '../components/Community';
import { Button, DsText, EmptyState, ErrorState, IconButton, ListRow, RowDivider, Section, metaLine } from '../components/ds';
import { useCommunity } from '../lib/communityStore';
import { CONNECT, idsIn } from '../lib/connections';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';

/** Requests waiting for you, your connections, requests you sent and the people you blocked. */
export default function ConnectionsScreen() {
  const { users } = useStore();
  const community = useCommunity();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ title: string; options: SheetOption[] } | null>(null);
  const user = (id: string) => users.find((u) => u.id === id);
  const act = async (key: string, fn: () => Promise<unknown>) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(null);
    }
  };
  const incoming = community.incoming;
  const outgoing = idsIn(community.connections, 'outgoing');
  const connected = idsIn(community.connections, 'connected');
  const blocked = Array.from(community.blocked);

  /** One person: avatar, handle, name and region; their actions on the right. */
  const Person = ({ id, actions, first }: { id: string; actions: React.ReactNode; first: boolean }) => {
    const u = user(id);
    return (
      <View>
        {first ? null : <RowDivider inset />}
        <ListRow
          leading={{ avatar: personMark(u) }}
          title={at(u)}
          subtitle={u ? metaLine([u.name, u.region]) : undefined}
          trailing={<View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>{actions}</View>}
        />
      </View>
    );
  };
  const more = (id: string, options: SheetOption[]) => (
    <IconButton icon="more" label={`More for ${at(user(id))}`} colour={COLOR.text.secondary} onPress={() => setMenu({ title: 'Options', options: [{ label: 'View profile', onPress: () => openProfile(id) }, ...options] })} />
  );
  const block = (id: string): SheetOption => ({ label: CONNECT.block, danger: true, onPress: () => openReport('block', id, id) });

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }}>
      {error ? <ErrorState title={error} /> : null}
      <Section title={`Requests (${incoming.length})`}>
        {incoming.length === 0 ? <EmptyState variant="inline" title="No requests waiting." /> : null}
        <View>
          {incoming.map((id, i) => (
            <Person
              key={id}
              id={id}
              first={i === 0}
              actions={
                <>
                  <Button label={CONNECT.accept} tier="secondary" size="sm" haptic="success" busy={busy === `a${id}`} onPress={() => act(`a${id}`, () => community.run((s) => s.answerConnection(id, true)))} />
                  {more(id, [{ label: CONNECT.decline, onPress: () => void act(`d${id}`, () => community.run((s) => s.answerConnection(id, false))) }, block(id)])}
                </>
              }
            />
          ))}
        </View>
        {incoming.length ? <DsText v="caption">They aren't told if you decline, and can't ask again for 30 days.</DsText> : null}
      </Section>

      <Section title={`Connections (${connected.length})`}>
        {connected.length === 0 ? <EmptyState glyph="community" title="No connections yet" body="Meet people at an event, open their profile and tap Connect. Once they accept, you can message each other." action={MEET_ACTION} /> : null}
        <View>
          {connected.map((id, i) => (
            <Person
              key={id}
              id={id}
              first={i === 0}
              actions={
                <>
                  <Button
                    label={CONNECT.message}
                    size="sm"
                    tier="secondary"
                    busy={busy === `m${id}`}
                    onPress={() => act(`m${id}`, async () => router.push({ pathname: '/chat/[id]', params: { id: await community.run((s) => s.startDirect(id)) } }))}
                  />
                  {more(id, [{ label: CONNECT.remove, danger: true, onPress: () => void act(`r${id}`, () => community.run((s) => s.removeConnection(id))) }, block(id)])}
                </>
              }
            />
          ))}
        </View>
      </Section>

      {outgoing.length ? (
        <Section title={`Sent (${outgoing.length})`}>
          <View>
            {outgoing.map((id, i) => (
              <Person
                key={id}
                id={id}
                first={i === 0}
                actions={<Button label="Cancel" size="sm" tier="secondary" accessibilityLabel={`${CONNECT.cancel} to ${at(user(id))}`} busy={busy === `c${id}`} onPress={() => act(`c${id}`, () => community.run((s) => s.removeConnection(id)))} />}
              />
            ))}
          </View>
          <DsText v="caption">Waiting for them to accept.</DsText>
        </Section>
      ) : null}

      <Section title={`Blocked (${blocked.length})`}>
        {blocked.length === 0 ? <DsText v="secondary">Nobody. Blocking hides someone's posts, replies and messages from you, ends any connection, and neither of you can message the other.</DsText> : null}
        <View>
          {blocked.map((id, i) => (
            <Person key={id} id={id} first={i === 0} actions={<Button label={CONNECT.unblock} size="sm" tier="secondary" busy={busy === `u${id}`} onPress={() => act(`u${id}`, () => community.run((s) => s.unblock(id)))} />} />
          ))}
        </View>
      </Section>
      <OptionsSheet visible={!!menu} title={menu?.title} options={menu?.options ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
