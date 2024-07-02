const { Events, InteractionType, ComponentType, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionsBitField } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const path = require("path");
const config = require(path.join(__dirname, "..", "Config.json"));

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const { client } = interaction;

        const createEmbed = (title, description, fields) => new EmbedBuilder().setColor(0x1f1e22).setDescription(`## ${title}\n${description}`).addFields(fields);
        const createButton = (id, label, style, emoji) => new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setEmoji(emoji);

        const createSelectMenu = () => new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId("selectTicketType").setPlaceholder("Selecione uma categoria para seu ticket")
                .addOptions(Object.keys(config.select_options).map(key => {
                    const option = config.select_options[key];
                    return { label: option.name, description: option.description, value: key, emoji: option.emoji };
                }))
        );

        const createChannelPermissions = (guild, userId, allowedRoles) => [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            ...allowedRoles.map(roleID => ({ id: roleID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }))
        ];

        const createTranscriptAndSend = async (client, channel, transcriptBuffer, config, ticketCreator, uniqueUsers) => {
            const transcriptChannel = await client.channels.fetch(config.transcriptChannel);
            const atendentes = [...uniqueUsers].map(user => `${user.tag} (${user.id})`).join("\n");
            const category = channel.parent ? channel.parent.name : "Não especificada";

            const embed = createEmbed("Ticket finalizado", "### Informações confidenciais, não compartilhe.", [
                { name: "Categoria", value: category },
                { name: "Cliente", value: `${ticketCreator.tag} (${ticketCreator.id})` },
                { name: "Atendimento realizado por", value: atendentes || "Nenhum" }
            ]);

            await transcriptChannel.send({
                embeds: [embed],
                files: [{ attachment: transcriptBuffer, name: `transcript-${channel.id}.html` }]
            });
        };

        if (interaction.type === InteractionType.MessageComponent) {
            if (interaction.componentType === ComponentType.StringSelect && interaction.customId === "selectTicketType") {
                if (interaction.user.bot) return;

                const guild = interaction.guild;
                const selectedValue = interaction.values[0];
                const ticketConfig = config.select_options[selectedValue];

                const existingChannel = guild.channels.cache.find(channel =>
                    channel.parentId === ticketConfig.category && channel.name === `ticket-${interaction.user.username}`
                );

                if (existingChannel) {
                    await interaction.update({ components: [createSelectMenu()] });
                    await interaction.followUp({ content: `Você já possui um ticket aberto: ${existingChannel}`, ephemeral: true });
                    return;
                }

                const channel = await guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 0,
                    parent: ticketConfig.category,
                    permissionOverwrites: createChannelPermissions(guild, interaction.user.id, ticketConfig.allowedRoles)
                });

                await channel.send({
                    content: `<@${interaction.user.id}> ${ticketConfig.allowedRoles.map(roleID => `||<@&${roleID}>||`).join(" ")}`,
                    embeds: [createEmbed("<a:check_green:1249636570991169587> Ticket Criado com Sucesso!", "Por favor, descreva sua solicitação abaixo. Nossa equipe lhe atenderá o mais rápido possível.\n\u200B", [
                        { name: "<a:7617book:1249642412234641410> Detalhes", value: "Inclua o máximo de detalhes possível para que possamos ajudá-lo da melhor forma.\n\u200B" },
                        { name: "<a:alarm:1249637152690667530> Tempo de Resposta", value: "Nosso tempo médio de resposta é de 30 a 60 minutos.\n\u200B" },
                        { name: "<a:alertt:1249637521537765451> Segurança", value: "Nunca compartilhe sua senha. Nossa equipe nunca pedirá por ela.\n\u200B" }
                    ])],
                    components: [new ActionRowBuilder().addComponents(createButton("closeTicket", "Finalizar Ticket", ButtonStyle.Danger, "<a:44503lockkey:1249640062908502067>"))]
                });

                await interaction.update({ components: [createSelectMenu()] });
                await interaction.followUp({ content: `Seu ticket foi criado: ${channel}`, ephemeral: true });
            } else if (interaction.componentType === ComponentType.Button && interaction.customId === "closeTicket") {
                if (interaction.user.bot) return;

                const channel = interaction.channel;

                const ticketCreatorUsername = channel.name.split("-")[1];
                const ticketCreator = interaction.guild.members.cache.find(member => member.user.username === ticketCreatorUsername);

                if (ticketCreator) {
                    await channel.permissionOverwrites.edit(ticketCreator.id, { ViewChannel: false, SendMessages: false });
                }

                const transcriptBuffer = await createTranscript(channel, { returnType: "buffer", saveImages: true, poweredBy: false });

                const uniqueUsers = new Set((await channel.messages.fetch({ limit: 50 })).filter(msg => msg.author.username !== ticketCreatorUsername && !msg.author.bot && msg.author.id !== client.user.id).map(msg => msg.author));

                if (ticketCreator) {
                    await createTranscriptAndSend(client, channel, transcriptBuffer, config, ticketCreator.user, uniqueUsers);
                } else {
                    await createTranscriptAndSend(client, channel, transcriptBuffer, config, { tag: ticketCreatorUsername, id: "ID não localizado" }, uniqueUsers);
                }

                return channel.delete();
            }
        }
    }
}