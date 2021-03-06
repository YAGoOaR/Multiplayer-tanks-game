'use strict';

const http = require('http');
const { GameObject } = require('./physics.js');
const { Player, Obstacle } = require('./gameObjects.js');
const { fileExists, sendStaticFile } = require('./serverFunctions.js');
const staticFiles = require('./resources/staticFiles.json');
const gameMap = require('./resources/gameMap.json');

const WebSocket = require('ws');

const PORT = 8000;
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

function serverListener(req, res) {
  const source = req.url !== '/' ? req.url : DEFAULT_SOURCE;
  const sendFile = sendStaticFile.bind(null, res);
  for (const i in staticFiles) {
    if (fileExists(staticFiles[i].paths, source)) {
      sendFile(source, staticFiles[i].contentType);
      break;
    }
  }
}

function createServer() {

  const server = http.createServer(serverListener);

  server.listen(PORT, () => {
    console.log('Listening port ' + PORT);
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

  const gameLoop = () => {
    Player.Controls();
    GameObject.Physics();
    update();
  };

  setInterval(() => {
    gameLoop();
  }, PHYSIS_RATE);

  return { server, ws };
}

module.exports = { createServer };
