require('@nexssp/extend')('array', 'object') // array flat / nodejs 10 + invert for object
// const aliases = require("../aliases.json").invert();
const os = require('os')
const { bold, grey } = require('@nexssp/ansi')
// console.log(path.dirname(path.dirname(process.execPath)));

const helpContent = (entries, plugin, path) => {
  let aliases = {}
  try {
    aliases = require(`${path}/aliases.json`)
  } catch (e) {}

  commandAliases = aliases.invert()

  // const EOL = require("os").EOL;
  const EOL = '\n'
  const commandsHelp = entries.map((entry) => {
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

  return commandsHelp
}

const helpDisplay = (commandsHelp) => {
  if (global['NEXSSP_VERSION'] && !global['NEXSSP_LOGO_DISPLAYED']) {
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
    global['NEXSSP_LOGO_DISPLAYED'] = true
  }
  if (global['NEXSSP_VERSION']) {
    commandsHelp.flat().forEach((e) => {
      console.log(grey('nexss'), bold(e.command), e.commandDesc)
    })
  } else {
    commandsHelp.flat().forEach((e) => {
      console.log(bold(e.command.trim()), e.commandDesc)
    })
  }
}

module.exports = { helpDisplay, helpContent }
