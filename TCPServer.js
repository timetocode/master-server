var net = require('net')
var JSONStream = require('json-stream')

function TCPServer(ip, port, connectionCb, messageCb, closeCb) {
    this.ip = ip
    this.port = port

    var id = 0
    this.server = net.createServer()
    this.server.on('connection', socket => {
        var client = {}
        client.id = id++
        client.ip = socket.remoteAddress
        if (client.ip === '127.0.0.1') {
            client.ip = this.ip
        }
        connectionCb(client)

        var stream = JSONStream()
        socket.pipe(stream)

        stream.on('data', message => {
            messageCb(client.id, message)
        })

        socket.on('close', () => {
            closeCb(client.id)
        })

        socket.on('error', (err) => {
            console.log('TCP error', err)
        })        
    })
}

TCPServer.prototype.start = function() {
    this.server.listen(this.port, '0.0.0.0')
    console.log(`TCPServer running at ${this.ip}:${this.port}`)
}

module.exports = TCPServer