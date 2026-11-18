import { Redirect, Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import {
  ActionBar,
  Avatar,
  BuildThumb,
  Button,
  ChipGroup,
  Chip,
  ChoiceGroup,
  ClassBadge,
  ConfirmBody,
  ConfirmSheet,
  DateTimeField,
  DsText,
  EmptyState,
  EntityCard,
  HeaderActions,
  ErrorState,
  GoingStrip,
  Hero,
  IconButton,
  ListRow,
  LoadingState,
  LocationLine,
  PaintArt,
  PhotoCard,
  Press,
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
import { PhotoCredit } from '../../components/PhotoCredit';
import { appNow } from '../../lib/appClock';
import { goingSummary } from '../../lib/format';
import { DEMO_NIGHT } from '../../lib/glossary';
import { samplePhoto } from '../../lib/photoSource';
import { CLASS_LETTERS } from '../../lib/types';
import { eventTimeLabel, timeRange } from '../../lib/when';
import { ASPECT, COLOR, RADII, SPACING, TYPE_SCALE, type TypeToken } from '../../theme';

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
// Bundled sample photos (src/data/samplePhotos.ts), so the gallery shows the photo states offline.
const PHOTO = samplePhoto('b-dan-0')?.image ?? require('../../../assets/icon.png');
const BUILD_PHOTO = samplePhoto('b-kez-0')?.image ?? PHOTO;
const PLACE_PHOTO = samplePhoto('ph-mam-nick')?.image ?? PHOTO;
const POST_PHOTO = samplePhoto('b-bex-0')?.image ?? PHOTO;
const PEOPLE = [
  { id: '1', handle: 'dan_r', photo: PHOTO },
  { id: '2', handle: 'em_i30n' },
  { id: '3', name: 'Kez Ward', handle: 'kez_fk8', photo: BUILD_PHOTO },
  { id: '4', handle: 'tomtom_gr' },
  { id: '5', handle: 'bex_gti', photo: POST_PHOTO },
  { id: '6', handle: 'aimee_r1' },
  { id: '7', handle: 'sully' },
  { id: '8', handle: 'raf' },
  { id: '9', handle: 'ash' },
];

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

function Swatches({ label, colours }: { label: string; colours: Record<string, string | readonly string[]> | readonly string[] }) {
  const entries = Array.isArray(colours) ? colours.map((c, i) => [`${i + 1}`, c] as const) : Object.entries(colours).filter((e): e is [string, string] => typeof e[1] === 'string');
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
  const now = appNow();
  const [start, setStart] = useState<Date | null>(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [runDay, setRunDay] = useState<Date | null>(null);
  const [going, setGoing] = useState(false);
  const [demo, setDemo] = useState(false);
  const liveStart = new Date(now.getTime() - 40 * 60_000);
  const liveEnd = new Date(now.getTime() + 100 * 60_000);
  const later = new Date(now.getTime() + 3 * 3_600_000);
  const goNow = () => {
    setGoing(true);
    toast({ message: "You're going with your Fiesta ST", action: { label: 'Change', onPress: noop } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <Stack.Screen options={screenHeader({ title: 'Components', onMenu: () => setSheet(true) })} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xl }}>
        <DsText v="secondary">Design system v2 with the Redesign 2 foundation. Development builds only. See docs/DESIGN-SYSTEM.md.</DsText>

        <Group title="Tab header (T1, T2)">
          <View style={{ backgroundColor: COLOR.surface.card, borderRadius: RADII.card, paddingHorizontal: SPACING.md }}>
            <ScreenHeader
              title="Tonight"
              tag={
                <Press onPress={() => setDemo(true)} label={`${DEMO_NIGHT.tag}. What's this?`}>
                  <Tag label={DEMO_NIGHT.tag} tone="info" />
                </Press>
              }
              add={{ label: 'Host a meet', onPress: noop }}
              bell
            />
          </View>
          <View style={{ backgroundColor: COLOR.surface.card, borderRadius: RADII.card, paddingHorizontal: SPACING.md }}>
            <ScreenHeader title="Me" bell />
          </View>
          <Caption>Caps title; "+" (Tonight, Community, Garage only) then the bell. Never a text action. The DEMO NIGHT tag opens a Sheet.</Caption>
        </Group>

        <Group title="PhotoCard: events">
          <PhotoCard
            kind="event"
            photo={PHOTO}
            titleOnPhoto
            live
            eyebrow="Meet"
            layerColour={COLOR.layer.event}
            title="Car park meet-up"
            meta={[eventTimeLabel(liveStart, liveEnd, now), '2 mi', '9 going'].join(' · ')}
            tag={going ? { label: 'Going', tone: 'success' } : null}
            action={going ? { label: 'Open', onPress: noop } : { label: "I'm going", tier: 'primary', haptic: 'success', onPress: goNow }}
            overlay={<PhotoCredit overlay photoRef="b-dan-0" corner="topRight" />}
            onPress={noop}
          />
          <Caption>The Tonight map's pick card: title on the photo, the screen's one primary. Once going: Open (secondary) and the Going tag.</Caption>
          <PhotoCard kind="event" eyebrow="Rolling meet" layerColour={COLOR.layer.event} title="Late rolling meet" meta={[timeRange(later, new Date(later.getTime() + 9_000_000), now), 'about 6 mi', '4 going'].join(' · ')} onPress={noop} />
          <Caption>No photo: the area-circle drawing in the layer colour, never grey. Meta under the photo in lists.</Caption>
          <PhotoCard kind="event" eyebrow="Cruise" layerColour={COLOR.layer.event} photo={PLACE_PHOTO} title="Friday night cruise" meta="Tomorrow 20:00 · about 9 mi" detail="Not open to your car" onPress={noop} />
          <PhotoCard kind="event" eyebrow="Meet" layerColour={COLOR.layer.event} title="Last week's meet" meta="Ended Fri · 23 went" tag={{ label: 'Ended' }} finished onPress={noop} />
        </Group>

        <Group title="PhotoCard: builds and posts">
          <PhotoCard kind="build" photo={BUILD_PHOTO} titleOnPhoto classLetter="A" title="Honda Civic Type R FK8" meta="306 bhp · 3 mods" tag={{ label: '✓ Dyno', tone: 'success' }} action={{ label: 'Add a mod', onPress: noop }} onPress={noop} />
          <PhotoCard kind="build" paint={COLOR.paint[2]} titleOnPhoto classLetter="B" title="Ford Fiesta ST Mk8" meta="197 bhp · stock" onPress={noop} />
          <PhotoCard kind="build" paint={COLOR.paint[1]} vehicle="bike" titleOnPhoto classLetter="C" title="Yamaha MT-07" meta="73 bhp · stock" onPress={noop} />
          <Caption>4:3, title on the gradient with the ClassBadge. No photo: the silhouette on the build's paint colour.</Caption>
          <PhotoCard kind="build" size="sm" paint={COLOR.paint[3]} classLetter="B" title="Ford Fiesta ST Mk8" meta="197 bhp" />
          <Caption>size="sm": the picked build in onboarding.</Caption>
          <PhotoCard kind="post" photo={POST_PHOTO} title="@bex_gti" meta="Volkswagen Golf GTI · 2 h" detail="Fresh wheels on for Friday. Who's coming to the car park meet?" onPress={noop} />
        </Group>

        <Group title="Hero (T3)">
          <View style={{ marginTop: SPACING.screen }}>
            <Hero
              bleed
              photo={PHOTO}
              eyebrow="Rolling meet"
              layerColour={COLOR.layer.event}
              title="Late rolling meet"
              meta={`${timeRange(later, new Date(later.getTime() + 9_000_000), now)} · Around Tamworth`}
              tag={{ label: 'Going', tone: 'success' }}
              overlay={<PhotoCredit overlay photoRef="b-dan-0" corner="topRight" />}
            />
          </View>
          <Hero
            media={<PaintArt paint={COLOR.paint[0]} />}
            aspect={ASPECT.build}
            classLetter="A"
            eyebrow="Build"
            title="Honda Civic Type R FK8"
            meta="306 bhp · 3 mods"
          />
          <Hero eyebrow="Crew" title="Midlands Night Crew" meta={['12 members', 'Around Birmingham']} />
          <Caption>photo: title on the gradient in the hero type. media: words under it. Neither: words only (replaces DetailHero). `bleed` runs the photo edge to edge inside PAGE.</Caption>
        </Group>

        <Group title="Location line (the status line)">
          <LocationLine state="notGoing" time="21:30" />
          <LocationLine state="hidden" time="21:30" minutesTo={20} />
          <LocationLine state="shown" point="Leisure park car park" town="Tamworth" note="Check-in opens at 21:30." />
          <LocationLine state="rolling" point="Ventura retail park" />
          <LocationLine state="host" time="21:30" leadMinutes={60} />
          <LocationLine text="Leisure park car park, Tamworth. Voting is open until tomorrow 23:00." />
          <Caption>The 4.11 words only. The one countdown on a screen ("(in 20 min)", under an hour only).</Caption>
        </Group>

        <Group title="Going strip">
          <GoingStrip people={PEOPLE} summary={goingSummary(9, 7, 2)} onPress={noop} />
          <GoingStrip people={PEOPLE.slice(0, 3)} summary={goingSummary(3, 3, 0)} />
          <GoingStrip people={[]} summary="Be the first to go" />
        </Group>

        <Group title="Action bar (T3, T4)">
          <Caption>Pinned after the ScrollView (see the bottom of this screen). Inline here with inset off.</Caption>
          <ActionBar inset={false} primary={{ label: 'Check in', onPress: noop, haptic: 'success' }} secondary={{ label: 'Navigate', onPress: noop }} />
          <ActionBar inset={false} status="Location at 21:30" secondary={{ label: 'Remind me', onPress: () => toast({ message: "We'll remind you at 21:30" }) }} />
          <ActionBar inset={false} primary={{ label: 'Try the demo', onPress: noop }} secondary={{ label: 'Sign in', onPress: noop }} />
          <ActionBar inset={false} secondary={{ label: 'See photos', onPress: noop }} />
          <Caption>Never a disabled primary: a status pill and a secondary that helps.</Caption>
        </Group>

        <Group title="Date and time">
          <DateTimeField label="Starts" value={start} onChange={setStart} minDate={now} />
          <DateTimeField label="Date of the run" mode="date" past value={runDay} onChange={setRunDay} maxDate={now} placeholder="Pick a day" />
          <Caption>DateTimeSheet: 14 days, then Another day (month calendar); hours 00–23 and minutes in 15s. Never a typed date.</Caption>
        </Group>

        <Group title="Colour roles">
          <Swatches label="Action" colours={{ primary: COLOR.action.primary, link: COLOR.action.link, selectedTint: COLOR.action.selectedTint, destructive: COLOR.action.destructive }} />
          <Swatches label="Badge" colours={COLOR.badge} />
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

        <Group title="Pushed header (T3)">
          <View style={{ backgroundColor: COLOR.surface.card, borderRadius: RADII.card, paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center' }}>
            <IconButton icon="back" label="Go back" onPress={noop} />
            <View style={{ flex: 1 }} />
            <HeaderActions action={{ label: 'Share', onPress: noop }} onMenu={() => setSheet(true)} />
          </View>
          <Caption>Back (from the root layout) on the left; at most one text action (Share) and ··· on the right. No title on detail screens.</Caption>
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
          <Caption>Off: outline. On: tint, sodium border and bold sodium text. Nothing on = no filter.</Caption>
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
            <Tag label="Checked in" tone="success" />
            <Tag label="✓ Dyno" tone="success" />
            <Tag label="Declined" tone="danger" />
            <Tag label="Live" tone="live" />
            <Tag label={DEMO_NIGHT.tag} tone="info" />
            <Tag label="Golf R" raw />
          </View>
        </Group>

        <Group title="List rows">
          <View>
            <ListRow leading={{ avatar: { name: 'Sam Patel', handle: 'sam_p' } }} title="@sam_p" subtitle="Golf R · Class A" meta="3 mi" onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ avatar: { handle: 'night_owl' } }} title="@night_owl" subtitle="Wants to connect" trailing={<Button label="Accept" tier="secondary" size="sm" onPress={noop} />} chevron={false} />
            <RowDivider inset />
            <ListRow leading={{ pin: 'rolling', colour: COLOR.layer.event }} title="NightRunners late one" subtitle="Rolling meet" meta={metaLine(['Tonight 22:30', '7 going', '3 mi'])} trailing={<Tag label="Going" tone="success" />} onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ pin: 'drive', colour: COLOR.layer.drive }} title="Snake Pass" subtitle="Drive · Derbyshire" meta="24 mi" onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ classBadge: 'A' }} title="Volkswagen Golf R" meta="330 bhp · 4 mods" onPress={noop} />
            <RowDivider inset />
            <ListRow leading={{ icon: 'bell' }} title="Coffee and cars starts in 30 min" subtitle="2 min ago" unread onPress={noop} />
            <RowDivider />
            <ListRow title="Willing to travel" trailing={<DsText v="secondary">25 mi</DsText>} onPress={noop} />
            <RowDivider />
            <ListRow title="Version" trailing={<DsText v="meta">1.0.0</DsText>} />
          </View>
        </Group>

        <Group title="Entity card (deprecated)">
          <EntityCard kind="place" eyebrow="Drive" layerColour={COLOR.layer.drive} mark={{ pin: 'drive', colour: COLOR.layer.drive }} title="Snake Pass" meta={metaLine(['Derbyshire', '24 mi'])} detail="A57, 15 miles of moorland bends" onPress={noop} />
          <Caption>Browse surfaces move to PhotoCard. Kept until the screens move over.</Caption>
        </Group>

        <Group title="Stat block">
          <StatBlock
            stats={[
              { value: '306', unit: 'bhp', label: 'Power' },
              { value: 'A', label: 'Class' },
              { value: '3', label: 'Mods' },
            ]}
          />
          <StatBlock
            stats={[
              { value: '3', label: 'Meets' },
              { value: '1', label: 'Hosted' },
              { value: '1', label: 'Trophies' },
            ]}
          />
        </Group>

        <Group title="Search field">
          <SearchField value="" onChangeText={noop} placeholder="Search meets, places, people" />
          <SearchField value={query} onChangeText={setQuery} placeholder="Search" />
          <SearchField value="B79 7" onChangeText={noop} loading />
          <SearchField onOpen={noop} placeholder="Search meets, places…" floating />
        </Group>

        <Group title="Empty">
          <EmptyState variant="inline" title="No comments yet." action={{ label: 'Write one', onPress: noop }} />
          <EmptyState glyph="calendar" title="Nothing yet" body="Say you're going to a meet and we'll remind you." action={{ label: 'See tonight', onPress: noop }} />
        </Group>

        <Group title="Loading">
          <LoadingState variant="inline" label="Finding you…" />
          <LoadingState rows={3} label="Loading events" />
        </Group>

        <Group title="Error">
          <ErrorState title="Couldn't load photos." onRetry={noop} />
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
      <ActionBar primary={{ label: 'Show a toast', onPress: () => toast({ message: 'Saved' }), haptic: 'success' }} secondary={{ label: 'Open the sheet', onPress: () => setSheet(true) }} />

      <Sheet visible={demo} title={DEMO_NIGHT.title} onClose={() => setDemo(false)}>
        <DsText v="body">{DEMO_NIGHT.body}</DsText>
      </Sheet>
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
    </View>
  );
}
