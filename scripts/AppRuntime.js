const fs = require("node:fs");
const path = require("node:path");
const { Events, Collection } = require("discord.js");

function loadCommands({
  client,
  commandsRoot = path.join(__dirname, "..", "commands"),
  logger = console,
}) {
  client.commands = new Collection();
  const commandFolders = fs.readdirSync(commandsRoot);

  for (const folder of commandFolders) {
    const commandsPath = path.join(commandsRoot, folder);
    logger.log(commandsPath);

    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        logger.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}

function registerInteractionHandler({ client, logger = console }) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "이 명령어는 서버 안에서만 사용할 수 있어요.",
        ephemeral: true,
      });
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  });
}

function createAppServices({
  client,
  runtimeConfig,
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
  assetsDir,
}) {
  const riotApi = createTournamentApi({
    token: runtimeConfig.riot.token,
    platform: runtimeConfig.riot.platform,
    region: runtimeConfig.riot.tournamentRegion,
    callbackUrl: runtimeConfig.riot.tournamentCallbackUrl,
    useStub: runtimeConfig.riot.tournamentUseStub,
  });

  const sessionStore = createDatabaseSessionStore();
  const resultService = createTournamentResultService({
    riotApi,
    transformMatchPayload,
  });
  const poller = createSessionPoller({
    sessionStore,
    riotApi,
    moveService: createGuildMoveService(client),
    resultService,
    intervalMs: runtimeConfig.riot.tournamentPollIntervalMs,
  });
  const publicSiteHandlers = createPublicSiteHandlers({
    preferredGuildId: runtimeConfig.web.publicGuildId,
  });
  const callbackServer = createCallbackServer({
    callbackPath: runtimeConfig.web.riotTournamentCallbackPath,
    sessionStore,
    publicSiteRouter: createPublicSiteRouter({
      assetsDir,
      ...publicSiteHandlers,
      renderNotFoundPage,
    }),
  });

  return {
    poller,
    callbackServer,
  };
}

async function startAppRuntime({
  client,
  callbackServer,
  poller,
  runtimeConfig,
  buildBotPresenceActivity,
  logger = console,
}) {
  client.callbackServer = callbackServer;
  client.tournamentSessionPoller = poller;

  client.once(Events.ClientReady, (value) => {
    logger.log(`Ready! Logged in as ${value.user.tag}`);
    client.user?.setActivity(buildBotPresenceActivity());
    poller.start();
    poller.tick().catch((error) => {
      logger.error("Initial tournament session poll failed:", error);
    });
  });

  callbackServer.listen(runtimeConfig.web.port, () => {
    logger.log(
      `Callback server listening on port ${runtimeConfig.web.port}${runtimeConfig.web.riotTournamentCallbackPath}`
    );
  });

  return client.login(runtimeConfig.discord.token);
}

function bootstrapApp({
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
  assetsDir,
  logger = console,
  commandsRoot,
}) {
  loadCommands({
    client,
    commandsRoot,
    logger,
  });
  registerInteractionHandler({ client, logger });

  const services = createAppServices({
    client,
    runtimeConfig,
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
    assetsDir,
  });

  return startAppRuntime({
    client,
    runtimeConfig,
    buildBotPresenceActivity,
    logger,
    ...services,
  });
}

module.exports = {
  bootstrapApp,
  createAppServices,
  loadCommands,
  registerInteractionHandler,
  startAppRuntime,
};
