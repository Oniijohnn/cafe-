/**
 * Formats the commands to ensure they are in the correct object format.
 * @param {Array} commands - The array of command objects.
 * @returns {Array} - The formatted array of command objects.
 */
export default function formatCommands(commands) {
  return commands.map(command => {
    return {
      name: command.name,
      description: command.description,
      options: command.options || [],
      type: command.type,
      // Add other necessary properties here
    };
  });
}
