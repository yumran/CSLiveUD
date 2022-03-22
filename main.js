// 控制应用生命周期和创建原生浏览器窗口的模组
const electron = require('electron')
const { app, BrowserWindow, Menu, screen, remote, shell} = electron
const path = require('path')
const log = require('electron-log')

// 日志文件等级，默认值：false
log.transports.console.level = 'silly';
// 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
// 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 1048576;

log.info("")
log.info("==========================")
log.info("||      hello world     ||")
log.info("==========================")

let mainWindow;
function createWindow () {

  // 隐藏菜单栏
  Menu.setApplicationMenu(null)

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 630,
    height: 412,
    frame: false, // 设置无边框窗体
    transparent: true, //设置透明度
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  require("@electron/remote/main").initialize(); // 初始化
  require("@electron/remote/main").enable(mainWindow.webContents);
  global.sharedObject = {
    p1:app.getAppPath(),
    p2:app.getName(),
    p3:app.getPath('exe')
  }

  // 加载 index.html
  mainWindow.loadFile('index.html')

  // 打开开发工具
  globalShortcut.register('CommandOrControl+Shift+i', function() {
    mainWindow.webContents.openDevTools()
  })
  // mainWindow.webContents.openDevTools()
  
  // 下载文件的实现
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    const filePath = path.join(app.getPath("downloads"), item.getFilename());
    item.setSavePath(filePath);

    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        if (!item.isPaused()) {
          log.info(item.getFilename(), item.getReceivedBytes(), item.getTotalBytes());
          if (mainWindow.isDestroyed()) {
            return;
          }
          mainWindow.webContents.send('down-process', {
            name: item.getFilename(),
            receive: item.getReceivedBytes(),
            total: item.getTotalBytes(),
          });
          value = parseInt(100 * item.getReceivedBytes() / item.getTotalBytes())
          mainWindow.setProgressBar(value);
        }
      } else if (state === 'interrupted') {
        log.warn("download interrupte")
      }
    });

    item.on('done', (event, state) => {
      if (state === 'completed') {
        log.info("download finish!!")
      } else if (state === 'cancelled') {
        log.warn("download cancelle !! ")
      } else {

      }
    })
  })
}


const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,将会聚焦到myWindow这个窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
    // 打开的窗口，那么程序会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 在这个文件中，你可以包含应用程序剩余的所有部分的代码，
// 也可以拆分成几个文件，然后用 require 导入。

const { ipcMain } = require('electron');
const { globalShortcut } = require('electron/main');

ipcMain.on('download', (event, args) => {
  console.log("112213");
  console.log(mainWindow);
  mainWindow.webContents.downloadURL("http://192.168.16.113:6001/client/ZF_TY_CS_V2-3-7.rar");
});

ipcMain.on('close', (event, args) => {
  if (process.platform !== 'darwin') app.quit()
})