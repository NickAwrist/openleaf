import { contextBridge, ipcRenderer } from 'electron';
import type { User } from './types/userTypes';

// This is a modified preload script with added comment
// Expose window control methods to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Window control functions
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),

    // Auth functions
    login: (nickname: string, masterPassword: string) => ipcRenderer.invoke('auth:login', nickname, masterPassword),
    register: (nickname: string, masterPassword: string) => ipcRenderer.invoke('auth:register', nickname, masterPassword),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    validatePassword: (password: string) => ipcRenderer.invoke('auth:validatePassword', password),

    // Plaid functions
    plaidSetup: (password: string, clientId: string, secret: string) => ipcRenderer.invoke('plaid:setup', password, clientId, secret),
    plaidCreateLinkToken: (clientUserId: string) => ipcRenderer.invoke('plaid:createLinkToken', clientUserId),
    plaidExchangePublicToken: (publicToken: string, friendlyName?: string) => ipcRenderer.invoke('plaid:exchangePublicToken', publicToken, friendlyName),
    plaidClearCredentials: () => ipcRenderer.invoke('plaid:clearCredentials'),
    plaidGetAccounts: () => ipcRenderer.invoke('plaid:getAccounts'),
    plaidGetTransactions: (accountId: string) => ipcRenderer.invoke('plaid:getTransactions', accountId),
    plaidSyncTransactions: () => ipcRenderer.invoke('plaid:syncTransactions'),
    plaidGetPlaidLinks: () => ipcRenderer.invoke('plaid:getPlaidLinks'),
});

// Basic preload debug
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    // Add a simple debug text to check if preload is running
    const debugElement = document.createElement('div');
    debugElement.textContent = 'Preload script loaded';
    debugElement.style.position = 'fixed';
    debugElement.style.bottom = '10px';
    debugElement.style.right = '10px';
    debugElement.style.background = 'rgba(0,0,0,0.1)';
    debugElement.style.padding = '5px';
    debugElement.style.zIndex = '9999';
    document.body.appendChild(debugElement);
});
