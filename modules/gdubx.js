const {
  app,
  dialog,
  ipcMain
} = require('electron');
const child_process = require('child_process');
const appRoot = require('app-root-path');
const path = require('path');
const fs = require('fs');
const os = require('os');


class Gdubx {
  constructor() {
    this.isRunning = false;
    this.dubxProcess = null;
    this.logGdubxEvents = false;
    // create the user data dir (needed for MacOS)
    if (!fs.existsSync(app.getPath('userData'))) {
      fs.mkdirSync(app.getPath('userData'));
    }
    if (this.logGdubxEvents) {
      this.logStream = fs.createWriteStream(path.join(app.getPath("userData"), "gethlog.txt"), {
        flags: "a"
      });
    }

    if (appRoot.path.indexOf('app.asar') > -1) {
      this.rootPath = path.dirname(appRoot.path);
    } else {
      this.rootPath = appRoot.path;
    }

    switch (os.type()) {
      case "Linux":
        this.binaries = path.join(this.rootPath, 'bin', 'linux');
        break;
      case "Darwin":
        this.binaries = path.join(this.rootPath, 'bin', 'macos');
        break;
      case "Windows_NT":
        this.binaries = path.join(this.rootPath, 'bin', 'win');
        break;
      default:
        this.binaries = path.join(this.rootPath, 'bin', 'win');
    }


  }

  _writeLog(text) {
    if (this.logGdubxEvents) {
      this.logStream.write(text);
    }
  }

  startGdubx() {
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gdubxPath = path.join(this.binaries, 'gdubx');
      this.gdubxProcess = child_process.spawn(gdubxPath, ['--ws', '--wsorigins', '*', '--wsaddr', '127.0.0.1', '--wsport', '4950', '--wsapi', 'admin,db,eth,net,miner,personal,web3']);

      if (!this.gdubxProcess) {
        dialog.showErrorBox("Error starting application", "gdubx failed to start!");
        app.quit();
      } else {
        this.gdubxProcess.on('error', function (err) {
          dialog.showErrorBox("Error starting application", "gdubx failed to start!");
          app.quit();
        });
        this.gdubxProcess.on("close", function (err) {
          if (this.isRunning) {
            dialog.showErrorBox("Error running the node", "The node stoped working. Wallet will close!");
            app.quit();
          }
        });
        this.gdubxProcess.stderr.on('data', function (data) {
          DUBXGdubx._writeLog(data.toString() + '\n');
        });
        this.gdubxProcess.stdout.on('data', function (data) {
          DUBXGdubx._writeLog(data.toString() + '\n');
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error starting application", err.message);
      app.quit();
    }
  }

  stopGdubx() {
    // if (os.type() == "Windows_NT") {
    //   const gdubxWrapePath = path.join(this.binaries, 'WrapGdubx.exe');
    //   child_process.spawnSync(gdubxWrapePath, [this.gdubxProcess.pid]);
    // } else {
    //   this.gdubxProcess.kill('SIGTERM');
    // }
    this.gdubxProcess.kill('SIGTERM');
  }
}

ipcMain.on('stopGdubx', (event, arg) => {
  DUBXGdubx.stopGdubx();
});

DUBXGdubx = new Gdubx();