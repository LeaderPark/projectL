# Replay Reupload Overwrite Design

## Goal

When the same replay is uploaded again, keep the existing match identity and user statistics intact while replacing the stored match detail with the newest parsed replay payload.

## Design

`persistMatchResult` will continue using the canonical Riot match id or replay base name as the duplicate key. If the `matches` row already exists, the ingestion flow will update only the match row fields (`game_length`, `played_at_kst`, `purple_team`, `blue_team`) and refresh `match_in_users` links from the newly parsed participants.

The duplicate path will not call the user-stat update routine. This prevents replay reuploads from applying MMR, win/loss, champion, lane, friend, or aggregate KDA changes a second time.

## Error Handling

The overwrite path still requires at least one linked registered participant before mutating data. If no participant can be linked by PUUID or Riot display name, it returns the existing no-registered-participants error and rolls back the transaction.

## Testing

Add a regression test to `tests/match-ingestion.test.js` proving that a duplicate match updates `matches`, deletes and recreates `match_in_users`, commits, and never issues an `UPDATE user SET mmr` query.
