const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const config = require(path.join(__dirname, "..", "Config.json"));

module.exports = {
	commandBase: {
		slashData: new SlashCommandBuilder()
			.setName("rmetas")
			.setDescription("[STAFF] monta um padrão de pesquisa de metas")
			.addStringOption((option) =>
				option
					.setName("channel")
					.setDescription("ID do canal desejado.")
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("role")
					.setDescription("ID do cargo desejado")
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("data")
					.setDescription("Data de início (AAAA-MM-DD)")
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("mention")
					.setDescription("0 para 'de' // 1 para 'menciona'")
					.setRequired(true)
			),
		// .addStringOption((option) =>
		// 	option
		// 		.setName("finishdate")
		// 		.setDescription("Data de término (AAAA-MM-DD)")
		// 		.setRequired(true)
		// ),
		allowedRoles: config.allowedRoles,
		allowedUsers: config.allowedUsers,
		async execute(interaction) {
			const role = interaction.options.getString("role");
			const channel = interaction.options.getString("channel");
			const date = interaction.options.getString("data");
			const ismention = interaction.options.getString("mention");
			const searchUserToRole = (await interaction.guild.roles.cache.get(role))
				.members;
			const channelSelected = await interaction.guild.channels.cache.get(
				channel
			);

			const createModelMsg = ({ channelname, userid, ismention, date }) => {
				if (!ismention) {
					return `${"```"} em:#${channelname} de: ${userid} depois: ${date} ${"```"}`;
				}

				return `${"```"} em:#${channelname} menciona: ${userid} depois: ${date} ${"```"}`;
			};

			const msgCopy = searchUserToRole.map((data) =>
				createModelMsg({
					channelname: channelSelected.name,
					userid: data.user.id,
					ismention: ismention == "0" ? false : true,
					date: date,
				})
			);

			// searchUserToRole.members;
			// createModelMsg({
			// 	channelname: channelSelected.name,
			// 	userid: "579769867289362452",
			// 	ismention: true,
			// 	date: date,
			// })

			console.log(
				
			);

			await interaction.reply({
				content: `
				## USUÁRIOS COM CARGO <@&${role}>
				${searchUserToRole.map((data) => `\n<@${data.user.id}>`).join("\n")}
				
				\n## ID USUÁRIOS COM CARGO <@&${role}>
				${searchUserToRole
					.map((data) => `${"```"} ${data.user.id} ${"```"}`)
					.join("\n")}

				\n## BASE PARA PESQUISA DE METAS <@&${role}>
				${msgCopy.join("\n")}
				`,
				ephemeral: true,
			});
		},
	},
};
