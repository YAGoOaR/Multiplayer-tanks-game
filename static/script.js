
import { MathUtils } from './mathUtils.js';
import { getElementPos,  getMousePos } from './utils.js';
import { clearCanvas, drawRotatedImage } from './canvasFunctions.js';

const FRAME_RATE = 1000 / 60;
const SEND_RATE = 1000 / 20;
const DEFAULT_TIMEOUT = 2000;

const socket = new WebSocket('ws://127.0.0.1:8000/');
const log = document.getElementById('log');
const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');
const canvasPos = getElementPos(cvs);

const timers = [];
const keys = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
const keysDown = [false, false, false, false];
const mousePos = { x: 0, y: 0 };

const promises = [];

let socketActive = false;
let serverData = {};
let texturePaths = [];
let bgTextureId = -1;
const textures = [];

const player = {
  playerId: 0,
  position: { x: 0, y: 0 },
  rotation: 0,
  heading: 0,
  controls: { x: 0, y: 0 },
  LBDown: false,
};

const writeLine = (parent, text) => {
  const line = document.createElement('div');
  line.innerHTML = `<p>${text}</p>`;
  parent.appendChild(line);
};

function sendDataToServer(socket, data) {
  socket.send(JSON.stringify(data));
}

function updateControls() {
  player.controls.x = keysDown[3] - keysDown[2];
  player.controls.y = keysDown[0] - keysDown[1];
}

function createImage(src) {
  const image = new Image();
  image.src = src;
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('File not found');
    }, 2000);
    image.onload = () => {
      resolve();
    };
  });
  promises.push(promise);
  return image;
}

function createTimeoutPromise(time) {
  let onResolve;
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('Connection timeout');
    }, time);
    onResolve = resolve;
  });
  return { onResolve, promise };
}

const setup = createTimeoutPromise(DEFAULT_TIMEOUT);

const textureSetup = () => {
  for (const path of texturePaths) {
    const texture = createImage(path);
    textures.push(texture);
  }
};

setup.promise.then(textureSetup);

Promise.all(promises)
  .then(main)
  .catch(() => {
    console.error('File load error');
  });

const gameFunction = () => {
  const time = Date.now();
  const deltaTime = (time - serverData.time) / 1000;
  updateMouseControls();
  ctx.drawImage(textures[bgTextureId], 0, 0, cvs.width, cvs.height);
  for (const obj of serverData.objects) {
    const cvsSize = { x: cvs.width, y: cvs.height };
    const movement = MathUtils.multiplyVector(obj.velocity, deltaTime);
    const pos = MathUtils.addVectors(obj.position, movement);
    const rotation = obj.rotation;

    const draw = drawRotatedImage.bind(null, ctx, pos);

    if (obj.objType === 'player') {
      MathUtils.clampVector(pos, cvsSize);
      if (obj.playerId === player.playerId) {
        player.position = obj.position;
        draw(textures[obj.alternativeTextureId], rotation, obj.textureSize);
        draw(textures[obj.topTextureId], player.heading, obj.topTextureSize);
      } else {
        draw(textures[obj.textureId], rotation, obj.textureSize);
        draw(textures[obj.topTextureId], obj.heading, obj.topTextureSize);
      }
    } else if (obj.objType === 'bullet') {
      draw(textures[obj.textureId], obj.heading, obj.textureSize);
    }
  }
};

function main() {
  setListeners();

  timers.push(
    setInterval(gameFunction, FRAME_RATE)
  );

  const sendToServerTimer = setInterval(() => {
    if (!socketActive) return;
    sendDataToServer(socket, {
      event: 'clientInput',
      data: player
    });
    player.LBDown = false;
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
  clearCanvas(ctx, cvs);
  for (const t of timers) {
    clearInterval(t);
  }
};

socket.onmessage = message => {
  const messageData = JSON.parse(message.data);
  const data = messageData.data;
  if (messageData.event === 'textMessage') {
    writeLine(log, messageData.data);
  }
  if (messageData.event === 'UpdatePlayers') {
    serverData = data;
  }
  if (messageData.event === 'setClient') {
    texturePaths = data.textures;
    bgTextureId = data.bgTextureId;
    player.playerId = data.playerId;
    writeLine(log, data.playerId);
    cvs.width = data.gameFieldSize.x;
    cvs.height = data.gameFieldSize.y;
    setup.onResolve();
    writeLine(log, 'Logged as Player' + messageData.data.playerId);
  }
};

function updateMouseControls() {
  const mousePosOnCvs = {
    x: mousePos.x - canvasPos.x,
    y: mousePos.y - canvasPos.y
  };
  const position = player.position;
  const headingVector = MathUtils.subtractVectors(mousePosOnCvs, position);
  player.heading = MathUtils.vectorAngle(headingVector);
}

function setListeners() {
  const events = ['keyup', 'keydown'];
  for (let j = 0; j <= 1; j++) {
    document.addEventListener(events[j], event => {
      for (const i in keys) {
        if (event.code === keys[i]) {
          keysDown[i] = j;
          updateControls();
        }
      }
    });
  }
  document.addEventListener('keydown', event => {
    if (event.code === 'KeyR') {
      socket.close();
    }
  });
  document.addEventListener('mousedown', event => {
    if (event.which === 1) {
      player.LBDown = true;
    }
  });
}

document.onmousemove = e => {
  const mousePosition = getMousePos(e);
  mousePos.x = mousePosition.x;
  mousePos.y = mousePosition.y;
};
