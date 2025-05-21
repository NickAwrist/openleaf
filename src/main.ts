import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { AuthService } from './services/authService';
import { User } from './types/userTypes';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let authService: any;

const createWindow = () => {
    // Create the browser window.

    console.log('createWindow');
    authService = new AuthService();
    console.log('authService', authService);

    
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true,
        trafficLightPosition: { x: 10, y: 10 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'), 
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/index.html`));
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Set up IPC handlers for window control
    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    ipcMain.handle('is-window-maximized', () => {
        return mainWindow.isMaximized();
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('auth:login', async (event, id: string, masterPassword: string) => {
    return authService.logUserIn(id, masterPassword);
});

ipcMain.handle('auth:isLoggedIn', async (event) => {
    return authService.isLoggedIn();
});

ipcMain.handle('auth:register', async (event, user: User) => {
    return authService.register(user);
});