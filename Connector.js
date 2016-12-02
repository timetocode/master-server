var net = require('net')

function Connector(options) {
    this.masterIP = options.ip
    this.masterPort = options.port
    this.password = options.password
    this.onConnect = options.onConnect
    this.autoReconnect = true
    if (options.reconnectInterval === 0) {
        this.autoReconnect = false
    }
    this.log = console.log
    if (options.verbose === false) {
        this.log = () => {}
    }
    this.reconnectInterval = options.reconnectInterval || 5000
    this.socket = null
    this.connect()
}

Connector.prototype.connect = function() {
    this.socket = new net.Socket()
    this.socket.connect(this.masterPort, this.masterIP, () => {
        this.log(`Connector reached ${this.masterIP}:${this.masterPort}`)
        this.send({ password: this.password })
        if (typeof this.onConnect === 'function') {
            this.onConnect()
        }
    })

    this.socket.on('close', () => {
        this.socket = null
        this.log('MasterServer connection closed')
        if (this.autoReconnect) {
            setTimeout(() => {
                this.log('Retrying MasterServer connection...')
                this.connect()
            }, this.reconnectInterval)
        }
    })

    this.socket.on('error', error => {
        this.log('MasterServer connection error', error)
        this.socket.destroy()
        this.socket.unref()
    })   
}

Connector.prototype.send = function(message) {
    if (this.socket !== null) {
        this.socket.write(JSON.stringify(message) + '\n')
    }
}

module.exports = Connector