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
  // trigger, /* build on plugin and aliases eg. language and alias ['l'] => /^(language|l)$/ */
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
  if (aliases) {
    const trigger = new RegExp("(" + aliases.join("|") + ")");
    _log.di(`@plugin: Trigger '${trigger}' exists - check..`);
    if (!triggerValue) {
      _log.di(`@plugin: TriggerValue does not exist. Using process.argv[2]`);
      triggerValue = process.argv[2];
    }

    const emptyPluginObject = {
      start: () => "trigger not passed",
      runCommand: () => "trigger not passed",
      displayCommandHelp,
    };

    if (trigger instanceof RegExp) {
      if (!trigger.test(triggerValue)) {
        _log.dy(
          `@plugin: REGEXP: Trigger ${triggerValue} didn't pass the test: ${trigger}`
        );
        return emptyPluginObject;
      } else {
        _log.dg(
          `@plugin: REGEXP: Trigger ${triggerValue} passed the test: ${trigger}`
        );
      }
    } else if (triggerValue !== trigger) {
      _log.d(
        `@plugin: STRING: Trigger ${triggerValue} didn't pass the test: ${trigger}`
      );
      return emptyPluginObject;
    } else {
      _log.dg(
        `@plugin: STRING: Trigger ${triggerValue} passed the test: ${trigger}`
      );
    }
  }
  let _started;
  let _fs;

  let _version;
  let _benchmark = benchmark;

  const start = () => {
    _fs = require("fs");

    const _packageJsonPath = _path.join(path, "package.json");
    if (_fs.existsSync(_packageJsonPath)) {
      const { version, name } = require(_packageJsonPath);
      _version = version;
      if (_name !== name) {
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
    if (fs.existsSync(`${path}/aliases.json`)) {
      return require(`${path}/aliases.json`);
    }
  };

  async function displayCommandHelp() {
    const { help } = require("./help");
    const helpFiles = getHelpFiles();
    await help(helpFiles, __name, path);
    // process.exit(1);
  }

  const displayCommandHelp2 = () => {
    if (!_started) {
      return;
    }
    let helpContent = "";
    const files = getHelpFiles();

    const filesList = files.map((f) => _path.basename(f).replace(".md", ""));
    console.log(filesList);

    helpContent += `${bold("Commands available")} for ${bold(_name)}

${bold(filesList.join(", "))}
example to display help 'nexss ${__name} ${filesList[0]} help'`;

    require("../lib/markdown").displayMarkdown(helpContent.toString());
  };

  // 'Dynamic' is used when first command does not exist.
  // But there is default folder which contains commands
  // myplugin xxxoptional install ...
  // then xxxoptional is the dynamic.
  // we us it for example for dynamic variable
  const runCommand = (command, args = [], dynamic, localArgs = { through }) => {
    if (command === aliases[1]) {
      command = aliases[0];
    }
    console.log(aliases);
    _log.dm(
      `Running command:`,
      command,
      args,
      "dynamic:",
      dynamic,
      "localArgs: ",
      localArgs
    );
    // return false if not exists and go through is enabled (we just go through)
    if (!command && through) {
      return false;
    }

    if (!command || command === "help") {
      console.log("     -- - This will be the option");

      process.exit(0);
    }

    const commandFile = `${_path.join(_NEXSS_COMMANDS_FOLDER, command)}.js`;
    if (_fs.existsSync(commandFile)) {
      require(commandFile)(command, args, dynamic);
    } else if (_fs.existsSync(_path.join(_NEXSS_COMMANDS_FOLDER, "default"))) {
      // default commands exists (commands/default folder)
      const subpluginPath = _path.join(_NEXSS_COMMANDS_FOLDER, "default");
      const newPlugin = nexssPlugin({
        path: subpluginPath,
        commandsPath: "./commands",
      });

      newPlugin.start();

      const router = _path.join(subpluginPath, "_router.js");
      if (_fs.existsSync(router)) {
        require(router)(args[0], args.slice(1), command, localArgs);
      } else {
        newPlugin.runCommand(args[0], args.slice(1), command, localArgs);
      }
    } else {
      displayCommandHelp(command, args);
    }
    if (_name && !through) {
      if (_benchmark) console.timeEnd(bold(_name));
    }
  };

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

// Below is a different way of getting path of the module from parent.
// REMEMBER TO KEEP BELOW LINE IN THE MAIN MODULE otherwise nexssPlugin.getPluginPath will not work
// module.exports.resolve = require.resolve
function getPluginPathOld(plugin) {
  const path = require("path");
  try {
    return path.resolve(
      path.dirname(require.main.exports.resolve(plugin)),
      "../"
    );
  } catch (e) {
    console.error(
      `===== nexssPlugin.getPluginPath:
${plugin} has not been found.
If you wish to access plugin property add on your main program this line:
module.exports.resolve = require.resolve
otherwise use normal path`
    );
    process.exit(1);
  }

  // return resolve(dirname(require.resolve(plugin)))
}

nexssPlugin.getPluginPath = getPluginPath;
module.exports = nexssPlugin;
