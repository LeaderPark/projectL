const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createEventTarget(initialState = {}) {
  const listeners = new Map();

  return {
    ...initialState,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    async dispatch(type, event = {}) {
      const handler = listeners.get(type);
      if (!handler) {
        return undefined;
      }

      return handler(event);
    },
  };
}

function loadPublicSiteScript({ fetchImpl }) {
  const form = createEventTarget({
    dataset: {
      serverIdCheckEndpoint: "/api/server-validation",
    },
  });
  const input = createEventTarget({
    value: "",
    focused: false,
    focus() {
      this.focused = true;
    },
  });
  const error = createEventTarget({
    hidden: true,
  });
  const alerts = [];
  const location = { href: "/" };

  const document = {
    querySelector(selector) {
      switch (selector) {
        case "[data-server-id-form]":
          return form;
        case "[data-server-id-input]":
          return input;
        case "[data-server-id-error]":
          return error;
        default:
          return null;
      }
    },
    querySelectorAll() {
      return [];
    },
  };

  const context = {
    document,
    window: {
      location,
      alert(message) {
        alerts.push(message);
      },
      setTimeout(callback) {
        callback();
      },
    },
    fetch: fetchImpl,
    encodeURIComponent,
    console,
  };

  vm.runInNewContext(fs.readFileSync("public/site.js", "utf8"), context, {
    filename: "public/site.js",
  });

  return {
    alerts,
    error,
    form,
    input,
    location,
  };
}

test("landing-page script redirects only after confirming the server id is registered", async () => {
  const seenUrls = [];
  const { form, input, location } = loadPublicSiteScript({
    fetchImpl: async (url) => {
      seenUrls.push(url);
      return {
        ok: true,
        async json() {
          return { registered: true };
        },
      };
    },
  });
  input.value = "123456789";

  let prevented = false;
  await form.dispatch("submit", {
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.deepEqual(seenUrls, ["/api/server-validation?serverId=123456789"]);
  assert.equal(location.href, "/123456789");
});

test("landing-page script alerts and stays put when the server id is not registered", async () => {
  const seenUrls = [];
  const { alerts, error, form, input, location } = loadPublicSiteScript({
    fetchImpl: async (url) => {
      seenUrls.push(url);
      return {
        ok: true,
        async json() {
          return { registered: false };
        },
      };
    },
  });
  input.value = "999999999";

  await form.dispatch("submit", {
    preventDefault() {},
  });

  assert.deepEqual(seenUrls, ["/api/server-validation?serverId=999999999"]);
  assert.deepEqual(alerts, ["등록되지 않은 서버 아이디입니다."]);
  assert.equal(location.href, "/");
  assert.equal(error.hidden, true);
  assert.equal(input.focused, true);
});
