const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { getRuntimeConfig } = require("./config/runtime");

const runtimeConfig = getRuntimeConfig();

const commands = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);
console.log(commandFolders);
for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(runtimeConfig.discord.token);

// and deploy your commands!
(async () => {
  try {
    const route = runtimeConfig.discord.guildId
      ? Routes.applicationGuildCommands(
          runtimeConfig.discord.clientId,
          runtimeConfig.discord.guildId
        )
      : Routes.applicationCommands(runtimeConfig.discord.clientId);

    console.log(
      `Started refreshing ${commands.length} application (/) commands (${runtimeConfig.discord.guildId ? "guild" : "global"} scope).`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(route, { body: commands });

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
