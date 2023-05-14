#!/usr/bin/env node
import CLIApplication from './app/cli.js';

const commandManager = new CLIApplication();

commandManager.parseCommandFiles().then((commands) => {
  commandManager.registerCommands(commands);
  commandManager.processCommand(process.argv);
});
