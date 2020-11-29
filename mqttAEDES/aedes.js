const aedes = require('aedes')()
const fs = require('fs')
const httpsServer = require('https').createServer({
  cert: fs.readFileSync('./certs/server.crt'),
  key: fs.readFileSync('./certs/server.key'),
})
const wss = require('websocket-stream')
const port = 8888

wss.createServer({ server: httpsServer }, aedes.handle)

httpsServer.listen(port, function () {
  console.log('Secure websocket server listening on port ', port)
})
