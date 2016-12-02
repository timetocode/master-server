var TCPServer = require('./TCPServer')
var HTTPServer = require('./HTTPServer')

var protectedProperties = ['id', 'authenticated', 'password']

function Server(options) {
    this.clients = {}
    this.tcpPassword = options.tcpPassword

    this.tcpServer = new TCPServer(options.ip, options.tcpPort, 
        // tcp on connect
        (client) => {
            this.connect(client)
        },
        // tcp on message
        (id, message) => {
            this.message(id, message)
        },
        // tcp on disconnect
        (id) => {
            this.close(id)
        }
    )

    this.httpServer = new HTTPServer(options.ip, options.httpPort, 
        // http
        () => {
            return JSON.stringify(this.getServerListing())
        }
    )

    this.cachedListing = []
    this.cacheTimestamp = Date.now()
    this.cacheDuration = options.cacheDuration || 500
}

Server.prototype.start = function() {
    this.tcpServer.start()
    this.httpServer.start()
}

Server.prototype.connect = function(client) {
    this.clients[client.id] = client
    client.authenticated = false
}

Server.prototype.message = function(id, message) {
    var client = this.clients[id]
    for (var prop in message) {
        // if a tcpPassword is defined, all messages except password will be 
        // ignored until the correct password is received
        if (typeof this.tcpPassword !== 'undefined' && !client.authenticated) {
            if (prop === 'password') {
                if (message[prop] === this.tcpPassword) {
                    client.authenticated = true
                }
            }
        } else {
            // if authenticated (or not using a password), accept everything
            // except the protected properties
            if (protectedProperties.indexOf(prop) === -1) {
                client[prop] = message[prop]
            }
        }
    }
}

Server.prototype.close = function(id) {
    delete this.clients[id]
}

Server.prototype.getServerListing = function() {
    var now = Date.now()
    if (now > this.cacheTimestamp + this.cacheDuration) {
        // rebuild cache
        this.cachedListing = this.buildServerList()
        this.cacheTimestamp = now
    }
    return this.cachedListing
}

Server.prototype.buildServerList = function() {
    var arr = []
    for (var id in this.clients) {
        var client = this.clients[id]
        var listing = {}
        for (var prop in client) {
            if (protectedProperties.indexOf(prop) === -1) {
                listing[prop] = client[prop]
            }
        }
        arr.push(listing)
    }
    return arr
}

module.exports = Server