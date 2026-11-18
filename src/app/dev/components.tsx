import { Redirect, Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Avatar,
  BuildThumb,
  Button,
  ChipGroup,
  Chip,
  ChoiceGroup,
  ClassBadge,
  ConfirmBody,
  ConfirmSheet,
  DsText,
  EmptyState,
  EntityCard,
  ErrorState,
  IconButton,
  ListRow,
  LoadingState,
  RowDivider,
  ScreenHeader,
  SearchField,
  Section,
  SegmentedControl,
  Sheet,
  SheetOption,
  SheetPanel,
  StatBlock,
  Tag,
  ToastProvider,
  ToastView,
  metaLine,
  screenHeader,
  useToast,
} from '../../components/ds';
import { BuildArt } from '../../components/BuildArt';
import { CLASS_LETTERS } from '../../lib/types';
import { COLOR, RADII, SPACING, TYPE_SCALE, type TypeToken } from '../../theme';

/**
 * Developer gallery of the v2 design system: every component in every state.
 * Only in development builds (__DEV__); release builds redirect home. Not linked from the app.
 */
export default function ComponentsGallery() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ToastProvider>
      <Gallery />
    </ToastProvider>
  );
}

const noop = () => {};
// A local image so the gallery shows the photo states offline.
const PHOTO = require('../../../assets/icon.png');

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section title={title}>
      <View style={{ gap: SPACING.md }}>{children}</View>
    </Section>
  );
}

function Caption({ children }: { children: string }) {
  return <DsText v="caption">{children}</DsText>;
}

function Swatch({ name, colour }: { name: string; colour: string }) {
  return (
    <View style={{ width: 84, gap: SPACING.xs }}>
      <View style={{ height: 32, borderRadius: RADII.control, backgroundColor: colour, borderWidth: 1, borderColor: COLOR.surface.raisedHi }} />
      <DsText v="meta" numberOfLines={1}>
        {name}
      </DsText>
    </View>
  );
}

function Swatches({ label, colours }: { label: string; colours: Record<string, string> | readonly string[] }) {
  const entries = Array.isArray(colours) ? colours.map((c, i) => [`${i + 1}`, c] as const) : Object.entries(colours);
  return (
    <View style={{ gap: SPACING.sm }}>
      <DsText v="label">{label}</DsText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {entries.map(([k, c]) => (
          <Swatch key={k} name={k} colour={c} />
        ))}
      </View>
    </View>
  );
}

function Gallery() {
  const toast = useToast();
  const [kinds, setKinds] = useState<('car' | 'bike')[]>([]);
  const [classes, setClasses] = useState<string[]>(['S', 'A']);
  const [seg, setSeg] = useState<'mine' | 'invited' | 'public' | 'past'>('mine');
  const [scope, setScope] = useState<'near' | 'connections'>('near');
  const [travel, setTravel] = useState<'10' | '25' | '50' | 'any'>('25');
  const [reason, setReason] = useState<'spam' | 'unsafe' | 'other' | null>(null);
  const [query, setQuery] = useState('Snake');
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Stack.Screen options={screenHeader({ title: 'Components', onMenu: () => setSheet(true) })} />
      <ScrollView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl * 2 }}>
        <DsText v="secondary">Design system v2. Development builds only. See docs/DESIGN-SYSTEM.md.</DsText>

        <Group title="Colour roles">
          <Swatches label="Action" colours={{ primary: COLOR.action.primary, selectedTint: COLOR.action.selectedTint, destructive: COLOR.action.destructive }} />
          <Swatches label="Text" colours={COLOR.text} />
          <Swatches label="Surface" colours={COLOR.surface} />
          <Swatches label="State" colours={COLOR.state} />
          <Swatches label="Class metals" colours={COLOR.classMetal} />
          <Swatches label="Map layers" colours={COLOR.layer} />
          <Swatches label="Avatar" colours={COLOR.avatar} />
          <Swatches label="Paint (build colours)" colours={COLOR.paint} />
        </Group>

        <Group title="Type scale">
          {(Object.keys(TYPE_SCALE) as TypeToken[]).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.md }}>
              <DsText v="meta" style={{ width: 76 }}>
                {k}
              </DsText>
              <DsText v={k} numberOfLines={1} style={{ flex: 1 }}>
                {k === 'meta' ? 'Tonight 22:30 · 7 going · 3.2 mi' : k === 'stat' ? '583' : 'NightRunners late one'}
              </DsText>
            </View>
          ))}
        </Group>

        <Group title="Spacing and radii">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, flexWrap: 'wrap' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const).map((k) => (
              <View key={k} style={{ alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: SPACING[k], height: SPACING[k], backgroundColor: COLOR.surface.raisedHi }} />
                <DsText v="meta">{`${k} ${SPACING[k]}`}</DsText>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
            {(['tag', 'control', 'card', 'sheet'] as const).map((k) => (
              <View key={k} style={{ alignItems: 'center', gap: SPACING.xs }}>
                <View style={{ width: 56, height: 40, borderRadius: RADII[k], borderWidth: 1, borderColor: COLOR.surface.borderStrong }} />
                <DsText v="meta">{`${k} ${RADII[k]}`}</DsText>
              </View>
            ))}
          </View>
        </Group>

        <Group title="Screen header">
          <View style={{ backgroundColor: COLOR.surface.card, borderRadius: RADII.card, paddingHorizontal: SPACING.md }}>
            <ScreenHeader title="Events" action={{ label: '+ Host', onPress: noop }} bell />
          </View>
          <View style={{ backgroundColor: COLOR.surface.card, borderRadius: RADII.card, paddingHorizontal: SPACING.md }}>
            <ScreenHeader title="Garage" action={{ label: '+ Add', onPress: noop }} />
          </View>
          <Caption>Title, at most one text action, the bell, a ··· menu. Detail screens: no title, a menu.</Caption>
        </Group>

        <Group title="Buttons">
          <Button label="I'm going" onPress={() => toast({ message: "You're going. Have a good one." })} block haptic="success" />
          <Button label="Navigate" tier="secondary" onPress={noop} block />
          <Button label="Add a car or bike" tier="secondary" icon="plus" onPress={noop} block />
          <Button label="See all" tier="tertiary" onPress={noop} />
          <Button label="Leave the group" tier="destructive" onPress={() => setConfirm(true)} block />
          <Button label="Send feedback" onPress={noop} block disabled hint="Write something first" />
          <Button label="Decline" tier="destructive" onPress={noop} block disabled />
          <Button
            label="Check in"
            onPress={() => {
              setBusy(true);
              setTimeout(() => setBusy(false), 1500);
            }}
            block
            busy={busy}
          />
          <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button label="Small" size="sm" onPress={noop} />
            <Button label="Medium" tier="secondary" onPress={noop} />
            <IconButton icon="more" label="More options" onPress={noop} />
            <IconButton icon="search" label="Search" variant="glass" onPress={noop} />
          </View>
          <Button label="Start the drive" size="lg" onPress={noop} block />
        </Group>

        <Group title="Chips (many of many)">
          <ChipGroup
            label="Vehicles"
            allLabel="Cars and bikes"
            options={[
              { key: 'car', label: 'Cars' },
              { key: 'bike', label: 'Bikes' },
            ]}
            selected={kinds}
            onChange={setKinds}
          />
          <ChipGroup label="Class" options={CLASS_LETTERS.map((c) => ({ key: c, label: c }))} selected={classes} onChange={setClasses} />
          <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <Chip label="Audi" raw on={false} onPress={noop} />
            <Chip label="BMW" raw on onPress={noop} />
            <Chip label="Tonight" count={4} on onPress={noop} />
          </View>
          <Caption>Off: outline. On: tint, border and a tick. Nothing on = no filter.</Caption>
        </Group>

        <Group title="Segmented control (one view)">
          <SegmentedControl
            accessibilityLabel="Events"
            options={[
              { key: 'mine', label: 'Mine', count: 3 },
              { key: 'invited', label: 'Invited', count: 0 },
              { key: 'public', label: 'Public' },
              { key: 'past', label: 'Past' },
            ]}
            value={seg}
            onChange={setSeg}
          />
          <SegmentedControl
            options={[
              { key: 'near', label: 'Near you' },
              { key: 'connections', label: 'Connections' },
            ]}
            value={scope}
            onChange={setScope}
          />
        </Group>

        <Group title="Choice group (one of many)">
          <ChoiceGroup
            label="Willing to travel"
            options={[
              { key: '10', label: '10 mi' },
              { key: '25', label: '25 mi' },
              { key: '50', label: '50 mi' },
              { key: 'any', label: 'Any distance' },
            ]}
            value={travel}
            onChange={setTravel}
          />
          <ChoiceGroup
            label="Why are you reporting this?"
            layout="list"
            options={[
              { key: 'spam', label: 'Spam or selling', hint: 'Ads, scams, repeated posts' },
              { key: 'unsafe', label: 'Unsafe driving', hint: 'Street racing, stunts on public roads' },
              { key: 'other', label: 'Something else' },
            ]}
            value={reason}
            onChange={setReason}
          />
        </Group>

        <Group title="Avatar, class badge, build thumb">
          <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar name="Sam Patel" size="sm" />
            <Avatar name="Sam Patel" />
            <Avatar name="Sam Patel" size="lg" label="Sam Patel" />
            <Avatar handle="@night_owl" />
            <Avatar />
            <Avatar name="Photo" photo={PHOTO} />
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center', flexWrap: 'wrap' }}>
            {CLASS_LETTERS.map((c) => (
              <ClassBadge key={c} letter={c} />
            ))}
            <ClassBadge letter="S" size="sm" />
            <ClassBadge letter="A" size="lg" />
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center' }}>
            <BuildThumb kind="car" label="Golf R" />
            <BuildThumb kind="bike" label="ZX-6R" />
            <BuildThumb photo={PHOTO} label="Photo" />
          </View>
          <Caption>A person is a photo or initials in chalk, never a class badge. The build has its own thumb.</Caption>
        </Group>

        <Group title="Tags">
          <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <Tag label="Going" tone="success" />
            <Tag label="Hosting" tone="selected" />
            <Tag label="Requested" tone="warning" />
            <Tag label="Invited" tone="info" />
            <Tag label="Declined" tone="danger" />
            <Tag label="Live" tone="live" />
            <Tag label="Sample" />
            <Tag label="Golf R" raw />
          </View>
        </Group>

        <Group title="List rows">
          <View>
            <ListRow leading={{ avatar: { name: 'Sam Patel', handle: 'sam_p' } }} title="@sam_p" subtitle="Golf R · Class A" meta="3.2 mi · Level 2" onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ avatar: { handle: 'night_owl' } }} title="@night_owl" subtitle="Wants to connect" trailing={<Button label="Accept" tier="secondary" size="sm" onPress={noop} />} chevron={false} />
            <RowDivider inset />
            <ListRow leading={{ pin: 'rolling', colour: COLOR.layer.event }} title="NightRunners late one" subtitle="Rolling meet" meta={metaLine(['Tonight 22:30', '7 going', '3.2 mi'])} trailing={<Tag label="Going" tone="success" />} onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ pin: 'drive', colour: COLOR.layer.drive }} title="Snake Pass" subtitle="Drive · Derbyshire" meta="24 mi" onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ classBadge: 'A' }} title="Volkswagen Golf R" meta="583 bhp · 4 mods" onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ icon: 'bell' }} title="Coffee and cars starts in 30 min" subtitle="2 min ago" unread onPress={noop} />
            <RowDivider />
            <ListRow title="Willing to travel" trailing={<DsText v="secondary">25 mi</DsText>} onPress={noop} />
            <RowDivider />
            <ListRow title="Version" trailing={<DsText v="meta">1.0.0</DsText>} />
          </View>
        </Group>

        <Group title="Entity cards">
          <EntityCard
            kind="event"
            eyebrow="Rolling meet"
            layerColour={COLOR.layer.event}
            mark={{ pin: 'rolling', colour: COLOR.layer.event }}
            title="NightRunners late one"
            status={{ label: 'Live', tone: 'live' }}
            sample
            meta={metaLine(['Ends 01:30', '7 going', '3.2 mi'])}
            detail="Starts at Tamworth services, then 2 more meet points"
            chips={[{ label: 'Cars' }, { label: 'Class S A', raw: true }]}
            action={{ label: 'Check in', onPress: noop }}
            onPress={noop}
          />
          <EntityCard
            kind="place"
            eyebrow="Drive"
            layerColour={COLOR.layer.drive}
            mark={{ pin: 'drive', colour: COLOR.layer.drive }}
            title="Snake Pass"
            meta={metaLine(['Derbyshire', '24 mi'])}
            detail="A57, 15 miles of moorland bends"
            onPress={noop}
          />
          <EntityCard
            kind="build"
            eyebrow="Build"
            mark={{ classBadge: 'A' }}
            title="Volkswagen Golf R (Mk7.5)"
            media={<BuildArt kind="car" colour={COLOR.paint[2]} height={150} />}
            meta="583 bhp · 410 bhp/t · 4 mods"
            status={{ label: 'Dyno verified', tone: 'success' }}
            onPress={noop}
          />
          <EntityCard
            kind="person"
            eyebrow="Person"
            mark={{ avatar: { name: 'Sam Patel', handle: 'sam_p' } }}
            title="@sam_p"
            meta={metaLine(['Level 2', '3.2 mi'])}
            detail="Golf R, ZX-6R"
            action={{ label: 'Connect', onPress: noop }}
          />
          <EntityCard kind="event" eyebrow="Meet" layerColour={COLOR.layer.event} mark={{ pin: 'meet', colour: COLOR.layer.event }} title="Coffee and cars, October" meta="Sun 12 Oct · 23 went" status={{ label: 'Finished' }} finished onPress={noop} />
        </Group>

        <Group title="Stat block">
          <StatBlock
            stats={[
              { value: '583', unit: 'bhp', label: 'Power' },
              { value: '410', label: 'bhp per tonne' },
              { value: '4', label: 'Mods' },
            ]}
          />
          <StatBlock
            stats={[
              { value: '1:42', unit: 'h', label: 'Ends in', tone: 'live' },
              { value: '7', label: 'Going' },
              { value: '2/3', label: 'Point' },
            ]}
          />
        </Group>

        <Group title="Search field">
          <SearchField value="" onChangeText={noop} placeholder="Events, places or people" />
          <SearchField value={query} onChangeText={setQuery} placeholder="Search" />
          <SearchField value="B79 7" onChangeText={noop} loading />
          <SearchField onOpen={noop} placeholder="Where to?" floating />
        </Group>

        <Group title="Empty">
          <EmptyState variant="inline" title="No comments yet." action={{ label: 'Write one', onPress: noop }} />
          <EmptyState glyph="calendar" title="Nothing on near you tonight" body="Events within 25 mi show up here." action={{ label: 'Host an event', onPress: noop }} />
        </Group>

        <Group title="Loading">
          <LoadingState variant="inline" label="Finding you…" />
          <LoadingState rows={3} label="Loading events" />
        </Group>

        <Group title="Error">
          <ErrorState title="Couldn't load shops." onRetry={noop} />
          <ErrorState variant="block" title="Couldn't load events" body="Check your connection and try again." onRetry={noop} />
        </Group>

        <Group title="Sheet">
          <SheetPanel title="Event options" onClose={noop}>
            <SheetOption label="Share" onPress={noop} />
            <SheetOption label="Open in another app" detail="Apple Maps, Google Maps or Waze" onPress={noop} />
            <SheetOption label="Can't make it" destructive onPress={noop} />
          </SheetPanel>
          <Button label="Open the sheet" tier="secondary" block onPress={() => setSheet(true)} />
        </Group>

        <Group title="Confirmation">
          <View style={{ backgroundColor: COLOR.surface.card, borderRadius: RADII.card, padding: SPACING.lg }}>
            <ConfirmBody message="Leave Midlands Night Crew? You can ask to join again later." verb="Leave" onConfirm={noop} onCancel={noop} />
          </View>
          <Button label="Ask to confirm" tier="secondary" block onPress={() => setConfirm(true)} />
        </Group>

        <Group title="Toast">
          <ToastView message="Saved" />
          <ToastView message="Request sent to @sam_p" tone="info" />
          <ToastView message="Left the group" tone="danger" action={{ label: 'Undo', onPress: noop }} />
          <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <Button label="Show toast" tier="secondary" size="sm" onPress={() => toast({ message: 'Build saved' })} />
            <Button label="With undo" tier="secondary" size="sm" onPress={() => toast({ message: 'Post deleted', tone: 'danger', action: { label: 'Undo', onPress: noop } })} />
          </View>
        </Group>
      </ScrollView>

      <Sheet visible={sheet} title="Event options" onClose={() => setSheet(false)}>
        <SheetOption label="Share" onPress={() => setSheet(false)} />
        <SheetOption label="Edit" onPress={() => setSheet(false)} />
        <SheetOption label="Report this event" destructive onPress={() => setSheet(false)} />
      </Sheet>
      <ConfirmSheet
        visible={confirm}
        title="Leave the group?"
        message="You'll stop getting its messages. You can ask to join again later."
        verb="Leave"
        onConfirm={() => {
          setConfirm(false);
          toast({ message: 'Left the group', tone: 'danger', action: { label: 'Undo', onPress: noop } });
        }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
