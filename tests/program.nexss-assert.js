const nexssPlugin = require('../src/plugin')

const plugin1 = nexssPlugin({
  path: require('path').resolve('.'),
  commandsPath: 'tests/commands',
})

plugin1.start()
// plugin1.displayCommandHelp()
plugin1.runCommand('testCommand2')
plugin1.runCommand('xxxx')
