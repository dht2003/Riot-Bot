const { entersState, joinVoiceChannel, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { createWriteStream } = require('node:fs');
const prism = require('prism-media');
const { pipeline } = require('node:stream');
const { Client, Intents, MessageAttachment, Collection } = require('discord.js');
const ffmpeg = require('ffmpeg');
const sleep = require('util').promisify(setTimeout);
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require('node:path');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('record')
    .setDescription('records user')
    .addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(true)),
    async execute(message) {
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
                createListeningStream(receiver, userId, member);
            });

            /* Return success message */
            return message.reply(`🎙️ I am now recording ${voiceChannel.name}`);
        }
        else if (connection) {
            /* Send waiting message */
            const msg = await message.reply("Please wait while I am preparing your recording...")
            /* wait for 5 seconds */
            await sleep(5000)

            /* disconnect the bot from voice channel */
            connection.destroy();

            /* Remove voice state from collection */
            message.client.voiceManager.delete(message.channel.guild.id)
            
            const recordingsPath = path.join(__dirname, 'recordings');
            const filename = path.join(recordingsPath, `${user.id}`);

            /* Create ffmpeg command to convert pcm to mp3 */
            const process = new ffmpeg(`${filename}.pcm`);
            process.then(function (audio) {
                audio.fnExtractSoundToMP3(`${filename}.mp3`, async function (error, file) {
                    //edit message with recording as attachment
                    await  message.channel.send({
                        content: `🔉 Here is your recording!`,
                        files: [new MessageAttachment(`${filename}.mp3`, 'recording.mp3')]
                    });

                    //delete both files
                    fs.unlinkSync(`${filename}.pcm`)
                });
            }, function (err) {
                /* handle error by sending error message to discord */
                return msg.edit(`❌ An error occurred while processing your recording: ${err.message}`);
            });
        }
    }
}


function createListeningStream(receiver, userId, user) {
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
}