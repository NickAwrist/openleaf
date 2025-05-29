import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { AuthService } from './services/authService';
import { PlaidService } from './services/plaidService';
// Configure dotenv to load environment variables
import dotenv from 'dotenv';
import { DBService } from './services/dbService';
import { getAccounts } from './utils/accountUtils';
dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

export let authService: AuthService;
export let plaidService: PlaidService;
export let dbService: DBService;

const createWindow = () => {
    // Create the browser window.

    dbService = new DBService();

    authService = new AuthService();

    plaidService = new PlaidService();
    
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

ipcMain.handle('auth:register', async (event, nickname: string, masterPassword: string) => {
    return authService.register(nickname, masterPassword);
});

ipcMain.handle('auth:getCurrentUser', async (event) => {
    return authService.getCurrentUser();
});

ipcMain.handle('auth:validatePassword', async (event, password: string) => {
    return authService.validatePassword(password);
});

// Plaid IPC handlers
ipcMain.handle('plaid:setup', async (event, password: string, clientId: string, secret: string) => {
    return plaidService.setupAndStorePlaidKeys(password, clientId, secret);
});

ipcMain.handle('plaid:createLinkToken', async (event, clientUserId: string) => {
    return plaidService.createLinkToken(clientUserId);
});

ipcMain.handle('plaid:exchangePublicToken', async (event, password: string, publicToken: string, friendlyName?: string) => {
    return plaidService.exchangePublicToken(password, publicToken, friendlyName);
});

ipcMain.handle('plaid:clearCredentials', async (event) => {
    return plaidService.clearStoredCredentials();
});

ipcMain.handle('plaid:getAccounts', async (event) => {
    const user = authService.getCurrentUser();
    if(!user) {
        return { success: false, error: 'User not found' };
    }
    try {
        const accounts = await getAccounts(user.id);
        return { success: true, accounts };
    } catch (error) {
        return { success: false, error: 'Failed to get accounts' };
    }
});

ipcMain.handle('plaid:getTransactions', async (event, accountId: string) => {
    return dbService.getTransactions(accountId);
});

ipcMain.handle('plaid:syncTransactions', async (event) => {
    return plaidService.syncTransactions();
});

ipcMain.handle('plaid:getPlaidLink', async (event) => {
    return dbService.getPlaidLink(authService.getCurrentUser().id);
});
