var http = require('http');
var fs = require('fs');
var url = require('url');
var stormpath = require('stormpath');
var open = require('open');

var client, application;
var IS_PRODUCTION = process.env.NODE_ENV==='production';
var API_KEY_FILE = process.env.API_KEY_FILE;
var STORMPATH_API_KEY_ID = '3BK5MFKO7GE7SPYV0C2C67NTW';
var STORMPATH_API_KEY_SECRET = 'qYUSz9FYACCatd+782EmFY5IxdZqlho9gZdER14GRf8';
var STORMPATH_APP_HREF = 'http://enterprise.stormpath.io/v1/applications/73YdqaH8RrE7fMmZQ3HLLx';
var PORT = process.env.PORT || 8001;
var DOMAIN = process.env.DOMAIN || 'local.coca-cola.com';
var SSO_SITE_PATH = process.env.SSO_SITE_PATH || '';
var CB_URI = 'balls';//process.env.CB_URI || ('http://' + DOMAIN + ':' + PORT);


function startServer(){
  console.log('attempt to start server on port ' + PORT);
  http.createServer(function (req, res) {
    console.log(req.headers.host,req.method,req.headers['content-type'] || '',req.url);
    var params = url.parse(req.url,true).query;
    if (req.url==='/sendToSprite'){
      res.writeHead(302, {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Location': 'http://limitless-ravine-7654.herokuapp.com/login'
      });
      res.end();
    }else if(req.url==='/login'){
      res.writeHead(302, {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Location': application.createIdSiteUrl({
          callbackUri: CB_URI,
          path: SSO_SITE_PATH
        })
      });
      res.end();
    }else if(req.url==='/logout'){
      res.writeHead(302, {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Location': application.createIdSiteUrl({
          callbackUri: CB_URI,
          path: SSO_SITE_PATH,
          logout: true
        })
      });
      res.end();
    }else if(req.url==='/register'){
      res.writeHead(302, {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Location': application.createIdSiteUrl({
          callbackUri: CB_URI,
          path: '/#/register'
        })
      });
      res.end();
    }else if(params.jwtResponse){
      application.handleIdSiteCallback(req.url,function(err,result){
        if(err){
          res.writeHead(500, {
            'Cache-Control': 'no-store',
            'content-type': 'text/html',
            'Pragma': 'no-cache'
          });
          res.end(fs.readFileSync('error.html').toString().replace('ERROR',err));
        }else{
          if(result.status === "AUTHENTICATED"){
            res.writeHead(200, {
            'Cache-Control': 'no-store',
            'content-type': 'text/html',
            'Pragma': 'no-cache'
            });
            res.end(fs.readFileSync('account.html').toString().replace('%ACCOUNT%', result.account.fullName));
          }
          if(result.status === "LOGOUT"){
            res.writeHead(200, {
            'Cache-Control': 'no-store',
            'content-type': 'text/html',
            'Pragma': 'no-cache'
            });
            res.end(fs.readFileSync('logout.html'));
          }
        }
      });
    }else{
      res.writeHead(200, {
        'Cache-Control': 'no-store',
        'content-type': 'text/html',
        'Pragma': 'no-cache'
      });
      res.end(fs.readFileSync('index.html'));
    }
  }).listen(PORT,function(){
    if(!IS_PRODUCTION){
      open('http://'+DOMAIN+':'+PORT);
    }
  });

  console.log('Server running on port '+PORT);
}

function getApplication(){
  client.getApplication(STORMPATH_APP_HREF,function(err,a){
    if (err){
      throw err;
    }
    application = a;
    startServer();
  });
}

if(API_KEY_FILE){
  stormpath.loadApiKey(API_KEY_FILE, function apiKeyFileLoaded(err, apiKey) {
    if (err){
      throw err;
    }
    client = new stormpath.Client({apiKey: apiKey});
    getApplication();
  });
}else{
  client = new stormpath.Client({
    apiKey: new stormpath.ApiKey(
      STORMPATH_API_KEY_ID,
      STORMPATH_API_KEY_SECRET
    )
  });
  getApplication();
}
