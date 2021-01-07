'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { Vector2, GameObject } = require('./src/physics.js');
const WebSocket = require('ws');

const index = fs.readFileSync('./static/index.html', 'utf8');

const TURN_SENSITIVITY = 2;
const MOVE_SENSITIVITY = 100;
const PHYSIS_RATE = 1000 / 30;
const GAME_FIELD_SIZEX = 500;
const GAME_FIELD_SIZEY = 500;
const PLAYER_SIZE_X = 40;
const PLAYER_SIZE_Y = 30;
const PLAYERTOP_SIZE_X = 60;
const PLAYERTOP_SIZE_Y = 30;
const BULLET_SIZE_X = 10;
const BULLET_SIZE_Y = 5;
const BULLET_SPEED = 500;
const SHOOTING_OFFSET = 18;
const SPAWN_DISTANCE = 120;
const gameField = new Vector2(GAME_FIELD_SIZEX, GAME_FIELD_SIZEY);
GameObject.field = gameField;

const imageFiles  = [
  '/img/player.png',
  '/img/currentPlayer.png',
  '/img/playerTop.png',
  '/img/background.png',
  '/img/bullet.png',
];
const jsFiles  = [
  '/script.js',
  '/utils.js',
  '/canvasFunctions.js',
  '/mathUtils.js',
];
const fileExists = (arr, dir) => arr.indexOf(dir) !== -1;

function getNewPlayerPos(playersNumber) {
  let acc = 0;
  for (let i = 0; i < playersNumber; i++) {
    const j = i % 2;
    if (j) {
      acc += Math.PI / 2 / i;
    }
    console.log(j);
    acc += Math.PI;
  }
  const spawnVector = (Vector2.makeFromAngle(-Math.PI / 2 + acc));
  return spawnVector.multiply(SPAWN_DISTANCE).add(gameField.divide(2));
}

const sendStaticFile = (source, res, contentType = '') => {
  const pathToFile = path.resolve(__dirname, `./static${source}`);
  console.log(`loading ${pathToFile}`);
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
  console.log(`request: ${source}`);
  if (fileExists(imageFiles, source)) {
    sendStaticFile(source, res);
  } else if (fileExists(jsFiles, source)) {
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

let counter = 0;
const players = [];
const bullets = [];

ws.on('connection', (clientSocket, req) => {
  const ip = req.socket.remoteAddress;
  const userId = counter;

  const player = {
    playerId: counter,
    gameObject: new GameObject(),
    controls: new Vector2(0, 0),
    heading: 0,
  };

  player.gameObject.position = getNewPlayerPos(counter);

  players[counter] = player;

  console.log(`Connected ${ip}`);
  updateClients();

  clientSocket.on('message', message => {
    const msg = JSON.parse(message);
    if (msg.event === 'clientInput') {
      const playerId = msg.data.playerId;
      if (playerId >= 0 && playerId < counter) {
        const controls = msg.data.controls;
        players[playerId].controls.Set(controls.x, controls.y);
        players[playerId].heading = msg.data.heading;
        if (msg.data.LBDown === true) {
          const bullet = new GameObject();
          const headingVector = Vector2.makeFromAngle(msg.data.heading);
          bullet.velocity = headingVector.multiply(BULLET_SPEED);
          const pos = players[playerId].gameObject.position;
          bullet.position = pos.add(headingVector.multiply(SHOOTING_OFFSET));
          bullet.rotation = msg.data.heading;
          bullets.push(bullet);
          setTimeout(() => {
            bullets.splice(bullets.indexOf(bullet), 1);
            GameObject.Destroy(bullet);
          }, 1000);
        }
      }
    }
  });
  clientSocket.on('close', () => {

    console.log(`Disconnected ${ip}`);
    GameObject.Destroy(players[userId].gameObject);
    delete players[userId];
  });
  clientSocket.send(JSON.stringify({
    event: 'setClient', data: {
      playerId: counter++,
      gameFieldSize: {
        x: GAME_FIELD_SIZEX,
        y: GAME_FIELD_SIZEY
      },
      playerSize: {
        x: PLAYER_SIZE_X,
        y: PLAYER_SIZE_Y
      },
      playerTopSize: {
        x: PLAYERTOP_SIZE_X,
        y: PLAYERTOP_SIZE_Y
      },
      bulletSize: {
        x: BULLET_SIZE_X,
        y: BULLET_SIZE_Y
      }
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
        players,
        bullets
      }
    };
    client.send(JSON.stringify(data));
  }
}

function physics() {
  for (const player of players) {
    if (!player) continue;
    player.gameObject.angularSpeed = player.controls.x * TURN_SENSITIVITY;
    const rotationVector = Vector2.makeFromAngle(player.gameObject.rotation);
    const velocity = player.controls.y * MOVE_SENSITIVITY;
    player.gameObject.velocity = rotationVector.multiply(velocity);
    Vector2.clamp(gameField, player.gameObject.position);
  }
  GameObject.Physics();
  updateClients();
}
