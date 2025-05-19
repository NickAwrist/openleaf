// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose window control methods to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control functions
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  // Add title bar color control
  updateTitleBarColor: (color: string, darkMode: boolean) => 
    ipcRenderer.send('update-titlebar-color', color, darkMode),
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
