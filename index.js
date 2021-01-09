'use strict';

const fs = require('fs');
const http = require('http');
const { GameObject } = require('./src/physics.js');
const { Player, Obstacle } = require('./src/gameObjects.js');
const { fileExists, sendStaticFile } = require('./src/serverFunctions.js');
const staticFiles = require('./resources/staticFiles.json');
const gameMap = require('./resources/gameMap.json');

const WebSocket = require('ws');

const index = fs.readFileSync('./static/index.html', 'utf8');

const PHYSIS_RATE = 1000 / 30;

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
      textures: staticFiles.imageFiles,
      bgTextureId: 3,
    }
  }));
}

const server = http.createServer((req, res) => {
  const source = req.url;
  if (fileExists(staticFiles.imageFiles, source)) {
    sendStaticFile(source, res);
  } else if (fileExists(staticFiles.jsFiles, source)) {
    sendStaticFile(source, res, 'text/javascript');
  } else {
    res.writeHead(200);
    res.end(index);
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

ws.on('connection', clientSocket => {
  updateClients(ws.clients, dataToSend);
  onConnection(clientSocket);
});

Obstacle.mapSetup(gameMap.obstacles);

setInterval(() => {
  gameLoop();
}, PHYSIS_RATE);

function gameLoop() {
  Player.Controls();
  GameObject.Physics();
  updateClients(ws.clients, dataToSend);
}
