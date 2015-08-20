var http = require('http');
var fs = require('fs');
var url = require('url');
var stormpath = require('stormpath');
var open = require('open');

var client, application;
var IS_PRODUCTION = process.env.NODE_ENV==='production';
var API_KEY_FILE = process.env.API_KEY_FILE;
var STORMPATH_API_KEY_ID = process.env.STORMPATH_API_KEY_ID;
var STORMPATH_API_KEY_SECRET = process.env.STORMPATH_API_KEY_SECRET;
var STORMPATH_APP_HREF = process.env.STORMPATH_APP_HREF || "https://api.stormpath.com/v1/applications/3QIMlJKKN2whGCYzXXw1t8";
var PORT = process.env.PORT || 8001;
var DOMAIN = process.env.DOMAIN || 'localhost';
var SSO_SITE_PATH = process.env.SSO_SITE_PATH || '';
var CB_URI = process.env.CB_URI || ('http://' + DOMAIN + ':' + PORT);


function startServer(){
  console.log('attempt to start server on port ' + PORT);
  http.createServer(function (req, res) {

    var params = url.parse(req.url,true).query;

    if(params.jwtResponse){
      application.handleIdSiteCallback(req.url,function(err,result){
        
        if(result.status==='LOGOUT'){
          redirect(res, false);
        } else if(result.status==='AUTHENTICATED' || result.status==='REGISTERED'){
          console.log('Status: ', result.status);
          console.log('Account\'s email: ', result.account.email);
          redirect(res, true);
        }

      });
    }

    redirect(res, false);

  }).listen(PORT,function(){
    if(!IS_PRODUCTION){
      open('http://'+DOMAIN+':'+PORT);
    }
  });

  console.log('Server running on port '+PORT);
}

function redirect(res, logout){

    var idSiteUrlProps = {
      'callbackUri': CB_URI,
      'path': SSO_SITE_PATH
    };

    if(logout===true){
      idSiteUrlProps.logout = true;
    }
    
    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Location': application.createIdSiteUrl(idSiteUrlProps)
    });
    res.end();
}

function getApplication(){
  client.getApplication(STORMPATH_APP_HREF,function(err,app){
    if (err){
      throw err;
    }
    application = app;
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
