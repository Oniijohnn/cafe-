const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID; // Add this line to get GUILD_ID from environment variables

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started clearing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), // Use applicationGuildCommands
      { body: [] },
    );

    console.log('Successfully cleared guild commands.');
  } catch (error) {
    console.error(error);
  }
})();
