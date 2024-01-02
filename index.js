const { app, BrowserWindow } = require('electron')

let win

function createWindow () {
  // Create browser window with given height and width
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  })

  // Load the index.html file
  win.loadFile('index.html')
}

app.on('ready', createWindow)
