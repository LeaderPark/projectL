const test = require("node:test");
const assert = require("node:assert/strict");

function withEnv(overrides, fn) {
  const original = {};

  for (const [key, value] of Object.entries(overrides)) {
    original[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function loadDeploymentInfoModule() {
  const modulePath = require.resolve("../scripts/Utils/DeploymentInfo");
  delete require.cache[modulePath];
  return require(modulePath);
}

test("readDeploymentInfo returns commit, summary, and deployed time from env", () =>
  withEnv(
    {
      BOT_DEPLOY_COMMIT: "31b02cc",
      BOT_DEPLOY_MESSAGE: "원클릭 배포 도구 추가",
      BOT_DEPLOYED_AT: "2026-04-09T10:57:00.000Z",
    },
    () => {
      const { readDeploymentInfo } = loadDeploymentInfoModule();

      assert.deepEqual(readDeploymentInfo(), {
        version: "1.0.0",
        commit: "31b02cc",
        message: "원클릭 배포 도구 추가",
        deployedAt: "2026-04-09T10:57:00.000Z",
      });
    }
  ));

test("formatDeploymentInfoMessage includes deploy metadata in Korean", () => {
  const { formatDeploymentInfoMessage } = loadDeploymentInfoModule();

  const message = formatDeploymentInfoMessage({
    version: "1.0.0",
    commit: "31b02cc",
    message: "원클릭 배포 도구 추가",
    deployedAt: "2026-04-09T10:57:00.000Z",
  });

  assert.match(message, /머글들의 피난처 내전 봇/);
  assert.match(message, /1\.0\.0/);
  assert.match(message, /31b02cc/);
  assert.match(message, /원클릭 배포 도구 추가/);
  assert.match(message, /2026/);
});

test("formatDeploymentInfoMessage falls back when deployment metadata is missing", () => {
  const { formatDeploymentInfoMessage } = loadDeploymentInfoModule();

  const message = formatDeploymentInfoMessage({
    version: "1.0.0",
    commit: "",
    message: "",
    deployedAt: "",
  });

  assert.match(message, /1\.0\.0/);
  assert.match(message, /배포 정보/);
});
