const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel,  createAudioPlayer,  createAudioResource, entersState, StreamType,  AudioPlayerStatus,  VoiceConnectionStatus } = require("@discordjs/voice");
const { Client, Intents, VoiceChannel, Discord, MessageEmbed } = require("discord.js");
const fs = require('fs');
const path = require('node:path');



module.exports = {
    data: new SlashCommandBuilder()
    .setName('play_record')
    .setDescription('Plays Recording of a user')
    .addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(true)),
    async execute(message) {
        const user = message.options.getUser('target');
        const recordingPath = path.join(__dirname, 'recordings');
        const filename = path.join(recordingPath,  `${user.id}.mp3`);
        if (!fs.existsSync(filename)) {
            return message.reply('Cannot find recording of user');
        }
        const Player = createAudioPlayer();
        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            selfDeaf: false,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
        try {
            connection.subscribe(Player);
            const resource = createAudioResource(filename, {
              inputType: StreamType.Arbitrary
            });
      
            Player.play(resource);
            message.reply({
              content: 'Playing Recording'
            });
           } catch (error) {
            message.reply({ content: error.message || "Error" });
        }
        
          
    }
}