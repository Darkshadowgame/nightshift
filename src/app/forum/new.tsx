import { Stack, useLocalSearchParams } from 'expo-router';
import { SCREEN_TITLES, title as screenTitle } from '../../lib/glossary';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { BuildChooser, ComposerPhotos, Field, INPUT, useDiscardGuard } from '../../components/ComposerParts';
import { ActionBar, ChoiceGroup, DsText, ErrorState, PAGE_WITH_BAR, SwitchRow, useToast } from '../../components/ds';
import { SELLING_HINT, sellingHint } from '../../lib/moderation';
import { useCommunity, useMediaLimits } from '../../lib/communityStore';
import { openCreated } from '../../lib/openCreated';
import {
  BOARDS,
  CONDITIONS,
  HANDOVERS,
  LIMITS,
  LISTING_KINDS,
  parsePrice,
  threadProblem,
  type BoardKey,
  type Handover,
  type ListingCondition,
  type ListingKind,
  typedOno,
} from '../../lib/forum';
import { REGIONS } from '../../lib/profile';
import { useStore } from '../../lib/store';
import { ComposerVideo } from '../../components/Video';
import type { VideoDraft } from '../../lib/videoRules';
import { COLOR, SPACING } from '../../theme';

/**
 * Start a thread: board, title, body, photos (plate-blurred) and a linked build. On For sale and
 * wanted it's a listing too: for sale or wanted, a price or budget (ONO), condition, and
 * collection or postage. `board`, `buildId` and `body` params preset it ("Sell a part" from a build).
 */
export default function NewThread() {
  const params = useLocalSearchParams<{ board?: string; buildId?: string; body?: string }>();
  const { users, me, builds } = useStore();
  const community = useCommunity();
  const mine = builds.filter((b) => b.ownerId === me);
  const myRegion = users.find((u) => u.id === me)?.region || REGIONS[0].name;
  const [board, setBoard] = useState<BoardKey>(BOARDS.some((b) => b.key === params.board) ? (params.board as BoardKey) : 'advice');
  const [region, setRegion] = useState(myRegion);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(params.body ?? '');
  const [photos, setPhotos] = useState<string[]>([]);
  const limits = useMediaLimits();
  const [video, setVideo] = useState<VideoDraft | null>(null);
  const [buildId, setBuildId] = useState<string | undefined>(mine.some((b) => b.id === params.buildId) ? params.buildId : undefined);
  const [kind, setKind] = useState<ListingKind>('sale');
  const [price, setPrice] = useState('');
  const [ono, setOno] = useState(false);
  const [condition, setCondition] = useState<ListingCondition | null>(null);
  const [handover, setHandover] = useState<Handover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const info = BOARDS.find((b) => b.key === board)!;
  const sellOnly = params.board === 'for_sale';
  const listing = board === 'for_sale';
  const pence = parsePrice(price);
  const toast = useToast();
  const guard = useDiscardGuard(!!title.trim() || body.trim() !== (params.body ?? '').trim() || photos.length > 0 || !!video || !!price.trim(), listing ? 'this listing' : 'this thread');

  async function submit() {
    setError(null);
    if (!title.trim()) return setError('Give it a title first.');
    if (listing && Number.isNaN(pence)) return setError('Give the price in pounds, like 450 or 450.50.');
    const draft = {
      board,
      region: board === 'local' ? region : undefined,
      title,
      body,
      photos,
      video,
      buildId,
      ...(listing
        ? { listing: { kind, ...(pence != null ? { pricePence: pence } : {}), ...(ono && pence != null ? { ono: true } : {}), ...(kind === 'sale' && condition ? { condition } : {}), ...(handover ? { handover } : {}) } }
        : {}),
    };
    const p = threadProblem(draft);
    if (p) return setError(p);
    setBusy(true);
    try {
      const id = await community.run((s) => s.createThread(draft));
      // Close the composer, then push the thread: Back from it returns to the forum list.
      toast({ message: 'Posted' });
      guard.leave(() => openCreated({ pathname: '/forum/[id]', params: { id } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      {/* "Sell or find a part" opens a listing, so the header says so (REVIEW-9). */}
      <Stack.Screen options={{ title: screenTitle(sellOnly ? 'Sell a part' : listing ? 'For sale or wanted' : SCREEN_TITLES.newThread) }} />
      {/* "Sell a part" / "Sell or find a part" open a listing: no board picker there (REVIEW-10). */}
      {sellOnly ? null : (
        <View style={{ gap: SPACING.xs }}>
          <ChoiceGroup<BoardKey> label="Board" layout="list" value={board} onChange={setBoard} options={BOARDS.map((b) => ({ key: b.key, label: b.label }))} />
          <DsText v="caption">{info.hint}</DsText>
        </View>
      )}
      {board === 'local' ? <ChoiceGroup<string> label="Region" layout="list" value={region} onChange={setRegion} options={REGIONS.map((r) => ({ key: r.name, label: r.name }))} /> : null}
      {listing ? <ChoiceGroup<ListingKind> label="Listing" value={kind} onChange={setKind} options={LISTING_KINDS.map((k) => ({ key: k.key, label: k.label }))} /> : null}
      <Field label="Title" hint={listing ? (kind === 'sale' ? 'What it is, and what it fits.' : "What you're after, and what it's for.") : 'One line that says what you need. People pick threads by the title.'}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={listing && kind === 'wanted' ? 'e.g. Wanted: genuine Saxo VTS rear arches' : info.title}
          placeholderTextColor={COLOR.text.secondary}
          maxLength={LIMITS.title[1]}
          accessibilityLabel="Thread title"
          style={INPUT}
        />
      </Field>
      {listing ? (
        <>
          <View style={{ gap: SPACING.xs }}>
            <Field label={kind === 'sale' ? 'Price' : 'Budget'} hint={kind === 'sale' ? 'Optional. Leave it empty for offers.' : 'Optional. Leave it empty if you’re open to offers.'}>
              <TextInput
                value={price}
                onChangeText={(t) => {
                  setPrice(t);
                  // "250 ono" turns ONO on (REVIEW-9).
                  if (typedOno(t)) setOno(true);
                }}
                placeholder="£ e.g. 450"
                placeholderTextColor={COLOR.text.secondary}
                keyboardType="default"
                autoCapitalize="none"
                maxLength={12}
                accessibilityLabel={kind === 'sale' ? 'Price in pounds' : 'Budget in pounds'}
                style={INPUT}
              />
            </Field>
            <SwitchRow label="Or nearest offer (ONO)" hint={pence == null ? 'Add a price first.' : undefined} value={ono && pence != null} onValueChange={setOno} />
          </View>
          {kind === 'sale' ? <ChoiceGroup<ListingCondition> label="Condition" value={condition} onChange={setCondition} options={CONDITIONS.map((c) => ({ key: c.key, label: c.label }))} /> : null}
          <ChoiceGroup<Handover> label={kind === 'sale' ? 'Collection or postage' : 'Collect or posted'} value={handover} onChange={setHandover} options={HANDOVERS.map((h) => ({ key: h.key, label: h.label }))} />
        </>
      ) : null}
      <Field label="Details">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={listing && kind === 'wanted' ? 'What fits, the condition you’d take, and roughly where you are…' : info.body}
          placeholderTextColor={COLOR.text.secondary}
          multiline
          maxLength={LIMITS.body}
          accessibilityLabel="Thread details"
          style={[INPUT, { minHeight: 140, textAlignVertical: 'top' }]}
        />
      </Field>
      <Field label="Photos">
        <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} max={limits.photos} />
      </Field>
      {limits.video ? (
        <Field label="Video (optional)">
          <ComposerVideo video={video} onChange={setVideo} onError={setError} />
        </Field>
      ) : null}
      <BuildChooser builds={mine} value={buildId} onChange={setBuildId} />
      <View style={{ gap: SPACING.sm }}>
        {error ? <ErrorState title={error} /> : null}
        {sellingHint(`${title} ${body}`, board) ? <DsText v="caption" tone="warning">{SELLING_HINT}</DsText> : null}
        <DsText v="caption">
          {listing ? 'Nightshift never handles payments. Collecting: meet somewhere public and pay in person. Posting: use a payment with buyer protection. ' : ''}
          No street racing, no timing on public roads and nothing about where police are.
        </DsText>
      </View>
    </ScrollView>
      <ActionBar primary={{ label: listing ? 'Post listing' : 'Post thread', onPress: () => void submit(), busy, haptic: 'success' }} />
      {guard.sheet}
    </View>
  );
}
