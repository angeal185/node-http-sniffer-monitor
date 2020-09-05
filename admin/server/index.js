const https = require('https'),
fs = require('fs'),
config = require('../config');

const options = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
},
port = config.server.port,
server = https.createServer(Object.assign({},options))


server.on('request', function(req, res){
  console.log(req.headers)
  if(req.method !== 'POST'){
    return res.end()
  }
});


server.listen(port, function(){
  console.log('Server listening on port:'+ port)
});
