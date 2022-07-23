const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel,  createAudioPlayer,  createAudioResource, entersState, StreamType,  AudioPlayerStatus,  VoiceConnectionStatus } = require("@discordjs/voice");
const { Client, Intents, VoiceChannel, Discord, MessageEmbed } = require("discord.js");
const fs = require('fs');
const path = require('node:path');



module.exports = {
    data: new SlashCommandBuilder()
    .setName('censor')
    .setDescription('Censors a user')
    .addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(true)),
    async execute(message) {
        const user = message.options.getUser('target');
        const member = message.guild.members.cache.get(user.id);
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
             return message.reply(`${member.user.username} is not in a voice channel`)
        }
        const audioDir = path.join(__dirname, 'audio');
        const beepSoundPath = path.join(audioDir , 'beep_sound.mp3')

        const Player = createAudioPlayer();
        let connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            selfDeaf: false,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        try {
            connection.subscribe(Player);
            message.reply({
              content: `Censoring ${member.user.username}`
            });
            connection.receiver.speaking.on('start',(userId) => {
                let resource = createAudioResource(beepSoundPath, {
                    inputType: StreamType.Arbitrary
                });
                Player.play(resource);
            })
           } catch (error) {
            message.reply({ content: error.message || "Error" });
        }
    }
}