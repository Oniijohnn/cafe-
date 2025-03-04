import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';
import { afkCommands } from './commands/afkCommands.js';
import { welcomeCommands } from './commands/welcomeCommands.js';
import { moderationCommands } from './commands/moderationCommands.js';
import { blacklistCommands } from './commands/blacklistCommands.js';
import { reportCommand } from './commands/reportCommand.js';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID; // Add this line to get GUILD_ID from environment variables

const rest = new REST({ version: '9' }).setToken(TOKEN);

const commands = [
  ...afkCommands,
  ...welcomeCommands,
  ...moderationCommands,
  ...blacklistCommands,
  reportCommand,
];

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Clear old commands
    await require('./clearCommands');

    // Log command data
    console.log('Commands:', JSON.stringify(commands, null, 2));

    // Register new commands
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), // Use applicationGuildCommands
      { body: commands },
    );

    console.log('Successfully reloaded guild commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
