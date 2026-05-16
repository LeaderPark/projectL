# OP Score Personal Performance Design

**Context:** The current `performanceScore` calculation in `scripts/Riot/MatchTransformer.js` separates players mostly by match result. Winners keep a positive raw score, while losers are converted into a compressed negative score. This makes all winners look generally high and all losers generally low, even when individual play does not match that outcome.

## Recommended Approach

Make OP score primarily reflect individual performance and keep match result as only a small modifier.

### Why this is the right split

- A losing-team ACE should be able to score above a low-impact winner.
- A winning-team player who underperformed should not be protected by the team result.
- The existing score inputs already cover individual contribution: KDA, damage per minute, vision per minute, and death pressure.
- Keeping a small result modifier preserves some reward for winning without forcing separate winner/loser score bands.

## Alternatives Considered

### 1. Pure individual score

This is the cleanest individual-performance signal, but it removes all match-result influence from a score users may expect to loosely reward winning.

### 2. Recommended: Individual score with a small result modifier

This keeps the existing raw contribution model, removes the negative loser conversion, and applies only a modest win/loss adjustment.

### 3. Team-relative score adjustment

This would compare each player against their own team average. It can increase within-team spread, but it makes the score harder to explain and risks overfitting one match's team context.

## Design

`calculatePerformanceScore` will continue to compute a raw individual score from the existing normalized inputs. Instead of returning the raw score for winners and a negative compressed value for losers, it will return the raw score plus a small result modifier.

The public site's `formatOpScore` conversion remains unchanged, so no UI layout or stored-data migration is required. New match uploads and replay parses will start storing the adjusted `performanceScore`. Existing stored matches keep their historical scores.

## Testing

Add focused tests around `calculatePerformanceScore` proving:

- a strong losing player can outscore a weak winning player
- a weak winning player can remain below a strong losing player after the result modifier

Run the targeted match transformer tests and then the full Node test suite.
