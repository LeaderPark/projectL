# `/정보` Deployment Sync Design

**Context:** The `/정보` command currently returns a hard-coded patch string from [`commands/components/infomation.js`](C:\projectL\commands\components\infomation.js), so it drifts out of date every time the bot is redeployed.

**Decision:** Use deployment metadata injected by the Windows deploy flow instead of editing the command text manually. `scripts/deploy.ps1` will capture the current Git commit, the latest commit subject, and the deployment timestamp, then pass those values into the bot container through `compose.yaml`. The `/정보` command will format that metadata at runtime with a safe fallback when the bot is started outside the deploy script.

**Recommended Approach:** Environment-backed deployment metadata.
- `scripts/deploy.ps1` sets `BOT_DEPLOY_COMMIT`, `BOT_DEPLOY_MESSAGE`, and `BOT_DEPLOYED_AT` after `git pull --ff-only`.
- `compose.yaml` forwards those variables into the `bot` service environment.
- A small utility module reads and formats the metadata for the `/정보` command.

**Alternative:** Generate and commit a build-info JSON file before each deploy.
- Rejected because it dirties the working tree or requires additional ignore/build-context rules.

**Error Handling:** If any deployment metadata is missing, `/정보` still replies successfully and explains that deployment info is not available yet.

**Testing:** Add tests for metadata parsing/formatting, `/정보` command output, and deploy/compose asset wiring.
