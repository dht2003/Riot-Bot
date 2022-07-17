const {SlashCommandBuilder} = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');




module.exports = {
    data: new SlashCommandBuilder().setName("join_vc").setDescription("Joins Vc"),
    async execute(message) {
        if (!message.member.voice.channel) return message.channel.send('You need to be a voice channel to execute this command!')
        if(!message.member.voice.channel.joinable) return message.channel.send('I need permission to join your voice channel!')

        const connection = await joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.member.guild.id,
            adapterCreator: message.channel.guild.voiceAdapterCreator,
            selfDeaf: false
        })

        await message.channel.send('Connected to voice!');
    }
};