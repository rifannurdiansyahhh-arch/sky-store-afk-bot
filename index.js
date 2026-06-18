require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const {
    joinVoiceChannel
} = require("@discordjs/voice");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ====================== CONFIG ======================

const GUILD_ID = "1509431392256262325";
const CATEGORY_ID = "1516977943811854467";
const PANEL_CHANNEL_ID = "1516978006646722711";

const FOUNDER_ROLE = "1516980087084285972";
const ADMIN_ROLE = "1516981261703450685";
const MEMBER_ROLE = "1516983210142072963"; // tidak digunakan karena akses ditolak

const AFK_VOICE_ID = "1517044451439018054";

// ====================================================

const ticketTypes = {
    buy_robux: "buy-robux",
    buy_title: "buy-title",
    request_title: "request-title",
    request_admin: "request-admin",
    bantuan: "bantuan"
};

client.once("ready", async () => {
    console.log(`${client.user.tag} online`);

    // ================= AFK VOICE =================

    try {
        const guild = client.guilds.cache.get(GUILD_ID);

        if (guild) {
            const voiceChannel = guild.channels.cache.get(AFK_VOICE_ID);

            if (voiceChannel) {
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true,
                    selfMute: true
                });

                console.log("Joined AFK Voice");
            }
        }
    } catch (err) {
        console.log("AFK Voice Error:", err);
    }

    // ================= PANEL =================

    try {
        const panelChannel = await client.channels.fetch(PANEL_CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle("🎫 Ticket Support")
            .setDescription(
                [
                    "Silakan pilih kebutuhan Anda melalui tombol di bawah.",
                    "",
                    "🟢 Buy Robux",
                    "🟢 Buy Title",
                    "🟢 Request Title",
                    "🟢 Request Admin",
                    "🟢 Bantuan"
                ].join("\n")
            )
            .setColor("Green")
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("buy_robux")
                .setLabel("Buy Robux")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("buy_title")
                .setLabel("Buy Title")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("request_title")
                .setLabel("Request Title")
                .setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("request_admin")
                .setLabel("Request Admin")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId("bantuan")
                .setLabel("Bantuan")
                .setStyle(ButtonStyle.Secondary)
        );

        await panelChannel.send({
            embeds: [embed],
            components: [row1, row2]
        });

        console.log("Panel sent");
    } catch (err) {
        console.log("Panel Error:", err);
    }
});

// ================= INTERACTION =================

client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton()) return;

    // ================= CLOSE =================

    if (interaction.customId === "close_ticket") {

        await interaction.reply({
            content: "🔒 Ticket akan ditutup dalam 5 detik...",
            ephemeral: true
        });

        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch {}
        }, 5000);

        return;
    }

    // ================= CREATE =================

    const ticketName = ticketTypes[interaction.customId];

    if (!ticketName) return;

    const existing = interaction.guild.channels.cache.find(
        c =>
            c.parentId === CATEGORY_ID &&
            c.topic === interaction.user.id
    );

    if (existing) {
        return interaction.reply({
            content: `❌ Kamu sudah memiliki ticket: ${existing}`,
            ephemeral: true
        });
    }

    try {

        const channel = await interaction.guild.channels.create({
            name: `${ticketName}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            topic: interaction.user.id,

            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },

                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },

                {
                    id: FOUNDER_ROLE,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },

                {
                    id: ADMIN_ROLE,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("close_ticket")
                .setLabel("Close Ticket")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Danger)
        );

        const ticketEmbed = new EmbedBuilder()
            .setTitle("🎫 Ticket Dibuat")
            .setDescription(
                [
                    `Halo ${interaction.user},`,
                    "",
                    `Kategori: **${ticketName}**`,
                    "",
                    "Silakan jelaskan kebutuhan Anda dan tunggu staff merespon."
                ].join("\n")
            )
            .setColor("Blue")
            .setTimestamp();

        await channel.send({
            content: `<@${interaction.user.id}> <@&${FOUNDER_ROLE}> <@&${ADMIN_ROLE}>`,
            embeds: [ticketEmbed],
            components: [closeRow]
        });

        await interaction.reply({
            content: `✅ Ticket berhasil dibuat: ${channel}`,
            ephemeral: true
        });

    } catch (err) {
        console.error(err);

        interaction.reply({
            content: "❌ Gagal membuat ticket.",
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);
