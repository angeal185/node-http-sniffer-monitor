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
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if(
    req.method !== 'POST' ||
    req.headers['content-type'] !== 'application/json' ||
    !req.headers['x-api'] ||
    req.headers['x-api'] !== config.server.api
  ){
    res.writeHead(401, config.server.headers);
    return res.end(JSON.stringify({success: false}))
  }

  req.setEncoding('utf8');

  let data = '';
  req.on('data', function(chunk){
    data+= chunk;
  })

  req.on('end', function(){
    try {
      data = JSON.parse(data);
      data.ip = ip;
      data.date = Date.now();

      //send to db
      console.log(data);

      res.writeHead(200, config.server.headers);
      return res.end(JSON.stringify({success: true}))
    } catch (err) {
      res.writeHead(400, config.server.headers);
      return res.end(JSON.stringify({success: false}))
    }
  })

});

server.on('error', function(err){
  return console.error('error:'+ err)
});

server.listen(port, function(){
  console.log('Server listening on port:'+ port)
});
