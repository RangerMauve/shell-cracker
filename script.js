const { promisify } = require('util')
const { exec: execCb } = require('child_process')
const exec = promisify(execCb)
const os = require('os')
const path = require('path')

const HOME_REGEX = /~/g
const DEFAULT_COMMAND = 'ls'
const HISTORY_KEY = 'cmd-history'

const history = loadHistory()
let pwd = '~/'
let lastHistoryIndex = history.length

window.clearTerminal.onclick = onClearOutput
window.nextCommand.onclick = loadNextHistory
window.previousCommand.onclick = loadPreviousHistory
window.commands.onsubmit = onRun
window.commandline.onkeydown = onCommandLineKey
window.onbeforeunload = persistHistory

window.commandline.placeholder = pwd
window.previousCommand.hidden = history.length === 0

runAndOutput('ls')

function persistHistory () {
  saveHistory(history)
}

function onRun (e) {
  e.preventDefault(true)
  const command = fill(window.commandline.value || DEFAULT_COMMAND)
      clearCommandline()
runAndOutput(command)
}

function onClearOutput () {
  const lines = window.terminal.querySelectorAll('.output')
  for (const line of lines) {
    line.parentElement.removeChild(line)
  }
}

function onCommandLineKey (e) {
  const { keyCode, key } = e
  // Pressed down arrow
  if (keyCode === 40) loadNextHistory()

  // Pressed up arrow
  if (keyCode === 38) loadPreviousHistory()

  if (key === 'Escape') {
      clearCommandline()
  }
}

async function runAndOutput (command) {
  addHistoryItem(command)
  console.log('Running', command)
  output(`$ ${command}`, 'input')

  if (command.startsWith('cd ')) {
    setPWD(command.split(' ')[1])
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
  if (!text.trim()) return
  const item = document.createElement('div')
  item.classList.add('output')
  item.classList.add(`output-${style}`)

  // TODO: ansi to svg or somethin
  // TODO: URLs to links
  for (const line of text.split('\n')) {
    const lineElement = document.createElement('div')
    lineElement.innerText = line
    item.append(lineElement)
  }
  window.terminal.append(item)
  item.scrollIntoView({ block: 'end' })
}

function setPWD (directory) {
  // TODO: Check that it's actually a directory
  pwd = path.join(pwd, directory)
  window.commandline.placeholder = pwd
}

function fill (raw) {
  return raw.replace(HOME_REGEX, os.homedir())
}

function clearCommandline() {
    window.commandline.value = ''
}

function addHistoryItem (command) {
  if (history.at(-1) === command) return
  history.push(command)
  lastHistoryIndex = history.length
  window.previousCommand.hidden = false
}

function loadPreviousHistory () {
  if (!history.length) return
  if (lastHistoryIndex < 0) return

  if (!lastHistoryIndex) {
    lastHistoryIndex--
    clearCommandline()
    window.previousCommand.hidden = true
    return
  }

  lastHistoryIndex--

  const command = history[lastHistoryIndex]
  window.commandline.value = command
  window.nextCommand.hidden = false
}

function loadNextHistory () {
  if (!history.length) return
  lastHistoryIndex++
  if (lastHistoryIndex >= history.length) {
    lastHistoryIndex = history.length
    clearCommandline()
    window.nextCommand.hidden = true
    window.previousCommand.hidden = false
    return
  }

  const command = history[lastHistoryIndex]
  window.commandline.value = command
  window.previousCommand.hidden = false
}

function saveHistory (items) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

function loadHistory () {
  const cached = window.localStorage.getItem(HISTORY_KEY)
  if (!cached) return []

  try {
    const parsed = JSON.parse(cached)
    return parsed
  } catch (e) {
    output(`Unable to load history:\n${e.stack}`, 'error')
    return []
  }
}

// TODO: Detect ansi and pipe into a xterm.js terminal then take snapshot as svg

/* const term = new Terminal();
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal'));

fitAddon.fit()
term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
*/
