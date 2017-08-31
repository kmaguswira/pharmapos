const {remote} = require('electron');

let closeWindow = () =>{
  let window = remote.getCurrentWindow();
  window.close();
};

document.getElementById('close-window').addEventListener('click', closeWindow);
