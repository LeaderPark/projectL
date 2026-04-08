const fs = require("node:fs");
const path = require("node:path");
const { Events, Collection, ActivityType } = require("discord.js");
const { getRuntimeConfig } = require("./config/runtime");
const client = require("./scripts/Utils/Client");
const { createTournamentApi } = require("./scripts/Riot/TournamentApi");
const {
  createDatabaseSessionStore,
  createGuildMoveService,
  createSessionPoller,
} = require("./scripts/Tournament/SessionPoller");
const { createCallbackServer } = require("./scripts/Web/CallbackServer");

const runtimeConfig = getRuntimeConfig();

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  console.log(commandsPath);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

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
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
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

client.once(Events.ClientReady, (value) => {
  console.log(`Ready! Logged in as ${value.user.tag}`);
  client.user.setActivity({
    name: "롤 내전",
    type: ActivityType.Streaming,
    url: "https://www.youtube.com/watch?v=HuIHn2FU4Qw",
  });

  const riotApi = createTournamentApi({
    token: runtimeConfig.riot.token,
    platform: runtimeConfig.riot.platform,
    region: runtimeConfig.riot.tournamentRegion,
    callbackUrl: runtimeConfig.riot.tournamentCallbackUrl,
    useStub: runtimeConfig.riot.tournamentUseStub,
  });

  const sessionStore = createDatabaseSessionStore();
  const poller = createSessionPoller({
    sessionStore,
    riotApi,
    moveService: createGuildMoveService(client),
    intervalMs: runtimeConfig.riot.tournamentPollIntervalMs,
  });
  const callbackServer = createCallbackServer({
    callbackPath: runtimeConfig.web.riotTournamentCallbackPath,
    sessionStore,
  });

  client.tournamentSessionPoller = poller;
  client.callbackServer = callbackServer;
  poller.start();
  poller.tick().catch((error) => {
    console.error("Initial tournament session poll failed:", error);
  });
  callbackServer.listen(runtimeConfig.web.port, () => {
    console.log(
      `Callback server listening on port ${runtimeConfig.web.port}${runtimeConfig.web.riotTournamentCallbackPath}`
    );
  });
});

client.login(runtimeConfig.discord.token);

