import { CliCommandInterface } from '../core/cli-command/cli-command.interface';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ParsedCommand = Record<string, string[]>;

export default class CLIApplication {
  private commands: Record<string, CliCommandInterface> = {};

  private defaultCommand = '--help';
  private filename = fileURLToPath(import.meta.url);
  private dirname = path.dirname(this.filename);
  private pathDirName = '../core/cli-command';
  private commandDirPath = path.resolve(this.dirname, ...this.pathDirName.split('/'));

  public async parseCommandFiles(): Promise<CliCommandInterface[]> {
    const commandFiles = fs.readdirSync(this.commandDirPath).filter((file) => file.includes('.command.'));
    const commandInstances: CliCommandInterface[] = await Promise.all(
      commandFiles.map(async (file) => {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        const module = await import(`${this.pathDirName}/${file}`);

        return new module.default();
      }),
    );

    return commandInstances;
  }

  public async registerCommands(commandList: CliCommandInterface[]): Promise<void> {
    commandList.reduce((acc, command) => {
      const cliCommand = command;
      acc[cliCommand.name] = cliCommand;
      return acc;
    }, this.commands);
  }

  private parseCommand(cliArguments: string[]): ParsedCommand {
    const parseCommand: ParsedCommand = {};

    let command = '';

    return cliArguments.reduce((acc, item) => {
      if (item.startsWith('--')) {
        acc[item] = [];
        command = item;
      } else if (command && item) {
        acc[command].push(item);
      }

      return acc;
    }, parseCommand);
  }

  public getCommand(commandName: string): CliCommandInterface {
    return this.commands[commandName] ?? this.commands[this.defaultCommand];
  }

  public processCommand(argv: string[]): void {
    const parsedCommand = this.parseCommand(argv);
    const [commandName] = Object.keys(parsedCommand);
    const command = this.getCommand(commandName);
    const commandArguments = parsedCommand[commandName] ?? [];
    command.execute(...commandArguments);
  }
}
