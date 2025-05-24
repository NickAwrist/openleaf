import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { AuthService } from './services/authService';
import { PlaidService } from './services/plaid';
import { User } from './types/userTypes';

// Configure dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let authService: any;
let plaidService: PlaidService;

const createWindow = () => {
    // Create the browser window.

    console.log('createWindow');
    authService = new AuthService();
    plaidService = new PlaidService();
    console.log('authService', authService);
    console.log('plaidService', plaidService);

    console.log('PRELOAD PATH: ', path.join(__dirname, '../preload/preload.cjs'));
    
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true,
        trafficLightPosition: { x: 10, y: 10 },
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.cjs'), 
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

ipcMain.handle('auth:login', async (event, nickname: string, masterPassword: string) => {
    return authService.logUserIn(nickname, masterPassword);
});

ipcMain.handle('auth:register', async (event, user: User) => {
    return authService.register(user);
});

ipcMain.handle('auth:getCurrentUser', async (event) => {
    return authService.getCurrentUser();
});

// Plaid IPC handlers
ipcMain.handle('plaid:setup', async (event) => {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const password = process.env.USER_PASSWORD;
    
    if (!clientId || !secret || !password) {
        return { success: false, error: 'Missing environment variables' };
    }
    
    return plaidService.setupAndStorePlaidKeys(password, clientId, secret);
});

ipcMain.handle('plaid:initialize', async (event) => {
    const password = process.env.USER_PASSWORD;
    
    if (!password) {
        return { success: false, error: 'Missing USER_PASSWORD environment variable' };
    }
    
    return plaidService.initializePlaidClientForSession(password);
});

ipcMain.handle('plaid:createLinkToken', async (event, clientUserId: string) => {
    return plaidService.createLinkToken(clientUserId);
});

ipcMain.handle('plaid:exchangePublicToken', async (event, publicToken: string, friendlyName?: string) => {
    const password = process.env.USER_PASSWORD;
    
    if (!password) {
        return { success: false, error: 'Missing USER_PASSWORD environment variable' };
    }
    
    return plaidService.exchangePublicToken(password, publicToken, friendlyName);
});

ipcMain.handle('plaid:clearCredentials', async (event) => {
    return plaidService.clearStoredCredentials();
});

ipcMain.handle('plaid:getAccounts', async (event) => {
    return plaidService.getAccounts();
});

