'use strict'

const {app, BrowserWindow} = require('electron');
const url = require('url');

require('electron-reload')(__dirname);

let win = null;
let boot = () => {
  win = new BrowserWindow({
    width:960,
    height:540,
    frame:false,
    resizable:false
  });
  win.loadURL(`file://${__dirname}/index.html`);
  win.webContents.openDevTools();
};

app.on('ready', boot);
