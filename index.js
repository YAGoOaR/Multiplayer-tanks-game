'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { GameObject } = require('./src/physics.js');
const { Player } = require('./src/gameObjects.js');
const staticFiles = require('./resources/staticFiles.json');

const WebSocket = require('ws');

const index = fs.readFileSync('./static/index.html', 'utf8');

const PHYSIS_RATE = 1000 / 30;

const fileExists = (arr, dir) => arr.indexOf(dir) !== -1;

const sendStaticFile = (source, res, contentType = '') => {
  const pathToFile = path.resolve(__dirname, `./static${source}`);
  fs.readFile(
    pathToFile,
    (err, file) => {
      if (err) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      res.setHeader('Content-Type', contentType);
      res.end(file);
    }
  );
};

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

ws.on('connection', clientSocket => {
  const userId = Player.count;
  new Player();

  console.log(`Connected Player${userId}`);
  updateClients();

  clientSocket.on('message', message => {
    const msg = JSON.parse(message);
    if (msg.event === 'clientInput') {
      const playerId = msg.data.playerId;
      if (userId !== playerId) return;
      Player.Input(msg.data);
    }
  });
  clientSocket.on('close', () => {
    console.log(`Disconnected Player${userId}`);
    Player.RemovePlayer(userId);
  });
  clientSocket.send(JSON.stringify({
    event: 'setClient', data: {
      playerId: userId,
      gameFieldSize: GameObject.gameField,
      textures: staticFiles.imageFiles,
      bgTextureId: 3,
    }
  }));
});

setInterval(() => {
  physics();
}, PHYSIS_RATE);

function updateClients() {
  for (const client of ws.clients) {
    const data = {
      event: 'UpdatePlayers',
      data: {
        time: GameObject.prevTime,
        objects: GameObject.objects,
      }
    };
    client.send(JSON.stringify(data));
  }
}

function physics() {
  Player.Controls();
  GameObject.Physics();
  updateClients();
}
