import { messageProblem, previewLine } from '../src/lib/messages';
import { REPORT_REASONS } from '../src/lib/moderation';
import { postProblem } from '../src/lib/posts';
import { clipLength, clipSize, extensionFor, NO_PLATES, pickedVideoProblem, VIDEO_LIMITS, videoMime, videoProblem, type VideoDraft } from '../src/lib/videoRules';

const clip = (o: Partial<VideoDraft> = {}): VideoDraft => ({ uri: 'file:///c.mp4', poster: 'file:///c.jpg', seconds: 20, bytes: 12 * 1024 * 1024, mime: 'video/mp4', noPlates: true, ...o });

describe('video (20261121110100_videos.sql)', () => {
  it('30 seconds and 25 MB at most', () => {
    expect(VIDEO_LIMITS).toEqual({ seconds: 30, bytes: 25 * 1024 * 1024 });
    expect(pickedVideoProblem({ seconds: 30, bytes: 25 * 1024 * 1024 })).toBeNull();
    expect(pickedVideoProblem({ seconds: 31, bytes: 1 })).toBe('Videos can be up to 30 seconds. Trim it first.');
    expect(pickedVideoProblem({ seconds: 10, bytes: 25 * 1024 * 1024 + 1 })).toBe('That video is over 25 MB. Try a shorter clip.');
  });

  it('needs the plate tick before it is sent', () => {
    expect(NO_PLATES).toBe('No readable number plates in this video (I’ve checked)');
    expect(videoProblem(clip({ noPlates: false }))).toBe('Check the video has no readable number plates, then tick the box.');
    expect(videoProblem(clip())).toBeNull();
    expect(videoProblem(null)).toBeNull();
    expect(postProblem({ body: '', photos: [], video: clip({ noPlates: false }), visibility: 'public' }, null)).toBe(
      'Check the video has no readable number plates, then tick the box.',
    );
    expect(messageProblem('', undefined, undefined, clip({ noPlates: false }))).toBe('Check the video has no readable number plates, then tick the box.');
  });

  it('a video on its own is enough for a post or a message', () => {
    expect(postProblem({ body: '', photos: [], video: clip(), visibility: 'public' }, null)).toBeNull();
    expect(messageProblem('', undefined, undefined, clip())).toBeNull();
    expect(messageProblem('', undefined, undefined, null)).toBe('Write a message first.');
  });

  it('MP4 or MOV, and labels', () => {
    expect(videoMime('video/quicktime', 'x')).toBe('video/quicktime');
    expect(videoMime(null, 'file:///IMG_1.MOV')).toBe('video/quicktime');
    expect(videoMime(undefined, 'file:///a.mp4')).toBe('video/mp4');
    expect(extensionFor('video/quicktime')).toBe('mov');
    expect(extensionFor('video/mp4')).toBe('mp4');
    expect(clipLength(27.4)).toBe('0:27');
    expect(clipSize(18.4 * 1024 * 1024)).toBe('18.4 MB');
  });

  it('can be reported as showing a number plate', () => {
    expect(REPORT_REASONS.find((r) => r.key === 'number_plate')?.label).toBe('Shows a number plate');
  });

  it('a chat whose last line is a video says so', () => {
    const c = { id: 'c', kind: 'direct', memberIds: ['me', 'b'], adminIds: [], lastMessageAt: '', unread: 0, last: { body: '', senderId: 'b', kind: 'text' } } as never;
    expect(previewLine(c, 'me', () => 'b')).toBe('Video');
  });
});
