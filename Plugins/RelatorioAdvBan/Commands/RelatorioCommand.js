const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const path = require("path");
const fs = require('fs');
const config = require(path.join(__dirname, "..", "Config.json"));
const dbPath = path.join(__dirname, "..", "Database.json");

module.exports = {
    commandBase: {
        slashData: new SlashCommandBuilder()
            .setName("relatorio")
            .setDescription("[STAFF] Relatório ADV/BAN")
            .addStringOption(option =>
                option.setName('denunciado')
                    .setDescription('Usuário denúnciado')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('punicao')
                    .setDescription('Punição')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('resultado')
                    .setDescription('resultado')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('denunciante')
                    .setDescription('Usuário que esta denunciando')
                    .setRequired(true)),
        allowedRoles: config.useCommandRoles,
        async execute(interaction) {
            const usuario = interaction.options.getString('denunciado');
            const denunciante = interaction.options.getString('denunciante');
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