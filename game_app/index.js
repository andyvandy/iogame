const path = require('path')

const config = require(path.resolve(__dirname, 'config.json'))
const gameLoopFactory = require(path.resolve(__dirname, 'game/game-loop.js'))
const chatHandlerFactory = require(path.resolve(__dirname, 'game/chat.js'))

// Import serializer get and set
// https://github.com/ThreeLetters/SimpleProtocols
// At the moment the code generator is buggy but it's fixable.
const spSet = require(path.resolve(__dirname, 'game/set-node-js.js'))
const spGet = require(path.resolve(__dirname, 'game', 'get-node-js.js'))

const io = require('socket.io')()

const sockets = {}

// http://stackoverflow.com/questions/4213351/make-node-js-not-exit-on-error
// we don't want the server to stope if an error occurs
// TODO make it show the stack trace
//
// process.on('uncaughtException', function (err) {
//   console.log('Caught exception: ' + err);
// });

io.on('connection', function (socket) {
  // type is sent by the client and could be used to determine whether or not the player is spectating?
  console.log('A user connected!', socket.handshake.query)

  sockets[socket.id] = socket

  socket.join('game')

  socket.player = gameLoop.addPlayer(socket.id, socket.handshake.query)

  socket.on('a', function (movesBinary) {
    socket.player.parse(spGet.get(movesBinary))
  })

  socket.on('disconnect', function (reason) {
    gameLoop.removePlayer(socket.id, socket.handshake.query)
  })

  socket.on('message', function(packet){ chatHandler.messageHandler(packet,socket.player.username)})


  socket.on('username',function(username){ socket.emit("username-confirm", socket.player.validateUsername(username))})

  // ntp clock syncing uses this, simply send back the current time
  socket.on('NTP', function(){
    time= Date.now();
    socket.emit('NTP', time); } )

  socket.emit('playerID', {id: socket.id})
})

function broadcast () {
  // TODO improve general efficiency
  if (!gameLoop.snapshot()) return

  const binarySnapshot = spSet.setSnapshot(gameLoop.snapshot())
  const binaryEvents = spSet.setEvent(gameLoop.getEvents())
  gameLoop.clearEvents()

  io.in('game').emit('s', binarySnapshot)
  io.in('game').emit('e', binaryEvents)
}

function broadcastLowFreq(){
  // used to send stuff that doesn't need to be updated as often
  io.in('game').emit('leaderboard', gameLoop.leaderboard.slice(0, 10))
  io.in('game').emit('round-info', {roundEndTime:gameLoop.roundEndTime} ) //TODO not send this every second
}

io.listen(config.port)
console.log('listening on port ' + config.port)

const gameLoop = gameLoopFactory()
const chatHandler= chatHandlerFactory({io:io})
gameLoop.map.load('ffa001.json') // todo put this inside gameloop
gameLoop.start()

setInterval(broadcast, 1000 / 20)
setInterval(broadcastLowFreq, 1000 )