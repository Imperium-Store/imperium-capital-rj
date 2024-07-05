const { SlashCommandBuilder } = require('discord.js');
const path = require("path");
const config = require(path.join(__dirname, "..", "Config.json"));

module.exports = {
    commandBase: {
        slashData: new SlashCommandBuilder()
            .setName("revisao")
            .setDescription("[STAFF] Relatório de revisão")
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('ID do usuário junto com menção!')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('resultado')
                    .setDescription('negada, lupa ou aprovada, a decisão é sua!')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Aprovado', value: 'aprovado' },
                        { name: 'Negado', value: 'negado' },
                        { name: 'Lupa', value: 'lupa' }
                    ))
            .addStringOption(option =>
                option.setName('revisado')
                    .setDescription('Punição que foi revisada')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('provas')
                    .setDescription('Informe as provas')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('motivo')
                    .setDescription('Informe o motivo')
                    .setRequired(true)),
        allowedRoles: config.useCommandRoles,
        async execute(interaction) {
            const userId = interaction.options.getString('id');
            const ticketNumber = interaction.channel.name;
            const result = interaction.options.getString('resultado').toLowerCase();
            const revisedPunishment = interaction.options.getString('revisado');
            const proofs = interaction.options.getString('provas');
            const reason = interaction.options.getString('motivo');

            let channel, message;
            
            const categoryId = config.category;
            if (interaction.channel.parentId !== categoryId) {
              await interaction.reply({
                content: "Você não pode executar este comando aqui!",
                ephemeral: true,
              });
              return;
            }

            if (result === 'negado' || result === 'lupa') {
                channel = interaction.guild.channels.cache.get(config.channelNegado);

                if (!channel) {
                    return interaction.reply({ content: 'Não foi possível encontrar o canal específico para resultados negados/enviados para lupa.', ephemeral: true });
                }

                const resultadoTexto = result === 'negado' ? 'NEGADO' : 'ENVIADO PARA LUPA';
                message =
                  "``` ```\n" +
                  `> **ID:** ${userId}\n> **TICKET:** ${
                    ticketNumber.split("・")[1] || ticketNumber
                  }\n> **MOTIVO:** ${reason}\n> **RESULTADO:** ${resultadoTexto}\n> **${
                    resultadoTexto === "NEGADO" ? "NEGADO" : "ENVIADO"
                  } POR:** <@${interaction.user.id}>`;
            } else if (result === 'aprovado') {
                channel = interaction.guild.channels.cache.get(config.channelAprovado);

                if (!channel) {
                    return interaction.reply({ content: 'Não foi possível encontrar o canal específico para resultados aprovados.', ephemeral: true });
                }

                message =
                  "``` ```\n" +
                  `> **ID:** ${userId}\n> **TICKET:** ${
                    ticketNumber.split("・")[1] || ticketNumber
                  }\n> **MOTIVO:** ${reason}\n> **RESULTADO:** APROVADO\n> **REVISADO:** ${revisedPunishment}\n> **REVOGADO POR:** <@${
                    interaction.user.id
                  }>\n> **PROVAS:** ${proofs}`;
            } else {
                return interaction.reply({ content: 'Resultado inválido fornecido.', ephemeral: true });
            }

            await channel.send(message);

            return interaction.reply({ content: 'Relatório enviado com sucesso.', ephemeral: true });
        }
    }
}