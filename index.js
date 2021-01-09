'use strict';

const http = require('http');
const { GameObject } = require('./src/physics.js');
const { Player, Obstacle } = require('./src/gameObjects.js');
const { fileExists, sendStaticFile } = require('./src/serverFunctions.js');
const staticFiles = require('./resources/staticFiles.json');
const gameMap = require('./resources/gameMap.json');

const WebSocket = require('ws');

const PHYSIS_RATE = 1000 / 30;
const DEFAULT_SOURCE = '/index.html';

function updateClients(clients, data) {
  for (const client of clients) {
    const message = {
      event: 'UpdatePlayers',
      data
    };
    client.send(JSON.stringify(message));
  }
}

function onPlayerMessage(userId, message) {
  const msg = JSON.parse(message);
  if (msg.event === 'clientInput') {
    msg.data.playerId = userId;
    Player.Input(msg.data);
  }
}

function onPlayerDisconnect(userId) {
  console.log(`Disconnected Player${userId}`);
  Player.RemovePlayer(userId);
}

function onConnection(clientSocket) {
  const userId = Player.count;
  Player.CreatePlayer();

  console.log(`Connected Player${userId}`);

  const onMessage = onPlayerMessage.bind(null, userId);
  const onClose = onPlayerDisconnect.bind(null, userId);

  clientSocket.on('message', onMessage);
  clientSocket.on('close', onClose);

  clientSocket.send(JSON.stringify({
    event: 'setClient', data: {
      playerId: userId,
      gameFieldSize: GameObject.gameField,
      textures: staticFiles.imageFiles.paths,
      bgTextureId: 3,
    }
  }));
}

const server = http.createServer((req, res) => {
  const source = req.url !== '/' ? req.url : DEFAULT_SOURCE;
  const sendFile = sendStaticFile.bind(null, res);
  for (const i in staticFiles) {
    if (fileExists(staticFiles[i].paths, source)) {
      sendFile(source, staticFiles[i].contentType);
      break;
    }
  }
});

server.listen(8000, () => {
  console.log('Listen port 8000');
});

const ws = new WebSocket.Server({ server });

const dataToSend = {
  time: GameObject.prevTime,
  objects: GameObject.objects,
};

const update = updateClients.bind(null, ws.clients, dataToSend);

ws.on('connection', clientSocket => {
  update();
  onConnection(clientSocket);
});

Obstacle.mapSetup(gameMap.obstacles);

setInterval(() => {
  gameLoop();
}, PHYSIS_RATE);

function gameLoop() {
  Player.Controls();
  GameObject.Physics();
  update();
}
