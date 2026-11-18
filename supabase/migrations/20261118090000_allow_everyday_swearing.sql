-- Owner decision (18 Nov 2026): everyday swearing is fine in public posts
-- ("my turbo's fucked"). Slurs, the c-word and sexual insults stay blocked.
-- Mirrors BANNED_TERMS in src/lib/moderation.ts.
delete from private.banned_terms
where term in ('fuck', 'fucks', 'fucking', 'fucked', 'fucker', 'fuckers', 'motherfucker', 'motherfuckers');
