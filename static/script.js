
import { MathUtils } from './mathUtils.js';
import { getElementPos,  getMousePos } from './utils.js';
import { clearCanvas, drawRotatedImage } from './canvasFunctions.js';
import { writeLine, createLoadingLog } from './clientLogger.js';
import { createTimeoutPromise, loadImages } from './asyncFunctions.js';

const FRAME_RATE = 1000 / 60;
const SEND_RATE = 1000 / 20;
const TIMEOUT_MESSAGE = 'Connection timeout!';
const LOAD_ERROR_MESSAGE = 'Failed to load!';

const socket = new WebSocket('ws://127.0.0.1:8000/');
const log = document.getElementById('log');
const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');
const canvasPos = getElementPos(cvs);

const timers = [];
const mousePos = { x: 0, y: 0 };

let socketActive = false;
let serverData = {};
let texturePaths = [];
let bgTextureId = -1;
let previousTime = Date.now();
const textures = [];

const player = {
  playerId: 0,
  position: { x: 0, y: 0 },
  rotation: 0,
  heading: 0,
  controls: { x: 0, y: 0 },
  LBDown: false,
};

function sendDataToServer(socket, data) {
  socket.send(JSON.stringify(data));
}

const setup = createTimeoutPromise(TIMEOUT_MESSAGE);

setup.promise
  .then(() => {
    const imageCount = texturePaths.length;
    const { onDataLoad } = createLoadingLog(log, imageCount);
    const promises = loadImages(textures, texturePaths, onDataLoad);

    Promise.all(promises).then(() => {
      writeLine(log, 'Server data loaded');
      main();
    })
      .catch(() => {
        console.error(LOAD_ERROR_MESSAGE);
      });

  })
  .catch(() => {
    console.error(TIMEOUT_MESSAGE);
  });

const gameFunction = () => {
  const time = Date.now();
  const deltaTime = (time - previousTime) / 1000;
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
    } else {
      draw(textures[obj.textureId], obj.heading, obj.textureSize);
    }
  }
};

function main() {
  setControlListeners();

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
    previousTime = Date.now();
    serverData = data;
  }
  if (messageData.event === 'setClient') {
    texturePaths = data.textures;
    bgTextureId = data.bgTextureId;
    player.playerId = data.playerId;
    cvs.width = data.gameFieldSize.x;
    cvs.height = data.gameFieldSize.y;
    setup.resolveCallback();
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

function setControlListeners() {
  const keys = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
  const keysDown = [false, false, false, false];
  const events = ['keyup', 'keydown'];

  const updateControls = () => {
    player.controls.x = keysDown[3] - keysDown[2];
    player.controls.y = keysDown[0] - keysDown[1];
  };

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

  document.onmousemove = e => {
    MathUtils.CopyVector(mousePos, getMousePos(e));
  };
}
