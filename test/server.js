/**
*  All Calls is a Node.js sample app that is powered by Usergrid
*  This app shows how to make the 4 REST calls (GET, POST,
*  PUT, DELETE) against the usergrid API.  
*
*  Learn more at http://Usergrid.com/docs
*
*   Copyright 2012 Apigee Corporation
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
* 
*  Some code patterns were pulled from http://www.nodebeginner.org/.  Thank you!
*/
var http = require("http");
var path = require('path');
var url = require("url");
var fs = require('fs');
var sys = require('util');
//include local files
var router = require("./router");
var controller = require("./controller");

//routing info
var handle = {}
handle["/"] = controller.main;
handle["/main"] = controller.main;

//initialze the Module
var usergrid = require("../lib/usergrid");
usergrid.ApiClient.init('apigee', 'nodejs');
usergrid.ApiClient.setClientSecretCombo('b3U6y6hRJufDEeGW9hIxOwbREg', 'b3U6ZOaOexFiy6Jh61H4M7p2uFI3h18');
usergrid.ApiClient.enableClientSecretAuth();

//call garbage collection
usergrid.session.garbage_collection(
  function(){
    //do something here
    console.log('Garbage collection completed'); 
  },function(error){
    //could not perform garbage collection
    console.log('Garbage collection - nothing to delete'); 
  }
);

//main server
function start(route, handle) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    var querydata = url.parse(request.url, true).query;              
      
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html'; 
    var extname = path.extname(filePath);
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        serveAsset(response, filePath, contentType);
        break;
      case '.css':
        contentType = 'text/css';
        serveAsset(response, filePath, contentType);
        break;
      case '.ico':
        //do nothing
        break;
      default:
        console.log("Request for " + pathname + " received.");
        //try to start the session
        usergrid.session.start_session(request, response, 
          function () {
            //session was started successfully
            console.log("Session started, routing...");
            //process the request
            route(handle, pathname, querydata, response, usergrid);  
                     
            console.log("route finished");  
          },
          function () {
            //no session availble
            console.log("No session available and none could be started.");
            //let the user know that no session was available and none could be created
            //either the API was down or there were not adequate permissions to create the session
            response.writeHead(200, {"Content-Type": "text/text"});
            response.write('No Session could be established.  Please refresh to try again');  
            response.end(); 
          });
        break;
    }
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
  console.log('Server running at port 8888, try http://127.0.0.1:8888');
}

function serveAsset(response, filePath, contentType) {
   fs.exists(filePath, function(exists) {      
    if (exists) {
      fs.readFile(filePath, function(error, content) {
        if (error) {
          response.writeHead(500);
          response.end();
        }
        else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    }
    else {
      response.writeHead(404);
      response.end();
    }
  });
}

start(router.route, handle);