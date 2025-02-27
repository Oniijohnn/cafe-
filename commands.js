const commands = [];

// Ensure no duplicate names and correct structure
commands.push({
  name: "afk",
  description: "Set your status to AFK.",
  type: 1, // Slash command type
  options: [
    {
      name: "message",
      description: "Your AFK message",
      type: 3, // STRING type
      required: false,
    },
  ],
});

commands.push({
  name: "afk-remove",
  description: "Remove your AFK status.",
  options: [],
});

commands.push({
  name: "test",
  description: "A test command.",
  options: [],
});

commands.push({
  name: "setwelcome",
  description: "Set a welcome message.",
  options: [],
});

commands.push({
  name: "ban",
  description: "Ban a user.",
  options: [],
});

commands.push({
  name: "timeout",
  description: "Timeout a user.",
  options: [],
});

commands.push({
  name: "kick",
  description: "Kick a user.",
  options: [],
});

commands.push({
  name: "warn",
  description: "Warn a user.",
  options: [],
});

commands.push({
  name: "blacklist",
  description: "Blacklist a user.",
  options: [],
});

commands.push({
  name: "whitelist",
  description: "Whitelist a user.",
  options: [],
});

commands.push({
  name: "report",
  description: "Report a user.",
  options: [],
});
