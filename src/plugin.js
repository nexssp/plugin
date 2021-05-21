/**
 * Creates Plugin definition (all params optional)
 * @param {string} plugin - path to the plugin
 * //@param {string} path - path to the plugin
 * @param {regexp|string} trigger - plugin cmd needs to pass the test
 * @param {string} commandsPath - folder where the commands are
 * @param {string} benchmark - display executed time if enabled
 * @param {array} ommit - ommits files eg. '!*\/**\/*.nexss-test.js'
 * @param {bool} through - if true, if no criteria met, it will go to the next step.
 */

function nexssPlugin({
  plugin /* required */,
  aliases,
  trigger,
  triggerValue /* default is provess.argv[2] */,
  path,
  commandsPath = "src/cli/commands",
  through,
  benchmark = true,
  ommit = [],
}) {
  const { bold, green, red } = require("@nexssp/ansi");
  const _path = require("path");
  if (!plugin && !path) {
    throw new Error(red("'plugin' or 'path' is required for nexssPlugin."));
  } else if (plugin && path) {
    console.error(`Please us only one of the properties: plugin or path.`);
    console.error(`You have used:`);
    console.error(`plugin: ${plugin}`);
    console.error(`path: ${path}`);
    process.exit();
  }

  let _ignore = ["!*/**/*.nexss-test.js"];
  if (ommit) {
    _ignore = [..._ignore, ...ommit];
  }
  const _arguments = arguments;
  const _log = require("@nexssp/logdebug");
  const _name = plugin || "";
  const __name = _name.split("/").slice(-1)[0];

  if (_name) path = getPluginPath(plugin);

  _NEXSS_COMMANDS_FOLDER = _path.join(path, commandsPath);

  // If dynamic runCommand was executed recursive so already passed.
  if (aliases || trigger) {
    trigger = aliases
      ? new RegExp(`(${__name}|${aliases.join("|")})`)
      : trigger;
    _log.di(`@plugin: Trigger '${trigger}' exists - check..`);
    if (!triggerValue) {
      _log.di(`@plugin: TriggerValue does not exist. Using process.argv[2]`);
      triggerValue = process.argv[2];
    }

    // const emptyPluginObject = {
    //   start: () => "trigger not passed",
    //   runCommand: () => "trigger not passed",
    //   displayCommandHelp,
    // };

    if (trigger instanceof RegExp) {
      if (!trigger.test(triggerValue)) {
        _log.dy(
          `@plugin: REGEXP: Trigger ${triggerValue} didn't pass the test: ${trigger}`
        );
        return false;
      } else {
        _log.dg(
          `@plugin: REGEXP: Trigger ${triggerValue} passed the test: ${trigger}`
        );
      }
    } else if (triggerValue !== trigger) {
      _log.d(
        `@plugin: STRING: Trigger ${triggerValue} didn't pass the test: ${trigger}`
      );
      return false;
    } else {
      _log.dg(
        `@plugin: STRING: Trigger ${triggerValue} passed the test: ${trigger}`
      );
    }
  }
  let _fs;

  let _version;
  let _benchmark = benchmark;

  const start = () => {
    _log.dg(`@plugin: starting ${_name} at: `, commandsPath);
    _fs = require("fs");

    const _packageJsonPath = _path.join(path, "package.json");
    if (_fs.existsSync(_packageJsonPath)) {
      const { version, name } = require(_packageJsonPath);
      _version = version;
      if (_name && _name !== name) {
        throw new Error(
          red(
            `Name of the plugin specified '${_name}' has not been matched with the '${name}'`
          )
        );
      }
    }

    if (_name && !through) {
      console.log(`${_name}@${bold(green(_version))}`);
      if (_benchmark) console.time(bold(_name));
    }
    _started = true;
  };

  function getHelpFiles() {
    const fg = require("fast-glob");
    const files = fg.sync(
      [`${_NEXSS_COMMANDS_FOLDER}/*.md`.replace(/\\/g, "/")],
      {
        ignore: _ignore,
      }
    );

    return files;
  }

  const getAliases = () => {
    if (_fs.existsSync(`${path}/aliases.json`)) {
      return require(`${path}/aliases.json`);
    }
  };

  function displayCommandHelp() {
    const { help } = require("./help");
    const helpFiles = getHelpFiles();
    // console.log(helpFiles, __name, path);
    help(helpFiles, __name, path);
    // process.exit(1);
  }

  // 'Dynamic' is used when first command does not exist.
  // But there is default folder which contains commands
  // myplugin xxxoptional install ...
  // then xxxoptional is the dynamic.
  // we us it for example for dynamic variable
  function runCommand(command, args = [], dynamic, localArgs = { through }) {
    _log.dg(`@plugin: running command `, {
      command,
      args,
      dynamic,
      localArgs,
    });

    const commandAliases = getAliases();
    if (commandAliases && commandAliases[command]) {
      command = commandAliases[command];
    } else {
      _log.dg(`@plugin: aliases not found. `);
    }

    _log.dm();
    // return false if not exists and go through is enabled (we just go through)
    if (!command && through) {
      return false;
    }

    if (!command || command === "help") {
      displayCommandHelp();
      return;
    }

    const subpluginPath = _path.resolve(_NEXSS_COMMANDS_FOLDER, "../");

    const router = _path.join(subpluginPath, "_router.js");
    _log.dy(`@plugin: checking router at:`, router);
    subpluginPath;

    if (_fs.existsSync(router)) {
      _log.dg(`@plugin: router has been found:`, router);
      const resultFromRouter = require(router)(
        args[0],
        args.slice(1),
        command,
        localArgs
      );
      _log.dg(`@plugin: router returned`, resultFromRouter);
      // console.log({ resultFromRouter });
      return resultFromRouter;
    } else {
      _log.dy(`@plugin: router has NOT been found:`, router);
      const commandFile = `${_path.join(_NEXSS_COMMANDS_FOLDER, command)}.js`;
      if (_fs.existsSync(commandFile)) {
        if (args[0] !== "help") {
          _log.dy(`@plugin: found command at:`, commandFile, `loading..`);
          return require(commandFile)(command, args);
        } else {
          _log.dg(`@plugin: loading help..`);
          let mdExploded = commandFile.split(/\./);
          mdExploded.pop();
          const helpFile = `${mdExploded.join(".")}.md`;
          const content = _fs.readFileSync(helpFile).toString();
          const { displayMarkdown } = require("../lib/markdown");
          displayMarkdown(content);
          return true;
        }
      } else {
        _log.dr(
          `@plugin: command NOT found at:`,
          commandFile,
          "Loading help for this command"
        );
        _log.dy(`Command '${command}' has not been found for ${_name}.`);
        displayCommandHelp();
        return true;
      }
    }

    if (_name && !through) {
      if (_benchmark) console.timeEnd(bold(_name));
    }
  }

  return {
    getHelpFiles,
    getAliases,
    start,
    runCommand,
    displayCommandHelp,
  };
}

function getPluginPath(plugin) {
  const { dirname } = require("path");
  const Module = module.constructor;
  const moduleMainFilePath = dirname(
    Module._resolveFilename(plugin, module.parent)
  );
  const moduleRootPath = require("path").resolve(moduleMainFilePath, "../");
  return moduleRootPath;
}

nexssPlugin.getPluginPath = getPluginPath;
module.exports = nexssPlugin;
