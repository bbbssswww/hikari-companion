const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hikari", {
  getState: () => ipcRenderer.invoke("hikari:get-state"),
  saveState: (state) => ipcRenderer.invoke("hikari:save-state", state),
  chat: (payload) => ipcRenderer.invoke("hikari:chat", payload),
  setCompanionMode: (enabled) => ipcRenderer.invoke("hikari:set-companion-mode", enabled),
  minimize: () => ipcRenderer.send("hikari:minimize"),
  close: () => ipcRenderer.send("hikari:close")
});
