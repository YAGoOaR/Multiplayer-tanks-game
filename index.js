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
const gameField = new Vector2(GAME_FIELD_SIZEX, GAME_FIELD_SIZEY);
GameObject.field = gameField;

const availableFiles  = ['/script.js', '/img/player.png', '/img/currentPlayer.png', '/img/playerTop.png', '/utils.js', '/canvasFunctions.js', '/mathUtils.js'];
const fileExists = dir => availableFiles.indexOf(dir) !== -1;

const sendStaticFile = (source, res) => {
  const pathToFile = path.resolve(__dirname, `./static${source}`);
  console.log(`loading ${pathToFile}`);
  fs.readFile(
    pathToFile,
    (err, file) => {
      if(err){
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        res.end(JSON.stringify({error: 'Not found'}));
      }
      res.end(file);
    }
  );
};

const server = http.createServer((req, res) => {
  const source = req.url;
  console.log(`request: ${source}`);
  if(fileExists(source)) {
    sendStaticFile(source, res);
  }
  else {
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

ws.on('connection', (clientSocket, req) => {
  const ip = req.socket.remoteAddress;
  const userId = counter;

  players[counter] = {
    playerId: counter,
    gameObject: new GameObject(),
    controls: new Vector2(0, 0),
    heading: 0,
  };

  console.log(`Connected ${ip}`);
  updateClients();

  clientSocket.on('message', message => {
    const msg = JSON.parse(message);
    if(msg.event === 'clientInput'){
      const playerId = msg.data.playerId;
      if(playerId >= 0 && playerId < counter){
        const controls = msg.data.controls;
        players[playerId].controls.Set(controls.x, controls.y);
        players[playerId].heading = msg.data.heading;
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
      }
    }
  }));
});

setInterval(() => {
  physics();
}, PHYSIS_RATE);

function updateClients() {
  for (const client of ws.clients) {
    client.send(JSON.stringify({event: 'UpdatePlayers', data: { time: GameObject.prevTime, players: players}}));
  }
}

function physics(){
  for(const player of players){
    if(!player) continue;
    player.gameObject.angularSpeed = player.controls.x * TURN_SENSITIVITY;
    player.gameObject.velocity = Vector2.makeFromAngle(player.gameObject.rotation).multiply(player.controls.y * MOVE_SENSITIVITY);
    Vector2.clamp(gameField, player.gameObject.position);
  }
  GameObject.Physics();
  updateClients();
}
