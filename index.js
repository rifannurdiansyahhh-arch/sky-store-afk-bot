require('dotenv').config();

const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const {
    joinVoiceChannel,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let connection;
const spamMap = new Map();

// ==========================
// VOICE CONNECT
// ==========================
function connectVoice() {
    try {

        const guild = client.guilds.cache.get(config.GUILD_ID);
        if (!guild) return;

        connection = joinVoiceChannel({
            channelId: config.VOICE_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });

        connection.on(
            VoiceConnectionStatus.Disconnected,
            () => setTimeout(connectVoice, 5000)
        );

    } catch (err) {
        setTimeout(connectVoice, 5000);
    }
}

// ==========================
// READY
// ==========================
client.once('ready', async () => {

    console.log(`✅ ${client.user.tag} Online`);

    connectVoice();

    const startTime = Date.now();

    const format = (ms) => {
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return { d, h, m };
    };

    const pad = (n) =>
        String(n).padStart(2, '0');

    const updateAll = async () => {

        try {

            const guild =
                client.guilds.cache.get(config.GUILD_ID);

            if (!guild) return;

            const ping = client.ws?.ping || 0;

            const botUp =
                format(Date.now() - startTime);

            // ==========================
            // BOT ONLINE
            // ==========================
            const botChannel =
                guild.channels.cache.get(
                    config.BOT_STATUS_CHANNEL
                );

            if (botChannel) {

                const name =
                    `🟢 BOT ONLINE | ${ping}ms`;

                if (botChannel.name !== name) {
                    await botChannel.setName(name)
                        .catch(() => {});
                }
            }

            // ==========================
            // MEMBERS
            // ==========================
            const memberChannel =
                guild.channels.cache.get(
                    config.MEMBER_CHANNEL
                );

            if (memberChannel) {

                const name =
                    `👥 MEMBERS: ${guild.memberCount}`;

                if (memberChannel.name !== name) {
                    await memberChannel.setName(name)
                        .catch(() => {});
                }
            }

            // ==========================
            // ORDERS
            // ==========================
            const orders =
                guild.channels.cache.filter(
                    c =>
                        c.name &&
                        c.name.toLowerCase()
                            .startsWith('ticket-')
                ).size;

            const orderChannel =
                guild.channels.cache.get(
                    config.ORDER_CHANNEL
                );

            if (orderChannel) {

                const name =
                    `💰 ORDERS: ${orders}`;

                if (orderChannel.name !== name) {
                    await orderChannel.setName(name)
                        .catch(() => {});
                }
            }

            // ==========================
            // AFK TIMER
            // ==========================
            const afkChannel =
                guild.channels.cache.get(
                    config.VOICE_ID
                );

            if (afkChannel) {

                const name =
                    `🔵 ${botUp.d}D ${botUp.h}H ${pad(botUp.m)}M`;

                if (afkChannel.name !== name) {
                    await afkChannel.setName(name)
                        .catch(() => {});
                }
            }

        } catch (err) {
            console.log(err.message);
        }
    };

    updateAll();
    setInterval(updateAll, 60000);

});

// ==========================
// MESSAGE SYSTEM
// ==========================
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // ==========================
    // STAFF LOG
    // ==========================
    try {

        if (
            message.channel.id !==
            config.STAFF_LOG_CHANNEL
        ) {

            const logChannel =
                await client.channels.fetch(
                    config.STAFF_LOG_CHANNEL
                ).catch(() => null);

            if (logChannel) {

                const text =
`📌 ${message.author.tag} mengirim di #${message.channel.name}

${message.content || '[Embed / Attachment]'}`;

                logChannel.send(text)
                    .catch(() => {});
            }
        }

    } catch {}

    // ==========================
    // ANTI SPAM
    // ==========================
    const now = Date.now();

    if (!spamMap.has(message.author.id)) {
        spamMap.set(
            message.author.id,
            []
        );
    }

    const data =
        spamMap.get(message.author.id);

    data.push(now);

    const filtered =
        data.filter(
            t => now - t < 5000
        );

    spamMap.set(
        message.author.id,
        filtered
    );

    if (filtered.length >= 5) {

        await message.delete()
            .catch(() => {});

        const warn =
            await message.channel.send(
                `⚠️ ${message.author}, jangan spam.`
            ).catch(() => null);

        if (warn) {
            setTimeout(() => {
                warn.delete()
                    .catch(() => {});
            }, 300000);
        }

        return;
    }

    // ==========================
    // OPEN TICKET
    // ==========================
    if (
        config.PRODUCT_CHANNELS?.includes(
            message.channel.id
        )
    ) {

        const msg =
            await message.reply(
                `🎫 Untuk pembelian silakan buka ticket di <#${config.OPEN_TICKET}>`
            ).catch(() => null);

        if (msg) {

            setTimeout(() => {
                msg.delete()
                    .catch(() => {});
            }, 300000);
        }

        return;
    }

});

// ==========================
// LOGIN
// ==========================
client.login(process.env.TOKEN);
