import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { COLOR, RADII, SPACING } from '../../theme';
import { Pin } from '../Pin';
import { Button } from './Button';
import type { Leading } from './ListRow';
import { entityA11yLabel, type EntityKind } from './logic';
import { Avatar, ClassBadge, Tag, type Photo, type TagTone } from './Marks';
import { Press } from './Press';
import { DsText } from './Text';

export type EntityTag = { label: string; tone?: TagTone; raw?: boolean };

const KIND_LABEL: Record<EntityKind, string> = { person: 'Person', build: 'Build', event: 'Event', place: 'Place' };

/**
 * @deprecated on browse surfaces: Redesign 2 replaces it with `PhotoCard` (photo first). Kept for
 * screens that haven't moved yet. `sample` no longer draws a tag (Sample tags are cut).
 *
 * One anatomy for a person, a build, an event and a place on a browse surface (Events, Find,
 * the map sheet, People, a crew). Top to bottom:
 *
 *   media (optional cover: a build or person photo, or a map)
 *   mark · KIND EYEBROW · [Sample] · ........ [one status tag]
 *   Title, as typed (2 lines)
 *   meta: one line of facts, mono
 *   detail: one muted line
 *   chips: up to 3 tags
 *   action: one secondary button (never primary: a list has many cards)
 *
 * The accent bar is the layer colour, for events and places only. In a list, use ListRow instead.
 */
export function EntityCard({
  kind,
  title,
  eyebrow,
  layerColour,
  mark,
  media,
  mediaPhoto,
  status,
  sample,
  meta,
  detail,
  chips,
  action,
  onPress,
  finished,
  accessibilityHint,
}: {
  kind: EntityKind;
  title: string;
  /** The kind in words: "Rolling meet", "Drive", "Build", "Person". Defaults to the kind. */
  eyebrow?: string;
  /** Events and places: their layer colour (eyebrow, accent bar and pin). Ignored for people and builds. */
  layerColour?: string;
  /** Leading mark. Person → avatar, build → class badge, event/place → pin. */
  mark?: Leading;
  /** A cover (map snapshot, BuildArt). Or pass `mediaPhoto` for a photo. */
  media?: ReactNode;
  mediaPhoto?: Photo | null;
  /** One state: Going, Hosting, Live, Waiting. */
  status?: EntityTag;
  sample?: boolean;
  meta?: string;
  detail?: string;
  chips?: EntityTag[];
  action?: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean; hint?: string };
  onPress?: () => void;
  /** Past or cancelled: quieter surface and a dashed border, never lower opacity. */
  finished?: boolean;
  accessibilityHint?: string;
}) {
  const placeLike = kind === 'event' || kind === 'place';
  const accent = placeLike && layerColour && !finished ? layerColour : undefined;
  const eyebrowColour = placeLike && layerColour ? layerColour : COLOR.text.secondary;
  const label = entityA11yLabel({
    eyebrow: eyebrow ?? KIND_LABEL[kind],
    title,
    meta,
    detail,
    tags: [status?.label, ...(chips ?? []).map((c) => c.label)].filter((x): x is string => !!x),
  });

  const content = (
    <>
      {media || mediaPhoto ? (
        <View style={{ height: 150, backgroundColor: COLOR.surface.media, overflow: 'hidden', borderTopLeftRadius: RADII.card, borderTopRightRadius: RADII.card }}>
          {mediaPhoto ? <Image source={typeof mediaPhoto === 'string' ? { uri: mediaPhoto } : mediaPhoto} style={{ flex: 1 }} resizeMode="cover" accessibilityIgnoresInvertColors /> : media}
        </View>
      ) : null}
      <View style={{ padding: SPACING.md, gap: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {mark ? <Mark mark={mark} /> : null}
          <DsText v="eyebrow" numberOfLines={1} style={{ color: eyebrowColour, flexShrink: 1 }}>
            {eyebrow ?? KIND_LABEL[kind]}
          </DsText>
          <View style={{ flex: 1 }} />
          {status ? <Tag label={status.label} tone={status.tone} raw={status.raw} /> : null}
        </View>
        <DsText v="title" numberOfLines={2}>
          {title}
        </DsText>
        {meta ? (
          <DsText v="meta" numberOfLines={2}>
            {meta}
          </DsText>
        ) : null}
        {detail ? (
          <DsText v="secondary" numberOfLines={2}>
            {detail}
          </DsText>
        ) : null}
        {chips && chips.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs }}>
            {chips.slice(0, 3).map((c) => (
              <Tag key={c.label} label={c.label} tone={c.tone} raw={c.raw} />
            ))}
          </View>
        ) : null}
      </View>
    </>
  );

  const frame = {
    backgroundColor: finished ? COLOR.surface.bg : COLOR.surface.card,
    borderColor: COLOR.surface.border,
    borderStyle: finished ? ('dashed' as const) : ('solid' as const),
    borderWidth: 1,
    borderLeftWidth: accent ? 3 : 1,
    borderLeftColor: accent ?? COLOR.surface.border,
    borderRadius: RADII.card,
    overflow: 'hidden' as const,
  };

  // A tappable card without its own button presses as one piece (dims and shrinks a touch).
  if (onPress && !action) {
    return (
      <Press onPress={onPress} feedback="card" label={label} hint={accessibilityHint} style={frame}>
        {content}
      </Press>
    );
  }
  return (
    <View style={frame}>
      {onPress ? (
        <Press onPress={onPress} label={label} hint={accessibilityHint}>
          {content}
        </Press>
      ) : (
        <View accessible accessibilityLabel={label}>
          {content}
        </View>
      )}
      {action ? (
        // Outside the pressable body so a screen reader reaches it as its own button.
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
          <Button label={action.label} onPress={action.onPress} tier="secondary" size="sm" block busy={action.busy} disabled={action.disabled} hint={action.hint} />
        </View>
      ) : null}
    </View>
  );
}

function Mark({ mark }: { mark: Leading }) {
  if ('avatar' in mark) return <Avatar {...mark.avatar} size="sm" />;
  if ('classBadge' in mark) return <ClassBadge letter={mark.classBadge} size="sm" decorative />;
  if ('pin' in mark)
    return (
      <View aria-hidden>
        <Pin glyph={mark.pin} colour={mark.colour} size={24} />
      </View>
    );
  return null;
}
