require('@nexssp/extend')('array', 'object') // array flat / nodejs 10 + invert for object
// const aliases = require("../aliases.json").invert();
const os = require('os')
const { bold, grey } = require('@nexssp/ansi')
// console.log(path.dirname(path.dirname(process.execPath)));

exports.help = async (entries, plugin, path) => {
  const aliases = require(`${path}/aliases.json`)
  commandAliases = aliases.invert()

  // const EOL = require("os").EOL;
  const EOL = '\n'
  const commandsHelp = await Promise.all(
    entries.map(async (entry) => {
      const helpContent = require('fs').readFileSync(entry).toString().split(EOL)
      //   console.info(helpContent.toString());
      const command = entry.match(/commands\/(.*).md$/)[1]
      // .slice(-1)
      // .pop()
      // .replace(".md");
      //   console.log("!!!!!!", command[1]);
      //   process.exit(1);
      // We display 3rd or 1st line from help. Eg 1st can be just header as proper md file
      const cmd = command.replace(/\.js/, '')
      let cmdDisplay = cmd
      if (commandAliases[cmd]) {
        cmdDisplay = `${cmd}|${commandAliases[cmd]}`
      }

      let pluginDisplay = plugin
      if (aliases[plugin]) {
        pluginDisplay = `${plugin}|${aliases[plugin]}`
      }

      if (cmdDisplay === '.gitkeep') {
        cmdDisplay = ''
      }

      const commandHelp =
        cmd !== plugin
          ? `${pluginDisplay} ${cmdDisplay}` // [args]
          : `${pluginDisplay}`

      return {
        command: commandHelp,
        commandDesc: helpContent[2] || helpContent[0],
      }
    })
  )
  if (global['NEXSSP_VERSION'])
    console.log(
      `                ____                                                              
|..          | |             \`\`..      ..''             ..''''             ..'''' 
|  \`\`..      | |______           \`\`..''              .''                .''       
|      \`\`..  | |                 ..'\`..           ..'                ..'          
|          \`\`| |___________  ..''      \`\`.. ....''             ....''             
Programmer ${bold(NEXSSP_VERSION)}, NodeJS ${process.version}, OS: ${
        process.platform
      } ${os.release()}  `
    )

  commandsHelp.flat().forEach((e) => {
    console.log(grey('nexss'), bold(e.command), e.commandDesc)
  })
  // console.log(commandsHelp.flat());
  console.log(bold("To display help add 'help': nexss command help OR nexss package help"))
  //   console.log(JSON.stringify(result));
}

// await fs.promises.mkdir("/tmp/a/apple", { recursive: true });
