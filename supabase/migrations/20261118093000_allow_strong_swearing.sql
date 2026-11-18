-- Owner decision (18 Nov 2026): 18+ app, keep it loose. Swearing of any strength is
-- fine in public posts; only slurs and sexual insults stay blocked. Abuse aimed at
-- a person is handled by reports. Mirrors BANNED_TERMS in src/lib/moderation.ts.
delete from private.banned_terms where term in ('cunt', 'cunts');
