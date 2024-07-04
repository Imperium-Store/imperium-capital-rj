const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const path = require("path");
const fs = require("fs");
const config = require(path.join(__dirname, "..", "Config.json"));
const dbPath = path.join(__dirname, "..", "Database.json");

const readDatabase = () => {
    if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    return {};
};

const writeDatabase = (database) => {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isModalSubmit()) {
            if (interaction.customId === "advertencia-modal-1") {
                const motivo = interaction.fields.getTextInputValue("motivo");
                const itensLooteados = interaction.fields.getTextInputValue("itens_looteados") || "Nenhum";
                const multaLoot = interaction.fields.getTextInputValue("multa_loot") || "Nenhuma";
                const provas = interaction.fields.getTextInputValue("provas");
                const resolvidoPor = interaction.user.id;

                const database = readDatabase();
                const tempData = database[interaction.channel.id] || {};
                tempData.resolvidoPor = resolvidoPor;
                database[interaction.channel.id] = tempData;
                writeDatabase(database);

                const { usuario, punicao, ticket, resultado } = tempData;

                const embed = new EmbedBuilder()
                    .setDescription("## Relatório de ADV/BAN")
                    .addFields(
                        { name: "Denunciado", value: `${usuario}`, inline: true },
                        { name: "Punição", value: `${punicao}`, inline: true },
                        { name: "Ticket", value: ticket, inline: true },
                        { name: "Resultado", value: resultado, inline: false },
                        { name: "Motivo", value: motivo, inline: false },
                        { name: "Itens Looteados", value: itensLooteados, inline: false },
                        { name: "Multa por Loot Indevido", value: `R$ ${multaLoot}`, inline: false },
                        { name: "Resolvido por", value: `<@${resolvidoPor}>`, inline: true },
                        { name: "Aprovado por", value: "<a:2217salesforceload:1256072084476530710> Aguardando análise", inline: true },
                        { name: "Provas", value: provas, inline: false }
                    )
                    .setColor(0xffff00)
                    .setFooter({
                        text: "Bot desenvolvido por Imperium Store.",
                        iconURL: "https://cdn.discordapp.com/attachments/1255724527661355039/1255724601707593789/imperium-store.png?ex=667ed4eb&is=667d836b&hm=e8eb5d5cba9b5173c601cf6ef576e61f4b050fbcf1c751075c4178525f97a769&",
                    });

                const approveButton = new ButtonBuilder()
                    .setCustomId("approve-button")
                    .setLabel("Aprovar")
                    .setStyle(ButtonStyle.Success);

                const rejectButton = new ButtonBuilder()
                    .setCustomId("reject-button")
                    .setLabel("Reprovar")
                    .setStyle(ButtonStyle.Danger);

                const cancelButton = new ButtonBuilder()
                    .setCustomId("cancel-button")
                    .setLabel("Cancelar")
                    .setStyle(ButtonStyle.Secondary);

                const buttonRow = new ActionRowBuilder().addComponents(approveButton, rejectButton, cancelButton);

                const mentionRoles = config.mentionsRolesApprove
                    .map((roleId) => `<@&${roleId}>`)
                    .join(", ");

                await interaction.channel.send({
                    content: mentionRoles,
                    embeds: [embed],
                    components: [buttonRow],
                });

                await interaction.reply({
                    content: "Relatório enviado, aguarde análise de um superior!",
                    ephemeral: true,
                });
            }

            if (interaction.customId === "reject-modal") {
                const reproveReason = interaction.fields.getTextInputValue("reprove_reason");

                const database = readDatabase();
                const tempData = database[interaction.channel.id];
                const { staff } = tempData;

                await interaction.channel.send({
                    content: `### <a:alerta:1256070354732974163> Relatório reprovado pelo seguinte motivo: ${reproveReason}\n||<@${staff}>||`,
                });

                const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

                if (originalEmbed.data.fields) {
                    originalEmbed.data.fields = originalEmbed.data.fields.map((field) => {
                        if (field.name === "Aprovado por") {
                            field.name = "Reprovado por";
                            field.value = `<@${interaction.user.id}>`;
                        }
                        return field;
                    });
                }

                originalEmbed.setColor(0xff0000);

                await interaction.update({
                    embeds: [originalEmbed],
                    components: [],
                });

                await interaction.followUp({
                    content: "Relatório reprovado com sucesso!",
                    ephemeral: true,
                });
            }
        }

        if (interaction.isButton()) {
            const database = readDatabase();
            const tempData = database[interaction.channel.id];

            if (interaction.customId === "approve-button") {
                const requiredRoles = config.rolesApprove;

                if (!requiredRoles.some((role) => interaction.member.roles.cache.has(role))) {
                    await interaction.reply({
                        content: "Você não tem permissão para usar esta interação.",
                        ephemeral: true,
                    });
                    return;
                }

                const { staff } = tempData;

                const embed = EmbedBuilder.from(interaction.message.embeds[0]);

                if (embed.data.fields) {
                    embed.data.fields = embed.data.fields.map((field) => {
                        if (field.name === "Aprovado por") {
                            field.value = `<@${interaction.user.id}>`;
                        }
                        return field;
                    });
                }

                embed.setColor(0x00ff00);

                const sendRelatoryButton = new ButtonBuilder()
                    .setCustomId("relatory-button")
                    .setLabel("Enviar relatório")
                    .setStyle(ButtonStyle.Success);

                const buttonRow = new ActionRowBuilder().addComponents(sendRelatoryButton);

                await interaction.update({
                    embeds: [embed],
                    components: [buttonRow],
                });

                await interaction.channel.send({
                    content: `### <a:check_green:1256068819890470964> <@${interaction.user.id}> fez análise do relatório e aprovou. <@${staff}> esta autorizado a finalizar o ticket.`,
                });
            } else if (interaction.customId === "reject-button") {
                const requiredRoles = config.rolesApprove;

                if (!requiredRoles.some((role) => interaction.member.roles.cache.has(role))) {
                    await interaction.reply({
                        content: "Você não tem permissão para usar esta interação.",
                        ephemeral: true,
                    });
                    return;
                }

                const rejectModal = new ModalBuilder()
                    .setCustomId("reject-modal")
                    .setTitle("Reprovar relatório")
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("reprove_reason")
                                .setLabel("Motivo")
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    );

                await interaction.showModal(rejectModal);
            } else if (interaction.customId === "cancel-button") {
                const { resolvidoPor } = tempData;

                if (interaction.user.id !== resolvidoPor) {
                    await interaction.reply({
                        content: "Você não tem permissão para cancelar este relatório.",
                        ephemeral: true,
                    });
                    return;
                }

                await interaction.message.delete();

                await interaction.reply({
                    content: "Relatório cancelado.",
                    ephemeral: true,
                });

                delete database[interaction.channel.id];
                writeDatabase(database);
            }

            if (interaction.customId === "relatory-button") {
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                const channelLogsAdm = interaction.guild.channels.cache.get(config.logsRelatorioAdm);
                const reportChannel = interaction.guild.channels.cache.get(config.logsRelatorioTicket);

                const mappedObject = embed.data.fields.reduce((acc, item) => {
                    const formattedName = item.name.replace(/\s+/g, "");
                    acc[formattedName] = item.value;
                    return acc;
                }, {});

                const handleTicketReportModel = (data) => {
                    return `
${"``` ```"}
**RELATÓRIO DE ADV/BAN**\n
**DENUNCIADO:** ${data.Denunciado}
**PUNIÇÃO:** ${data["Punição"]}
**TICKET:** ${data.Ticket}
**RESULTADO:** ${data.Resultado}
**MOTIVO:** ${data.Motivo}
**ITENS LOOTEADOS:** ${data.ItensLooteados}
**MULTA POR LOOT INDEVIDO:** ${data.MultaporLootIndevido}
**RESOLVIDO POR:** ${data.Resolvidopor}
**APROVADO POR:** ${data.Aprovadopor}
**PROVAS:** ${data.Provas}
`;
                };

                await reportChannel.send({
                    content: handleTicketReportModel(mappedObject),
                });

                if (config.logsRelatorioAdm) await channelLogsAdm.send({ embeds: [embed] });

                if (mappedObject.ItensLooteados.toLowerCase() !== "n/a") {
                    const itensList = mappedObject.ItensLooteados.split("\n")
                        .map((item) => item.trim())
                        .filter((item) => item.length > 0)
                        .map((item) => `\`${item}\``)
                        .join(" ");

                    const { denunciante } = tempData;
                    const devolucaoChannel = interaction.guild.channels.cache.get(config.logsRelatorioDevolucao);
                    await devolucaoChannel.send({
                        content:
                            `${"``` ```"}\n**:package: SOLICITAR DEVOLUÇÃO **\n\n> ID: ${denunciante}\n> ITEM: ${itensList}\n> MOTIVO: ${mappedObject.Motivo
                            }\n> SOLICITADO POR: <@${interaction.user.id
                            }>\n> PROVAS: ${mappedObject.Provas}\n`,
                    });
                }

                const regex = /<@(\d+)>/;
                const userIdString = mappedObject.Denunciado.match(regex) ? mappedObject.Denunciado.match(regex)[1] : null;

                if (userIdString) {
                    let findUser = interaction.guild.members.cache.find(
                        (member) => member.user.id === mappedObject.Denunciado.match(regex)[1]
                    );

                    if (findUser) {
                        const relatorioAdvChannel = interaction.guild.channels.cache.get(config.logsRelatorioAdv);
                        await relatorioAdvChannel.send({
                            content: `${"``` ```"}\n**Denunciado:** ${mappedObject.Denunciado}\n**Motivo:** ${mappedObject.Motivo}\n**Punição:** ${mappedObject["Punição"]}`,
                        });
                    }
                }

                await interaction.update({
                    embeds: [embed],
                    components: [],
                });

                await interaction.followUp({
                    content: "Relatório do ticket enviado para o canal de relatórios. Pode encerrar o ticket!",
                    ephemeral: true,
                });

                delete database[interaction.channel.id];
                writeDatabase(database);
            }
        }
    },
}