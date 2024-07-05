const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const path = require("path");
const fs = require('fs');
const config = require(path.join(__dirname, "..", "Config.json"));
const dbPath = path.join(__dirname, "..", "Database.json");

module.exports = {
    commandBase: {
        slashData: new SlashCommandBuilder()
            .setName("relatorio")
            .setDescription("[STAFF] Relatorio ADV/BAN")
            .addStringOption(option =>
                option.setName('denunciado')
                    .setDescription('Usuário denúnciado (menção ou ID)')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('punicao')
                    .setDescription('Punição')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('resultado')
                    .setDescription('Resultado')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('denunciante')
                    .setDescription('Usuário que está denunciando (menção ou ID)')
                    .setRequired(true)),
        allowedRoles: config.useCommandRoles,
        async execute(interaction) {
            const extractNicknameId = (nickname) => {
                const nicknameIdMatch = nickname.match(/#(\d+)$/);
                return nicknameIdMatch ? nicknameIdMatch[1] : '';
            };

            const formatUser = async (input) => {
                const mentionMatch = input.match(/<@!?(\d+)>/);
                if (mentionMatch) {
                    const userId = mentionMatch[1];
                    const member = await interaction.guild.members.fetch(userId);
                    const nickname = member.displayName;
                    const nicknameId = extractNicknameId(nickname);
                    return `${member} | ${nicknameId}`;
                } else if (input.includes('#')) {
                    const [name, id] = input.split('#');
                    return `${id.trim()} | ${name.trim()}`;
                }
                return input;
            };

            const usuario = await formatUser(interaction.options.getString('denunciado'));
            const denunciante = await formatUser(interaction.options.getString('denunciante'));
ticketsCategory;
            const punicao = interaction.options.getString('punicao');
            const resultado = interaction.options.getString('resultado');
            const ticket = interaction.channel.name;
            const staff = interaction.user.id;

            const categoryId = config.ticketsCategory;
            if (interaction.channel.parentId !== categoryId) {
                await interaction.reply({
                    content: "Você não pode executar este comando aqui!",
                    ephemeral: true
                });
                return;
            }

            let database = {};
            if (fs.existsSync(dbPath)) {
                database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            }

            database[interaction.channel.id] = { usuario, punicao, ticket, resultado, denunciante, staff };

            fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

            const modal1 = new ModalBuilder()
                .setCustomId("advertencia-modal-1")
                .setTitle("Relatório de ADV/BAN")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("motivo")
                            .setLabel("Motivo")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("itens_looteados")
                            .setLabel("Itens Looteados")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("multa_loot")
                            .setLabel("Multa por Loot Indevido")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("provas")
                            .setLabel("Provas")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal1);
        }
    }
}