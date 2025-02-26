const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started clearing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] },
    );

    console.log('Successfully cleared application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
