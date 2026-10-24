// Show dialog
function showDialog(title, text) {
    document.getElementById('dialog-title').innerText = title;
    document.getElementById('dialog-text').innerHTML = text;
    
    document.querySelector('.overlay.blur').classList.add('active');
    document.getElementById('app-dialog').classList.add('active');
}

// Close dialog
function closeDialog() {
    document.querySelector('.overlay.blur').classList.remove('active');
    document.getElementById('app-dialog').classList.remove('active');
}

document.getElementById('dialog-close-btn').addEventListener('click', closeDialog);
document.querySelector('.overlay.blur').addEventListener('click', closeDialog);


// Button Event Listener
document.getElementById('btn-terminal').addEventListener('click', () => window.electronAPI.runCommand('terminal'));
document.getElementById('btn-terminal-admin').addEventListener('click', () => window.electronAPI.runCommand('terminal-admin'));
document.getElementById('btn-registry').addEventListener('click', () => window.electronAPI.runCommand('registry'));
document.getElementById('btn-delete-apps').addEventListener('click', () => window.electronAPI.runCommand('delete-apps'));
document.getElementById('btn-device-manager').addEventListener('click', () => window.electronAPI.runCommand('device-manager'));
document.getElementById('btn-taskmgr').addEventListener('click', () => window.electronAPI.runCommand('taskmgr'));

document.getElementById('btn-clear-temp').addEventListener('click', async () => {
    const res = await window.electronAPI.runCommand('clear-temp');
    if (res.success) {
        showDialog('Cleanup Complete', res.message);
    } else {
        showDialog('Error', res.error);
    }
});

document.getElementById('btn-clear-recycle').addEventListener('click', async () => {
    const res = await window.electronAPI.runCommand('clear-recycle-bin');
    if (res.success) {
        showDialog('Recycle Bin', res.message);
    } else {
        showDialog('Recycle Bin', res.message);
    }
});

document.getElementById('btn-disk-cleanup').addEventListener('click', () => window.electronAPI.runCommand('disk-cleanup'));

document.getElementById('btn-clear-cache').addEventListener('click', async () => {
    const res = await window.electronAPI.runCommand('clear-browser-cache');
    if (res.success) {
        showDialog('Cache Cleared', res.message);
    } else {
        showDialog('Error', res.error);
    }
});

document.getElementById('btn-show-ip').addEventListener('click', async () => {
    const res = await window.electronAPI.runCommand('show-ip');
    if (res.success) {
        showDialog('IP Addresses', res.ip);
    }
});

document.getElementById('btn-speed-test').addEventListener('click', async () => {
    showDialog(
        'Speed Test', 
        'Measuring internet speed...<br><br>' +
        '<progress class="circle"></progress>'
    );
    
    const res = await window.electronAPI.runCommand('speed-test');
    
    if (res.success) {
        showDialog('Results', res.message);
    } else {
        showDialog('Error', res.error);
    }
});

document.getElementById('exit-btn').addEventListener('click', () => window.electronAPI.runCommand('exit-app'));
document.getElementById('btn-settings').addEventListener('click', () => {
    showDialog('Settings', 'Settings menu view');
});