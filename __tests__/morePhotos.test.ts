import { commentFromRow } from '../src/lib/backend/community';
import { LIMITS, threadProblem } from '../src/lib/forum';
import { isMissingColumn, MEDIA_LIMITS, OLD_MEDIA_LIMITS, photoLimitProblem } from '../src/lib/mediaLimits';
import { commentProblem, POST_LIMITS, postProblem } from '../src/lib/posts';

const photos = (n: number) => Array.from({ length: n }, (_, i) => `p${i}.jpg`);

describe('more photos (20261121100000_more_photos.sql)', () => {
  it('posts, threads and replies take 10, comments 4', () => {
    expect(POST_LIMITS.photos).toBe(10);
    expect(LIMITS.photos).toBe(10);
    expect(POST_LIMITS.commentPhotos).toBe(4);
    expect(MEDIA_LIMITS).toEqual({ photos: 10, commentPhotos: 4, chatPhotos: 10, video: true });
    expect(postProblem({ body: '', photos: photos(10), visibility: 'public' }, null)).toBeNull();
    expect(postProblem({ body: '', photos: photos(11), visibility: 'public' }, null)).toBe('Up to 10 photos a post.');
    expect(threadProblem({ board: 'advice', title: 'Help please', body: '', photos: photos(11) })).toBe('Up to 10 photos a post.');
  });

  it('a comment can be just photos, up to 4', () => {
    expect(commentProblem('', [])).toBe('Write a comment first.');
    expect(commentProblem('', photos(1))).toBeNull();
    expect(commentProblem('Look', photos(4))).toBeNull();
    expect(commentProblem('Look', photos(5))).toBe('Up to 4 photos a comment.');
  });

  it('keeps to the old limits until the server has the migration', () => {
    expect(OLD_MEDIA_LIMITS.photos).toBe(4);
    expect(OLD_MEDIA_LIMITS.commentPhotos).toBe(0);
    expect(photoLimitProblem(5, OLD_MEDIA_LIMITS.photos, 'post')).toBe('Up to 4 photos a post.');
    expect(photoLimitProblem(4, OLD_MEDIA_LIMITS.photos, 'post')).toBeNull();
    expect(photoLimitProblem(1, OLD_MEDIA_LIMITS.commentPhotos, 'comment')).toBe('Comments can’t have photos yet.');
    expect(photoLimitProblem(0, OLD_MEDIA_LIMITS.commentPhotos, 'comment')).toBeNull();
  });

  it('tells a missing column from other errors', () => {
    expect(isMissingColumn({ code: '42703', message: 'column post_comments.photos does not exist' })).toBe(true);
    expect(isMissingColumn({ message: 'column post_comments.photos does not exist' })).toBe(true);
    expect(isMissingColumn({ code: 'PGRST301', message: 'JWT expired' })).toBe(false);
    expect(isMissingColumn(null)).toBe(false);
  });

  it('reads comment photos as signed links, and none from an old server', () => {
    const row = { id: 'c', post_id: 'p', author_id: 'a', body: '', created_at: '2026-11-18T20:00:00Z', hidden_at: null };
    expect(commentFromRow({ ...row, photos: ['a/comments/1.jpg', 'a/comments/2.jpg'] }, (p) => (p.endsWith('2.jpg') ? '' : `https://x/${p}`)).photos).toEqual([
      'https://x/a/comments/1.jpg',
    ]);
    expect(commentFromRow(row).photos).toBeUndefined();
  });
});
