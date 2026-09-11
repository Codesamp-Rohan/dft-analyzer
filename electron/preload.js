import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dftApi', {
  openExcelFile: () => ipcRenderer.invoke('dialog:openExcelFile'),
});
