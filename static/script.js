
import { VectorUtils } from './mathUtils.js';
import { getElementPos, setControlListeners } from './utils.js';
import { clearCanvas, drawRotatedImage } from './canvasFunctions.js';
import { writeLine, createLoadingLog } from './clientLogger.js';
import { createTimeoutPromise, loadImages } from './asyncFunctions.js';

const FRAME_RATE = 1000 / 60;
const SEND_RATE = 1000 / 20;
const SETTINGS_REQUEST = '/settings.json';
const SETUP_FAIL_MESSAGE = 'Client setup failed!';
const TIMEOUT_MESSAGE = 'Connection timeout!';
const LOAD_ERROR_MESSAGE = 'Failed to load!';

const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');
const canvasPos = getElementPos(cvs);
const log = document.getElementById('log');
const gameLog = writeLine.bind(null, log);

const mousePos = VectorUtils.EmptyVector;
const player = {
  playerId: 0,
  position: VectorUtils.EmptyVector,
  rotation: 0,
  heading: 0,
  controls: VectorUtils.EmptyVector,
  LBDown: false,
};
const timers = [];
const textures = [];

let socketActive = false;
let serverData = {};
let previousTime = Date.now();
let setupData = {};

function sendDataToServer(socket, data) {
  socket.send(JSON.stringify(data));
}

const onClick = () => {
  player.LBDown = true;
};

const onKeyboard = movement => {
  VectorUtils.CopyVector(player.controls, movement);
};

const onMouseMove = newPos => {
  VectorUtils.CopyVector(mousePos, newPos);
};

const connectionString = connection => `ws://${connection.ip}:${connection.port}/`;

function onSetupData(data) {
  setupData = data;
  player.playerId = data.playerId;
  cvs.width = data.gameFieldSize.x;
  cvs.height = data.gameFieldSize.y;
}

let socket;
let onSetupResolve;
const responcePromise = fetch(SETTINGS_REQUEST);

responcePromise
  .then(data => {
    const dataPromise = data.json();
    return dataPromise;
  })
  .catch(() => {
    console.error(SETUP_FAIL_MESSAGE);
  })
  .then((data => {
    socket = new WebSocket(connectionString(data.connection));
    socket.onopen = onSocketOpen;
    socket.onclose = onSocketClose;
    socket.onmessage = onSocketMessage;

    const setup = createTimeoutPromise();
    onSetupResolve = setup.resolveCallback;
    return setup.promise;
  }))
  .catch(() => {
    console.error(TIMEOUT_MESSAGE);
  })
  .then(data => {
    onSetupData(data);

    const paths = data.textures;
    const imageCount = paths.length;
    const { onDataLoad } = createLoadingLog(log, imageCount);
    const promises = loadImages(textures, paths, onDataLoad);
    return Promise.all(promises);
  })
  .catch(() => {
    console.error(LOAD_ERROR_MESSAGE);
  })
  .then(() => {
    gameLog('Server data loaded');
    gameLog('Game started!');
    main();
  })
  .catch(err => {
    console.error(err);
  });

const gameFunction = () => {
  updateHeading();
  const time = Date.now();
  const deltaTime = (time - previousTime) / 1000;
  ctx.drawImage(textures[setupData.bgTextureId], 0, 0, cvs.width, cvs.height);
  for (const obj of serverData.objects) {
    const cvsSize = { x: cvs.width, y: cvs.height };
    const movement = VectorUtils.multiplyVector(obj.velocity, deltaTime);
    const pos = VectorUtils.addVectors(obj.position, movement);
    const rotation = obj.rotation;

    const draw = drawRotatedImage.bind(null, ctx, pos);

    if (obj.objType === 'player') {
      VectorUtils.clampVector(pos, cvsSize);
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

  setControlListeners(onKeyboard, onMouseMove, onClick);

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

function onSocketOpen() {
  gameLog('Welcome to Multiplayer tanks game!');
  gameLog('The game is made by YAGoOaR');
  gameLog('Connected to server');
  socketActive = true;
}

function onSocketClose() {
  gameLog('Disconnected');
  socketActive = false;
  clearCanvas(ctx, cvs);
  for (const t of timers) {
    clearInterval(t);
  }
}

function onSocketMessage(message) {
  const messageData = JSON.parse(message.data);
  const data = messageData.data;
  if (messageData.event === 'textMessage') {
    gameLog(messageData.data);
  }
  if (messageData.event === 'UpdatePlayers') {
    previousTime = Date.now();
    serverData = data;
  }
  if (messageData.event === 'setClient') {
    onSetupResolve(data);
    gameLog('Logged as Player' + messageData.data.playerId);
  }
}

function updateHeading() {
  const mousePosOnCvs = VectorUtils.subtractVectors(mousePos, canvasPos);
  const position = player.position;
  const headingVector = VectorUtils.subtractVectors(mousePosOnCvs, position);
  player.heading = VectorUtils.vectorAngle(headingVector);
}

document.addEventListener('keydown', event => {
  if (event.code === 'KeyR') {
    socket.close();
  }
});
