const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const commands = require('./commands');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.TOKEN;

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Clear old commands
    await require('./clearCommands');

    // Log command data
    console.log('Commands:', JSON.stringify(commands, null, 2));

    // Register new commands
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
