const { PermissionFlagsBits } = require("discord.js");

function canManageGuild(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
  );
}

module.exports = {
  canManageGuild,
};
