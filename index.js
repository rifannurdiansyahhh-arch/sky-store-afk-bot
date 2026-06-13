require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActivityType
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

function connectVoice() {
    const guild = client.guilds.cache.get(config.GUILD_ID);

    if (!guild) return;

    try {
        connection = joinVoiceChannel({
            channelId: config.VOICE_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: false
        });

        console.log('🎵 Voice Connected');

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('🔄 Reconnecting Voice...');
            setTimeout(connectVoice, 5000);
        });

    } catch (err) {
        console.log(err);
    }
}

client.once('ready', () => {

    console.log(`✅ ${client.user.tag} Online`);

    connectVoice();

    // ==========================
    // JAM WIB CHANNEL
    // ==========================

    const clockChannel = client.channels.cache.get('1514934456216059965');

    if (clockChannel) {

        const updateClock = async () => {

            const time = new Date().toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit'
            });

            await clockChannel
                .setName(`🕒 WIB ${time}`)
                .catch(() => {});
        };

        updateClock();

        setInterval(updateClock, 60000);
    }

    const statuses = [
        '🛒 SKYSTORE COMMUNITY',
        '🎫 OPEN TICKET',
        '⭐ Trusted Store',
        '💎 ROBUX VIA USN',
        '🚀 SERVER BOOST'
    ];

    let i = 0;

    setInterval(() => {

        client.user.setPresence({
            activities: [{
                name: statuses[i],
                type: ActivityType.Watching
            }],
            status: 'online'
        });

        i++;
        if (i >= statuses.length) i = 0;

    }, 15000);

    const ratingChannel = client.channels.cache.get(
        config.RATING_CHANNEL
    );

    if (ratingChannel) {
        setInterval(() => {

            ratingChannel.send(
                '⭐ Sudah melakukan transaksi? Jangan lupa berikan rating dan testimoni Anda. Terima kasih telah mempercayai SKYSTORE COMMUNITY.'
            ).catch(() => {});

        }, 3600000);
    }
});

const spamMap = new Map();

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // ==========================
    // ANTI INVITE DISCORD
    // ==========================

    if (
        message.content.includes('discord.gg/') ||
        message.content.includes('discord.com/invite/')
    ) {

        await message.delete().catch(() => {});

        return message.channel.send(
            `${message.author} ❌ Link Discord server lain tidak diperbolehkan.`
        );
    }

    // ==========================
    // ANTI SPAM
    // ==========================

    const now = Date.now();

    if (!spamMap.has(message.author.id)) {
        spamMap.set(message.author.id, []);
    }

    const userMessages = spamMap.get(message.author.id);

    userMessages.push(now);

    const filtered = userMessages.filter(
        time => now - time < 5000
    );

    spamMap.set(message.author.id, filtered);

    if (filtered.length >= 5) {

        await message.delete().catch(() => {});

        return message.channel.send(
            `${message.author} ⚠️ Jangan spam chat.`
        );
    }

// ==========================
// AUTO OPEN TICKET
// ==========================

if (
    config.PRODUCT_CHANNELS.includes(
        message.channel.id
    )
) {

    const ticketMsg = await message.reply(
        `🎫 Untuk melakukan pembelian silakan buka ticket di <#${config.OPEN_TICKET}>`
    );

    setTimeout(() => {
        ticketMsg.delete().catch(() => {});
    }, 300000); // 5 menit

    return;
}

    // ==========================
    // STAFF LOG
    // ==========================

    const logChannel = client.channels.cache.get(
        config.STAFF_LOG_CHANNEL
    );

    if (logChannel) {

        logChannel.send(
            `📌 ${message.author.tag} mengirim pesan di #${message.channel.name}`
        ).catch(() => {});
    }
});

client.login(process.env.TOKEN);
