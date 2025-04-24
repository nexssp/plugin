# @nexss/plugin

**24.04.2025 TypeScript Support** - Added TypeScript type definitions for better development experience.

Plugin system for not only the Nexss Programmer.

## Note

This Nexss Programmer's plugin is the effect of the refactoring the Nexss Programmer **@nexssp/cli** which development has been started in 2018. This module can be used also _separately_ without the Nexss Programmer.

```js
const plugin1 = nexssPlugin({
  path: resolve('.'),
  commandsPath: 'tests/commands',
})

plugin1.start()
// plugin1.displayCommandHelp()
plugin1.runCommand('testCommand1')
plugin1.runCommand('xxxx')

````
