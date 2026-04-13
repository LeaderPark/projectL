const path = require("node:path");
const { getRuntimeConfig } = require("./config/runtime");
const client = require("./scripts/Utils/Client");
const { buildBotPresenceActivity } = require("./scripts/Discord/BotPresence");
const { createTournamentApi } = require("./scripts/Riot/TournamentApi");
const { transformMatchPayload } = require("./scripts/Riot/MatchTransformer");
const {
  createDatabaseSessionStore,
  createGuildMoveService,
  createSessionPoller,
} = require("./scripts/Tournament/SessionPoller");
const {
  createTournamentResultService,
} = require("./scripts/Tournament/TournamentResultService");
const { createCallbackServer } = require("./scripts/Web/CallbackServer");
const { createPublicSiteHandlers } = require("./scripts/Web/PublicSite");
const { createPublicSiteRouter } = require("./scripts/Web/PublicSiteRouter");
const { renderNotFoundPage } = require("./scripts/Web/views/NotFoundPage");
const { bootstrapApp } = require("./scripts/AppRuntime");

const runtimeConfig = getRuntimeConfig();

bootstrapApp({
  client,
  runtimeConfig,
  buildBotPresenceActivity,
  createTournamentApi,
  transformMatchPayload,
  createDatabaseSessionStore,
  createGuildMoveService,
  createSessionPoller,
  createTournamentResultService,
  createCallbackServer,
  createPublicSiteHandlers,
  createPublicSiteRouter,
  renderNotFoundPage,
  assetsDir: path.join(__dirname, "public"),
});

