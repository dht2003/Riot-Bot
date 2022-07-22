const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel,  createAudioPlayer,  createAudioResource, entersState, StreamType,  AudioPlayerStatus,  VoiceConnectionStatus } = require("@discordjs/voice");
const { Client, Intents, VoiceChannel, Discord, MessageEmbed } = require("discord.js");
const fs = require('fs');
const path = require('node:path');



module.exports = {
    data: new SlashCommandBuilder()
    .setName('clown')
    .setDescription('Clowns a user')
    .addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(true)),
    async execute(message) {
        const user = message.options.getUser('target');
        const member = message.guild.members.cache.get(user.id);
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
             return message.reply(`${member.user.username} is not in a voice channel`)
        }
        const audioDir = path.join(__dirname, 'audio');
        const clownAudioFile = path.join(audioDir , 'clown_music.mp3')

        const Player = createAudioPlayer();
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            selfDeaf: false,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        try {
            connection.subscribe(Player);
            const resource = createAudioResource(clownAudioFile, {
              inputType: StreamType.Arbitrary
            });
      
            Player.play(resource);
            message.reply({
              content: 'Clown!!!!'
            });
           } catch (error) {
            message.reply({ content: error.message || "Error" });
        }
    }
}