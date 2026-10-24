const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const https = require('https');

function createWindow() {
  const win = new BrowserWindow({
    width: 620,
    height: 670,
    resizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'logo', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// System-Commands
ipcMain.handle('run-system-command', async (event, command) => {
    const user = os.userInfo().username;
    const homeDir = os.homedir();

    switch (command) {
        case 'terminal':
            exec(`start cmd.exe`, { cwd: homeDir });
            break;
        case 'terminal-admin':
            exec(`powershell Start-Process cmd.exe -Verb RunAs -WorkingDirectory "${homeDir}"`);
            break;
        case 'registry':
            exec(`powershell Start-Process regedit.exe -Verb RunAs`);
            break;
        case 'delete-apps':
            exec(`control appwiz.cpl`);
            break;
        case 'device-manager':
            exec(`devmgmt.msc`);
            break;
        case 'taskmgr':
            exec(`taskmgr`);
            break;
        case 'clear-temp':
            try {
                const userTemp = os.tmpdir();
                const systemTemp = path.join(process.env.SystemRoot || 'C:\\Windows', 'Temp');
                cleanFolder(userTemp);
                cleanFolder(systemTemp);
                return { success: true, message: 'The temporary files have been deleted successfully.' };
            } catch (err) {
                return { success: false, error: err.message };
            }
        case 'clear-recycle-bin':
            return new Promise((resolve) => {
                const checkCmd = 'powershell -Command "(New-Object -ComObject Shell.Application).NameSpace(10).Items().Count"';
                
                exec(checkCmd, (err, stdout) => {
                    const count = parseInt(stdout.trim()) || 0;
                    
                    if (count === 0) {
                        resolve({ success: false, message: 'Your Recycle Bin is already empty.' });
                    } else {
                        exec(`powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"`, () => {
                            resolve({ success: true, message: 'Your Recycle Bin has been cleared successfully.' });
                        });
                    }
                });
            });
        case 'disk-cleanup':
            exec(`cleanmgr`);
            break;
        case 'clear-browser-cache':
            try {
                const browsers = {
                    Chrome: path.join(`C:\\Users\\${user}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache`),
                    Edge: path.join(`C:\\Users\\${user}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache`),
                    Firefox: path.join(`C:\\Users\\${user}\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles`)
                };
                if (fs.existsSync(browsers.Chrome)) cleanFolder(browsers.Chrome);
                if (fs.existsSync(browsers.Edge)) cleanFolder(browsers.Edge);
                if (fs.existsSync(browsers.Firefox)) {
                    const profiles = fs.readdirSync(browsers.Firefox);
                    profiles.forEach(profile => {
                        cleanFolder(path.join(browsers.Firefox, profile, 'cache2'));
                    });
                }
                return { success: true, message: 'Browser cache cleared successfully!' };
            } catch (err) {
                return { success: false, error: err.message };
            }
        case 'show-ip':
            return new Promise((resolve) => {
                let localIp = 'Unknown';
                try {
                    const nets = os.networkInterfaces();
                    for (const name of Object.keys(nets)) {
                        for (const net of nets[name]) {
                            if (net.family === 'IPv4' && !net.internal) localIp = net.address;
                        }
                    }
                } catch (e) {}

                https.get('https://api.ipify.org', (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ success: true, ip: `Local IP: ${localIp}<br>Public IP: ${data}` }));
                }).on('error', () => resolve({ success: true, ip: `Local IP: ${localIp}<br>Public IP: Failed to fetch` }));
            });
        case 'speed-test':
            return new Promise((resolve) => {
                const isPackaged = app.isPackaged;
                const exePath = isPackaged 
                    ? path.join(process.resourcesPath, 'speedtest.exe') 
                    : path.join(__dirname, 'speedtest.exe');

                if (!fs.existsSync(exePath)) {
                    return resolve({ 
                        success: false, 
                        error: 'Speedtest could not be executed. (speedtest.exe is missing in the folder)' 
                    });
                }

                exec(`"${exePath}" --accept-license --accept-gdpr -f json`, (err, stdout) => {
                    if (err) {
                        resolve({ 
                            success: false, 
                            error: 'Speedtest failed. Please check your internet connection.' 
                        });
                    } else {
                        try {
                            const data = JSON.parse(stdout);
                            const downloadMbps = (data.download.bandwidth * 8 / 1_000_000).toFixed(2);
                            const uploadMbps = (data.upload.bandwidth * 8 / 1_000_000).toFixed(2);
                            const ping = data.ping.latency.toFixed(1);

                            resolve({ 
                                success: true, 
                                message: `Ping: ${ping} ms<br>Download: ${downloadMbps} Mbps<br>Upload: ${uploadMbps} Mbps` 
                            });
                        } catch (parseErr) {
                            resolve({ success: false, error: 'Error reading speedtest data.' });
                        }
                    }
                });
            });
        case 'exit-app':
            app.quit();
            break;
    }
    return { success: true };
});

function cleanFolder(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        try {
            if (entry.isDirectory()) {
                cleanFolder(fullPath);
                fs.rmdirSync(fullPath);
            } else {
                fs.unlinkSync(fullPath);
            }
        } catch (e) {}
    });
}