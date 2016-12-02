# master-server
A master server and connection interface for listing game servers programmed in node.js. Communicates over TCP and publishes a JSON server list via HTTP.

# Install
    npm install master-server

# Usage
## Start the master server

```javascript
var master = require('master-server')

var server = new master.Server({ 
    ip: '127.0.0.1', // in production use the external ip!
    httpPort: 8080, 
    tcpPort: 3333, 
    tcpPassword: 'my password' 
})
server.start()
```

There is now an http server running at http://localhost:8080. If you visit it, it will respond with '[]' an empty array.

## Connect to the master server
```javascript
var master = require('master-server')

var connector = new master.Connector({ 
    ip: '127.0.0.1', 
    port: 3333, 
    password: 'my password', 
    onConnect: () => {
        connector.send({
            // hypothetical data
            name: 'US West 25', 
            port: 8081,
            currentPlayers: 0, 
            maxPlayers: 50 
        })
    }
})
```

Now if you revisit http://localhost:8080, you should see this:

    [{"ip":"127.0.0.1","port":8081,"name":"US West 25","currentPlayers":0,"maxPlayers":50}]
    
That's JSON by the way. So if you create a webpage that consumes this api, you can call JSON.parse on the results to get your server list. A game client could then open a websocket connection to ws://127.0.0.1:8081.

## Sending additional data / updating the server listing
The connector can always send more data to the server. For example, let's say that several players connect to your game server. You can then notify the master server like so:
```javascript
connector.send({ currentPlayers: 23 }) // server will instantly update currentPlayers to 23
```
Generally speaking anything can be sent via the connector to the master, and it will be added to the server listing. Just about any key:value pair can be stored, with a few exceptions, the server reserves the keys 'id', 'authenticated', and 'password'.  It also doesn't particularly make sense to send an 'ip' as the server already has the ip. **There is no validation of data sent to the server.**

## Security (or lack thereof)
The password is sent as clear text from connector to server. If the master server is created with no password, it becomes fully public (not recommended). The connectors can send anything they want to the master, and the master will add it to the server listing.

## Caching
The master server caches the server list for 500 ms by default. This can be changed by passing a cacheDuration to the server constructor. The cache is helpful if the http api receives heavy traffic.

## Autoreconnect
The connectors will try to reconnect to the master every 5 seconds. This can be changed by setting reconnectInterval, an option of 0 will disable reconnecting altogether. Autoreconnect is pretty handy though! If the master server needs rebooted and there are still 50 game servers running a connector, they'll all find it again when it comes back online.

## Recommended alternative to using ip:port for game servers (e.g. 127.0.0.1:8081)
The above example uses 127.0.0.1:8081 as the address of a game server. Using ips and ports is pretty common in multiplayer games that rely on TCP. But over here, in the land of node.js we have additional options. HTTP is much more stateful than TCP, thus we can connect to servers via url and forget about ports altogether. For example, ws://mydomain.io is a valid websocket connection, as is ws://mydomain.io/server23. What is the advantage to doing things this way? Well, it allows us to use the web ports of 80 (ws) and 443 (wss) and these are much less likely to be blocked by players' firewalls. So, to summarize, when numerous game severs are running on the same machine we have the option of denoting them via different urls instead of different ports.
