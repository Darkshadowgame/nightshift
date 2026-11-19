import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { pickVideo } from '../lib/videoPick';
import { clipLength, clipSize, NO_PLATES, type VideoDraft, type VideoRef } from '../lib/videoRules';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, DsText, Icon, Press, Tag } from './ds';

/** The "No readable number plates in this video (I've checked)" tick: required before a video is shared. */
export function NoPlatesTick({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <Press
      onPress={() => onChange(!on)}
      haptic="select"
      role="checkbox"
      state={{ checked: on }}
      label={NO_PLATES}
      hint="Plates can't be blurred in a video. Required before you share it."
      hitSlop={8}
      style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', minHeight: 44 }}
    >
      <View style={[st.box, on && st.boxOn]}>{on ? <Icon name="check" size={16} colour={COLOR.text.onAction} /> : null}</View>
      <DsText v="secondary" style={{ flex: 1 }}>
        {NO_PLATES}
      </DsText>
    </Press>
  );
}

/**
 * One video for a post, thread, reply or message: Add a video (library or camera), then its cover,
 * length and size, the plate tick, and Remove. Number plates can't be blurred in a video, so the
 * tick is required; anyone can report it as "Shows a number plate".
 */
export function ComposerVideo({ video, onChange, onError }: { video: VideoDraft | null; onChange: (v: VideoDraft | null) => void; onError: (m: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (camera: boolean) => {
    onError(null);
    setBusy(true);
    try {
      const got = await pickVideo(camera);
      if (!got) return;
      if ('problem' in got) return onError(got.problem);
      onChange(got.draft);
    } catch {
      onError("Couldn't open that video. Try another one.");
    } finally {
      setBusy(false);
    }
  };
  if (!video) {
    return (
      <View style={{ gap: SPACING.sm }}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <Button label="Film" icon="camera" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => void pick(true)} busy={busy} />
          <Button label="Video library" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => void pick(false)} busy={busy} />
        </View>
        <DsText v="caption">One clip, up to 30 seconds and 25 MB. Plates can’t be blurred in video, so only share one with no readable number plates.</DsText>
      </View>
    );
  }
  return (
    <View style={{ gap: SPACING.sm }}>
      <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center' }}>
        <View>
          <Image source={{ uri: video.poster }} style={{ width: 96, height: 96, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel="Cover of the video to post" />
          <View style={st.play} pointerEvents="none">
            <Icon name="play" size={20} colour={COLOR.text.primary} />
          </View>
        </View>
        <View style={{ flex: 1, gap: SPACING.xxs }}>
          <DsText v="bodyStrong">Video, {clipLength(video.seconds)}</DsText>
          <DsText v="meta">{clipSize(video.bytes)}</DsText>
        </View>
        <Button label="Remove" tier="tertiary" size="sm" onPress={() => onChange(null)} accessibilityLabel="Remove the video" />
      </View>
      <NoPlatesTick on={video.noPlates} onChange={(on) => onChange({ ...video, noPlates: on })} />
    </View>
  );
}

function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />;
}

/** A video on a post, thread, reply or message: its cover with ▶ until tapped, then it plays here (full screen from the controls). */
export function VideoBox({ video, aspect = 16 / 9, width, rounded }: { video: VideoRef; aspect?: number; width?: number; rounded?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <View style={{ width: width ?? '100%', aspectRatio: aspect, backgroundColor: COLOR.surface.media, overflow: 'hidden', borderRadius: rounded ? RADII.card : 0 }}>
      {playing ? (
        <Player url={video.url} />
      ) : (
        <Press onPress={() => setPlaying(true)} feedback="card" label="Play the video" style={StyleSheet.absoluteFill}>
          <Image source={{ uri: video.poster }} resizeMode="cover" style={StyleSheet.absoluteFill} />
          <View style={[st.play, { width: 56, height: 56, marginLeft: -28, marginTop: -28 }]} pointerEvents="none">
            <Icon name="play" size={28} colour={COLOR.text.primary} />
          </View>
          <View style={{ position: 'absolute', left: SPACING.sm, bottom: SPACING.sm }} pointerEvents="none">
            <Tag label="Video" />
          </View>
        </Press>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  box: { width: 24, height: 24, borderRadius: RADII.tag, borderWidth: 2, borderColor: COLOR.text.secondary, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: COLOR.text.primary, backgroundColor: COLOR.text.primary },
  play: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: RADII.pill,
    backgroundColor: COLOR.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
