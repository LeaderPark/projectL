# ProjectL One-Click Deploy Design

**Context:** `projectL` already ships with Docker Compose, a local bootstrap script, and a verification script, but redeploying still requires a manual sequence of Git and Docker commands on the Windows host.

**Decision:** Add a one-click Windows deployment entrypoint made of a root-level `deploy.bat` launcher and a `scripts/deploy.ps1` orchestrator that updates the repository, restarts the Compose stack, verifies container state, and keeps the terminal window open until the operator provides input.

**Why this fits this project:**
- The project already standardizes on PowerShell helper scripts for operator tasks.
- Docker Compose is the current runtime boundary, so redeploying the stack is the right unit of automation.
- A batch launcher keeps the operator experience simple without introducing a separate packaging toolchain.

**Architecture:**
- `deploy.bat`: double-clickable launcher that moves to the repo root, invokes PowerShell with the deployment script, captures the exit code, prints a final status line, and waits for user input before closing the window.
- `scripts/deploy.ps1`: deployment orchestrator that validates the repo state, pulls the latest fast-forwardable commit, shuts down the current Compose stack, rebuilds and starts the stack, and checks container status before exiting.
- `package.json`: exposes a `deploy` script so the same flow can be started from a terminal.
- `README.md`: documents the new operator path and expected safety checks.

**Data flow:**
- The operator launches `deploy.bat`.
- The batch file starts `scripts/deploy.ps1` from the repository root.
- The PowerShell script checks for required tools and a clean worktree, runs `git pull --ff-only`, then executes `docker compose down` followed by `docker compose up -d --build`.
- After startup, the script queries `docker compose ps` and fails if any service is not `running` or `healthy` where applicable.
- Control returns to `deploy.bat`, which shows success or failure and waits for keyboard input before closing.

**Risk handling:**
- Refuse to deploy when the Git worktree is dirty so local edits are not overwritten by `pull`.
- Use `git pull --ff-only` so unexpected merge states fail loudly instead of mutating history.
- Keep `docker compose down` volume-safe so MariaDB data persists across redeploys.
- Surface deployment failures through a non-zero exit code and readable `[deploy]` log lines rather than silently continuing.
