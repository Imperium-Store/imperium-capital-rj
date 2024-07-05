const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const config = require(path.join(__dirname, "..", "Config.json"));

module.exports = {
  commandBase: {
    slashData: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("[STAFF] Mostra o ping atual do bot"),
    allowedRoles: config.useCommandRoles,
    async execute(interaction) {
      interaction.reply({
        content: `O ping atual do bot é: **${~~interaction.client.ws.ping}**`,
        ephemeral: true
      });
    },
  },
};
