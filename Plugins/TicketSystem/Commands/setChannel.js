const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const path = require("path");
const config = require(path.join(__dirname, "..", "Config.json"));

module.exports = {
    commandBase: {
        slashData: new SlashCommandBuilder()
            .setName("setticketchannel")
            .setDescription("Seta a sala padrão para abertura de tickets"),
        allowedRoles: config.allowedRoles,
        async execute(interaction) {
            const createTicketEmbed = () => {
                return new EmbedBuilder()
                    .setColor(0x1f1e22)
                    .setDescription("## Central de atendimento\nBem-vindo à nossa central de atendimento! Estamos aqui para ajudar você com suas dúvidas e solicitações.")
                    .addFields(
                        {
                            name: "Como ser atendido?",
                            value: "Selecione a categoria que melhor descreve sua solicitação e um atendente estará com você em breve.\n\u200B"
                        },
                        {
                            name: "Horário de Atendimento",
                            value: "**Segunda a Sexta:** 9h - 18h\n**Sábado:** 9h - 12h\n**Domingo e Feriados:** Fechado"
                        }
                    );
            };

            const createSelectMenu = () => {
                const options = Object.keys(config.select_options).map(key => {
                    const option = config.select_options[key];
                    return {
                        label: option.name,
                        description: option.description,
                        value: key,
                        emoji: option.emoji
                    };
                });

                return new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("selectTicketType")
                            .setPlaceholder("Selecione uma categoria para seu ticket")
                            .addOptions(options)
                    );
            };

            const channel = interaction.channel;
            const embed = createTicketEmbed();
            const row = createSelectMenu();

            await channel.send({ embeds: [embed], components: [row] });
            await interaction.deferReply({ ephemeral: true });
            await interaction.deleteReply();
        }
    }
}