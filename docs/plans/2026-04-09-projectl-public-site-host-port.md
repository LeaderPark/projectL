# ProjectL Public Site Host Port Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose the bot-hosted public record site to the Windows host on a configurable non-conflicting port.

**Architecture:** Docker Compose will publish the bot container's existing internal web port to a configurable host port, defaulting to `8000`. The environment template, tests, and README will be updated together so the operator path stays obvious and repeatable.

**Tech Stack:** Docker Compose, environment variables, Markdown, Node.js, node:test

---

### Task 1: Compose contract test

**Files:**
- Modify: `tests/compose-assets.test.js`
- Test: `tests/compose-assets.test.js`

**Step 1: Write the failing test**

```js
test("compose file publishes the bot web port to a configurable host port", () => {
  const compose = fs.readFileSync("compose.yaml", "utf8");
  assert.match(compose, /WEB_PUBLIC_PORT:-8000/);
  assert.match(compose, /3000/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/compose-assets.test.js`
Expected: FAIL because the bot service does not publish its web port yet.

**Step 3: Write minimal implementation**

```yaml
ports:
  - "${WEB_PUBLIC_PORT:-8000}:3000"
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/compose-assets.test.js`
Expected: PASS

### Task 2: Operator configuration defaults

**Files:**
- Modify: `.env.example`

**Step 1: Write the failing test**

```js
test(".env.example documents the host web port", () => {
  const envExample = fs.readFileSync(".env.example", "utf8");
  assert.match(envExample, /^WEB_PUBLIC_PORT=8000$/m);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/compose-assets.test.js`
Expected: FAIL because the host web port variable is not documented yet.

**Step 3: Write minimal implementation**

```dotenv
WEB_PUBLIC_PORT=8000
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/compose-assets.test.js`
Expected: PASS

### Task 3: Access documentation

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

```js
test("README documents the public site host URL", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  assert.match(readme, /http:\/\/localhost:8000\//);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/compose-assets.test.js`
Expected: FAIL because the README does not mention the public site URL yet.

**Step 3: Write minimal implementation**

```md
The public record site is available at `http://localhost:8000/` by default.
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/compose-assets.test.js`
Expected: PASS
