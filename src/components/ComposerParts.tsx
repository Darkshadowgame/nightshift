import { useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TextInput, View, type TextStyle } from 'react-native';
import { photoUri, plateRedactorAvailable } from '../lib/photos';
import type { Build } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { ActionBar, Button, ChoiceGroup, ConfirmSheet, DsText, FitImage, Icon, Press, typeStyle } from './ds';
import { usePhotoFlow } from './PhotoFlow';

/** The text box style for composers (posts, threads, replies, chats): input type, strong border, control radius. */
export const INPUT: TextStyle = {
  ...typeStyle('input'),
  minHeight: 48,
  borderWidth: 1,
  borderColor: COLOR.surface.borderStrong,
  borderRadius: RADII.control,
  backgroundColor: COLOR.surface.card,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
};

/** A form field: caps label above, the control, an optional hint below. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <DsText v="label">{label}</DsText>
      {children}
      {hint ? <DsText v="caption">{hint}</DsText> : null}
    </View>
  );
}

/**
 * Photos for a post, thread, reply or message: every one goes through the same
 * pick → crop → plate check → saved-without-metadata flow as build photos.
 */
export function ComposerPhotos({ photos, onChange, onError, max = 4 }: { photos: string[]; onChange: (p: string[]) => void; onError: (m: string | null) => void; max?: number }) {
  const flow = usePhotoFlow({ onError, onPhoto: (ref, replaces) => onChange(replaces ? photos.map((p) => (p === replaces ? ref : p)) : [...photos, ref].slice(0, max)) });
  if (flow.view) return <>{flow.view}</>;
  return (
    <View style={{ gap: SPACING.sm }}>
      {photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {photos.map((p) => (
            <View key={p}>
              <FitImage source={photoUri(p)} frameAspect={1} style={{ width: 84, height: 84, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel="Photo to post" />
              <Press
                onPress={() => onChange(photos.filter((x) => x !== p))}
                label="Remove this photo"
                hitSlop={8}
                style={{ position: 'absolute', right: -SPACING.sm, top: -SPACING.sm, width: 28, height: 28, borderRadius: RADII.pill, backgroundColor: COLOR.surface.bg, borderWidth: 1, borderColor: COLOR.surface.borderStrong, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="close" size={14} colour={COLOR.text.primary} />
              </Press>
            </View>
          ))}
        </View>
      ) : null}
      {photos.length < max ? (
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <Button label="Camera" icon="camera" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => flow.pick(true)} disabled={flow.busy} />
          <Button label="Library" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => flow.pick(false)} disabled={flow.busy} />
        </View>
      ) : null}
      <DsText v="caption">
        {plateRedactorAvailable ? 'Number plates are found and blurred before anything is shared; check the boxes when asked.' : 'Photos are saved without location data.'} Up to {max}.
      </DsText>
    </View>
  );
}

/** Link one of your builds (or none): one of many, so a radio list. */
export function BuildChooser({ builds, value, onChange, label = 'Link a build' }: { builds: Build[]; value?: string; onChange: (id: string | undefined) => void; label?: string }) {
  if (!builds.length) return <DsText v="caption">Add a car or bike in your garage to link it.</DsText>;
  return (
    <ChoiceGroup<string>
      label={label}
      layout="pills"
      value={value ?? 'none'}
      onChange={(k) => onChange(k === 'none' ? undefined : k)}
      options={[{ key: 'none', label: 'None' }, ...builds.map((b) => ({ key: b.id, label: `${b.make} ${b.model}` }))]}
    />
  );
}

/**
 * The comment or reply field of a post or thread page (Redesign 2, 3.7): it lives in the
 * ActionBar, so it's always in reach. Send is never disabled: an empty send says what to do
 * under the page instead.
 */
export function CommentBar({
  value,
  onChange,
  onSend,
  busy,
  placeholder,
  label,
  maxLength,
  extra,
}: {
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  busy?: boolean;
  placeholder: string;
  label: string;
  maxLength: number;
  /** Above the field: photos or a build to attach. */
  extra?: ReactNode;
}) {
  return (
    <ActionBar>
      {extra}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLOR.text.secondary}
          multiline
          maxLength={maxLength}
          accessibilityLabel={label}
          style={[INPUT, { flex: 1, maxHeight: 120 }]}
        />
        <Button label="Send" size="md" haptic="success" busy={busy} onPress={onSend} />
      </View>
    </ActionBar>
  );
}

/**
 * Back from a form with changes asks first (Redesign 2, 4.2): "Discard it" / "Keep editing".
 * Returns the sheet to render and `leave(go)`: leave on purpose (after posting), with the guard off.
 */
export function useDiscardGuard(dirty: boolean, what = 'this'): { sheet: ReactNode; leave: (go: () => void) => void } {
  const navigation = useNavigation();
  const then = useRef<(() => void) | null>(null);
  const [pending, setPending] = useState<{ type: string } | null>(null);
  const [exit, setExit] = useState<{ action: { type: string } | null } | null>(null);
  // Dispatching from inside the guard would be stopped again: the guard turns off first (exit), then the effect goes.
  usePreventRemove(dirty && !exit, ({ data }) => setPending(data.action));
  useEffect(() => {
    if (!exit) return;
    if (exit.action) navigation.dispatch(exit.action as never);
    else if (then.current) {
      const go = then.current;
      then.current = null;
      go();
    }
  }, [exit, navigation]);
  const sheet = (
    <ConfirmSheet
      visible={!!pending}
      title={`Discard ${what}?`}
      message="What you've written so far will be lost."
      verb="Discard"
      cancelLabel="Keep editing"
      onConfirm={() => {
        const action = pending;
        setPending(null);
        setExit({ action });
      }}
      onCancel={() => setPending(null)}
    />
  );
  return {
    sheet,
    leave: (go) => {
      then.current = go;
      setExit({ action: null });
    },
  };
}
