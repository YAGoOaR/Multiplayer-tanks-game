# Multiplayer tanks game

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d9a991b331dc4adb9781ea516a7d44c9)](https://www.codacy.com/gh/YAGoOaR/Multiplayer-tanks-game/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=YAGoOaR/Multiplayer-tanks-game&amp;utm_campaign=Badge_Grade)

 ---
 It is 2D multiplayer browser game made using Node.js.
## Features
- Your opponents are other users
- You can control your tank and shoot other players
- Physic obstacles on game map
- (In development) Various maps, obstacles, and physic features will offer you interesting gameplay

</br>![Picture](/Pictures/GameplayScreenshots/screenshot.png)

## About realisation
The game is made using npm web sockets library(ws). In the progress of development, i used methods of asyncronous programming such as callbacks and promises. Also i made movement smoothing on client. It means client tries to smooth and foresee movement of objects. Thanks to that we can save a lot of internet traffic, because sockets send rate is lover. Also it helps to deal with time delays, so user almost will not see them.

> You can find server script in /src

> You can find client script in /static.

> To launch server, launch index.js. You can connect to server using browser through server's address and port.

## Contacts
Telegram: https://t.me/YAGOoaR
</br>E-mail: yegorgribenko68@gmail.com

## License
[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)
</br>- Copyright 2020 © <a href="https://github.com/YAGoOaR" target="_blank">YAGoOaR</a>.
