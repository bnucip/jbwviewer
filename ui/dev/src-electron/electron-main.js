import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import os from "os";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow;

function createWindow() {
  // 隐藏工具栏
  Menu.setApplicationMenu(null);
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-webpack/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 监听打开文件对话框
ipcMain.handle("open-file-dialog", (event) => {
  const window = BrowserWindow.getFocusedWindow();
  const options = {
    title: "Open File",
    properties: ["openFile"],
    filters: [{ name: "Files", extensions: ["txt", "xml"] }],
  };

  return dialog.showOpenDialog(window, options);
});

ipcMain.handle("read-file", (event, filePath) => {
  // console.log(filePath);
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      // console.log(err);
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
});
