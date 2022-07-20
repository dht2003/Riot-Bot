const { entersState, joinVoiceChannel, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { createWriteStream } = require('node:fs');
const prism = require('prism-media');
const { pipeline } = require('node:stream');
const { Client, Intents, MessageAttachment, Collection, User } = require('discord.js');
const ffmpeg = require('ffmpeg');
const sleep = require('util').promisify(setTimeout);
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require('node:path');

let sentence_count = 0

module.exports = {
    data: new SlashCommandBuilder()
    .setName('chat_restriction')
    .setDescription('records user')
    .addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(true))
    .addIntegerOption(option => option.setName('sentence_restriction').setDescription('Number of sentences that user can say').setRequired(true)),
    async execute(message) {
        const sentence_restriction = message.options.getInteger('sentence_restriction');
        const user = message.options.getUser('target');
        const member = message.guild.members.cache.get(user.id);
        const voiceChannel = member.voice.channel;
        /* Check if the bot is in voice channel */
        let connection = message.client.voiceManager.get(message.channel.guild.id)

        /* If the bot is not in voice channel */
        if (!connection) {
            /* if user is not in any voice channel then return the error message */
            if(!voiceChannel) return message.reply("You must be in a voice channel to use this command!")

            /* Join voice channel*/
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                selfDeaf: false,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            /* Add voice state to collection */
            message.client.voiceManager.set(message.channel.guild.id, connection);
            await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
            const receiver = connection.receiver;

            /* When user speaks in vc*/
            receiver.speaking.on('start', (userId) => {
                createListeningStream(connection,receiver, member,userId,sentence_restriction);
            });

            /* Return success message */
            return message.reply(`hat restricting ${member.user.username}`);
        }
        else if (connection) {
            const msg = message.reply("Already chat restricting a user")
        }
    }
}


function createListeningStream(connection,receiver, user, userId, sentence_restriction) {
    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100,
        },
    });
    const oggStream = new prism.opus.OggLogicalBitstream({
        opusHead: new prism.opus.OpusHead({
            channelCount: 2,
            sampleRate: 48000,
        }),
        pageSizeControl: {
            maxPackets: 10,
        },
    });
    sentence_count++;
    if (sentence_count >= sentence_restriction) {
        console.log(`Muted ${user.user.username}`);
        user.voice.setMute(true);
        connection.destroy();
    }
    const recordingsPath = path.join(__dirname, 'recordings');
    const filename = path.join(recordingsPath, `${user.id}.pcm`);

    const out = createWriteStream(filename, { flags: 'a' });
    console.log(`👂 Started recording ${filename}`);

    pipeline(opusStream, oggStream, out, (err) => {
        if (err) {
            console.warn(`❌ Error recording file ${filename} - ${err.message}`);
        } else {
            console.log(`✅ Recorded ${filename}`);
        }
    });
    console.log(sentence_count);
}