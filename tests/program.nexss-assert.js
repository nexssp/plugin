const nexssPlugin = require('..')

const plugin1 = nexssPlugin({
  path: require('path').resolve('.'),
  commandsPath: 'tests/commands',
})

plugin1.start()
// plugin1.displayCommandHelp()
plugin1.runCommand('testCommand1')
plugin1.runCommand('xxxx')
