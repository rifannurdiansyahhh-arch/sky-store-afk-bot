require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = '1516972703897358356';
const VOICE_ID = '1517044451439018054';

client.once('ready', () => {
console.log(`✅ ${client.user.tag} Online`);

```
const guild = client.guilds.cache.get(GUILD_ID);

if (!guild) {
    console.log('❌ Guild tidak ditemukan');
    return;
}

try {
    joinVoiceChannel({
        channelId: VOICE_ID,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    console.log('✅ Bot masuk Voice AFK');
} catch (err) {
    console.error(err);
}
```

});

client.login(process.env.TOKEN);
