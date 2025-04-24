interface NexssPluginOptions {
  plugin?: string;
  aliases?: string[];
  trigger?: RegExp | string;
  triggerValue?: string;
  path?: string;
  commandsPath?: string;
  through?: boolean;
  ommit?: string[];
}

interface CommandHelp {
  command: string;
  commandDesc: string;
}

interface NexssPluginInstance {
  start(): void;
  runCommand(
    command: string,
    args?: any[],
    dynamic?: boolean,
    localArgs?: object
  ): boolean | any;
  displayCommandHelp(): void;
  getHelpFiles(): string[];
  helpContent(): CommandHelp[];
  getAliases(): Record<string, string> | undefined;
}

declare function nexssPlugin(options: NexssPluginOptions): NexssPluginInstance;

declare namespace nexssPlugin {
  export function getPluginPath(plugin: string): string;
  export function helpDisplay(commandsHelp: CommandHelp[]): void;
}

export = nexssPlugin;
