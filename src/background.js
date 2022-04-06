'use strict'

import { app, protocol, BrowserWindow, Menu, Tray, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const Config = require('electron-config')
const config = new Config()

const isDevelopment = process.env.NODE_ENV !== 'production'
const gotTheLock = app.requestSingleInstanceLock()
const isServeMode = () => {
    return process.env.WEBPACK_DEV_SERVER_URL
}

let mainWindow = null

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, stream: true } }
])

async function createWindow() {
    let opts = {
        minWidth: 1000,
        minHeight: 600,
        show: false,
        webPreferences: {
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
        }
    }
    Object.assign(opts, config.get('winBounds'))

    mainWindow = new BrowserWindow(opts)
    mainWindow.removeMenu()

    mainWindow.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
    });

    ipcMain.on('show-current-window', showCurrentWindow);
    ipcMain.on('is-windows-visible', isWindowsVisible);
    ipcMain.on('get-app-path', getAppPath);

    mainWindow.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            config.set('winBounds', mainWindow.getBounds());
            mainWindow.hide();
        }

        return false;
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
        createProtocol('app')
        mainWindow.loadURL('app://./index.html')
    }
}

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show();
            setTimeout(hideSplashScreen, 5000);
        } else {
            createWindow();
        }
    })
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    let tray = null
    const path = require('path')

    app.on('ready', async () => {
        var iconPath;
        console.log(process.platform);
        if (process.platform === "win32") {
            app.setAppUserModelId("WeekToDo");
            iconPath = path.join(__dirname, "/weektodo-white.ico");
        } else {
            iconPath = isServeMode()
                ? path.join(__dirname, "/bundled/WeekToDo-icon-white-128.png")
                : path.join(__dirname, "/WeekToDo-icon-white-128.png")
        }
        tray = new Tray(iconPath);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open', click() {
                    mainWindow.show();
                    setTimeout(hideSplashScreen, 5000);
                }
            },
            {
                label: 'Quit', click() {
                    app.isQuiting = true;
                    config.set('winBounds', mainWindow.getBounds());
                    app.quit();
                }
            }
        ])
        tray.setToolTip('WeekToDo Planner')
        tray.setContextMenu(contextMenu)
        tray.on('click', () => {
            tray.popUpContextMenu();
        })
        createWindow();

        if (isDevelopment && !process.env.IS_TEST) {
            try {
                await installExtension(VUEJS_DEVTOOLS)
            } catch (e) {
                console.error('Vue Devtools failed to install:', e.toString())
            }
        }
    })

    if (isDevelopment) {
        if (process.platform === 'win32') {
            process.on('message', (data) => {
                if (data === 'graceful-exit') {
                    app.quit()
                }
            })
        } else {
            process.on('SIGTERM', () => {
                app.quit()
            })
        }
    }
}

function hideSplashScreen() {
    mainWindow.webContents.executeJavaScript("if(document.getElementById('splashScreen')) document.getElementById('splashScreen').classList.add('hiddenSplashScreen');")
}

function showCurrentWindow(event) {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.show();
}


function isWindowsVisible(event) {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    event.returnValue = win.isVisible();
}

function getAppPath(event) {
    event.returnValue = app.getPath('exe');
}


