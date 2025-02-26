/**
 * Formats the commands to ensure they are in the correct object format.
 * @param {Array} commands - The array of command objects.
 * @returns {Array} - The formatted array of command objects.
 */
export default function formatCommands(commands) {
  return commands.map(command => {
    if (typeof command.toJSON === 'function') {
      return command.toJSON();
    }
    return command;
  });
}
