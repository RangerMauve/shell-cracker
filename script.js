const { promisify } = require('util')
const { exec: execCb } = require('child_process')
const exec = promisify(execCb)
const os = require('os')
const path = require('path')

const HOME_REGEX = /~/g
const DEFAULT_COMMAND = 'ls'

let pwd = '~/'

function onRun (e) {
  e.preventDefault(true)
  const command = fill(window.commandline.value || DEFAULT_COMMAND)
  window.commandline.value = ''
  runAndOutput(command)
}

function onClear () {
  const lines = window.terminal.querySelectorAll('.output')
  for (const line of lines) {
    line.parentElement.removeChild(line)
  }
}

window.clearTerminal.onclick = onClear
window.commands.onsubmit = onRun

runAndOutput('ls')

async function runAndOutput (command) {
  console.log('Running', command)
  output(`$ ${command}`, 'input')

  if (command.startsWith('cd ')) {
    pwd = path.join(pwd, command.split(' ')[1])
    console.log('cd', pwd)
    return
  }
  const cwd = fill(pwd)
  const result = await run(command, cwd)
  console.log({ result })
  output(result)
}

async function run (command, cwd, env = {}) {
  const { stdout } = await exec(command, {
    cwd
    // env
  })

  return stdout
}

function output (text, style = 'normal') {
  const item = document.createElement('div')
  item.classList.add('output')
  item.classList.add(`output-${style}`)

  // TODO: ansi to svg or somethin
  // TODO: URLs to links
  for (const line of text.split('\n')) {
    const lineElement = document.createElement('div')
    lineElement.innerHTML = line
    item.append(lineElement)
  }
  window.terminal.append(item)
  item.scrollIntoView({block: 'end'})
}

function fill (raw) {
  return raw.replace(HOME_REGEX, os.homedir())
}

// TODO: Detect ansi and pipe into a xterm.js terminal then take snapshot as svg

/* const term = new Terminal();
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal'));

fitAddon.fit()
term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
*/
