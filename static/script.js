'use strict';

const FRAME_RATE = 1000 / 60;
const SEND_RATE = 1000 / 20;
const DEFAULT_TIMEOUT = 2000;
const playerSize = {
  x: 0,
  y: 0
};
const playerTopSize = {
  x: 0,
  y: 0
};

const socket = new WebSocket('ws://127.0.0.1:8000/');
const log = document.getElementById('log');
const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');
const canvasPos = Utils.getElementPos(cvs);

const timers = [];
const keys = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
const keysDown = [false, false, false, false];
const mousePos = { x: 0, y: 0 };

const promises = [];

let socketActive = false;
let serverData = {};

const player = {
  playerId: 0,
  rotation: 0,
  heading: 0,
  controls: { x : 0, y: 0 }
}

const writeLine = (parent, text) => {
  const line = document.createElement('div');
  line.innerHTML = `<p>${text}</p>`;
  parent.appendChild(line);
};

function sendDataToServer(socket, data){
  socket.send(JSON.stringify(data));
}

function updateControls(){
  player.controls.x = keysDown[3] - keysDown[2];
  player.controls.y = keysDown[0] - keysDown[1];
}

function createImage(src){
  const image = new Image();
  image.src = src;
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('File not found');
    }, 2000);
    image.onload = () => {
      resolve();
    }
  });
  promises.push(promise);
  return image;
}

function createTimeoutPromise(time){
  let onResolve;
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('Connection timeout');
    }, time);
    onResolve = resolve;
  });
  promises.push(promise);
  return onResolve;
}

const playerImage = createImage('img/player.png');
const curPlayerImage = createImage('img/currentPlayer.png');
const playerTopImage = createImage('img/playerTop.png');
const setupResolve = createTimeoutPromise(DEFAULT_TIMEOUT);

Promise.all(promises)
.then(main)
.catch(() => {
  console.error('File load error');
});

const gameFunction = () => {
  const time = Date.now();
  const deltaTime = (time - serverData.time) / 1000;
  updateMouseControls();
  CanvasFunctions.clearCanvas(ctx, cvs);
  for(const p of serverData.players){
    if(!p) continue;
    const cvsSize = { x: cvs.width, y: cvs.height };
    const pos = MathUtils.addVectors(p.position, MathUtils.multiplyVector(p.velocity, deltaTime)) ;
    MathUtils.clampVector(pos, cvsSize);

    if(p.playerId === player.playerId) {
      CanvasFunctions.drawRotatedImage(ctx, curPlayerImage, pos, p.rotation, playerSize);
      CanvasFunctions.drawRotatedImage(ctx, playerTopImage, pos, player.heading, playerTopSize);
    }
    else {
      CanvasFunctions.drawRotatedImage(ctx, playerImage, pos, p.rotation, playerSize);
      CanvasFunctions.drawRotatedImage(ctx, playerTopImage, pos, p.heading, playerTopSize);
    }
  }
};

function main(){
  setListeners();

  timers.push(
    setInterval(gameFunction, FRAME_RATE)
  );

  const sendToServerTimer = setInterval(() => {
    if(!socketActive) return;
    sendDataToServer(socket, {
      event: 'clientInput',
      data: player
    });
  }, SEND_RATE);

  timers.push(sendToServerTimer);
}

socket.onopen = () => {
  writeLine(log, 'connected');
  socketActive = true;
};

socket.onclose = () => {
  writeLine(log, 'disconnected');
  socketActive = false;
  CanvasFunctions.clearCanvas(ctx, cvs);
  for(const t of timers){
    clearInterval(t);
  }
};

socket.onmessage = message => {
  const messageData = JSON.parse(message.data);
  const data = messageData.data;
  if(messageData.event === 'textMessage'){
    writeLine(log, messageData.data);
  }
  if(messageData.event === 'UpdatePlayers'){
    serverData = data;
  }
  if(messageData.event === 'setClient'){
    setupResolve();
    player.playerId = data.playerId;
    cvs.width = data.gameFieldSize.x;
    cvs.height = data.gameFieldSize.y;
    MathUtils.CopyVector(playerSize, data.playerSize);
    MathUtils.CopyVector(playerTopSize, data.playerTopSize);
    writeLine(log, 'Logged as Player' + messageData.data.playerId);
  }
};

function updateMouseControls(){
  const mousePosOnCvs = {
    x: mousePos.x - canvasPos.x,
    y: mousePos.y - canvasPos.y
  };
  const vector = {
    x: mousePosOnCvs.x - serverData.players[player.playerId].position.x,
    y: mousePosOnCvs.y - serverData.players[player.playerId].position.y
  }
  player.heading = Math.acos(vector.x / MathUtils.vectorLength(vector)) * Math.sign(vector.y);
}

function setListeners() {
    document.addEventListener('keydown', event => {
      for(const i in keys){
        if (event.code === keys[i]) {
          keysDown[i] = true;
          updateControls();
        }
      }
    });
    document.addEventListener('keyup', event => {
      for(const i in keys){
        if (event.code === keys[i]) {
          keysDown[i] = false;
          updateControls();
        }
      }
    });
  document.addEventListener('keydown', event => {
    if (event.code === 'KeyR') {
      socket.close();
    }
  });
}

document.onmousemove = (e) => {
  const mousePosition = Utils.getMousePos(e);
  mousePos.x = mousePosition.x;
  mousePos.y = mousePosition.y;
};
