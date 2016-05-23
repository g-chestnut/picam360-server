process.chdir(__dirname);

var os = require('os');
var agent = require('webkit-devtools-agent');
var child_process = require('child_process');
var async = require('async');
var fs = require("fs");
var express = require('express');
var moment = require("moment");

async.waterfall([ function(callback) {// exit sequence
	process.on('SIGINT', function() {
		console.log("exit process done");
		process.exit();
	});
	process.on('SIGUSR2', function () {
		if (agent.server) {
	 		agent.stop();
		} else {
		    agent.start({
		        port: 9999,
		        bind_to: '192.168.3.103',
		        ipc_port: 3333,
		        verbose: true
		    });
		}
	});
	callback(null);
}, function(callback) {// start up websocket server
	console.log("websocket server starting up");

	var express = require('express');  
	var app = express();
	var http = require('http').Server(app);
	app.use(express.bodyParser());
	
	app.put('/img/picam360.jpeg', function(req, res) {
		var size = 0;
		var write_stream = fs.createWriteStream('/tmp/_vr.jpeg')
			.on('drain', function ()         { console.log('write: drain'); })
            .on('error', function (exeption) { console.log('write: error'); })
            .on('close', function ()         {
		    	console.log('/tmp/_vr.jpeg saved');
				child_process.exec('mv /tmp/_vr.jpeg /tmp/vr.jpeg');
			})
            .on('pipe',  function (src)      { console.log('write: pipe');  });
	    req.on('data', function(chunk) {
			size += chunk.length;
			console.log(size);
	    	write_stream.write(chunk);
	    });
	    req.on('end', function(chunk) {
	    	write_stream.end();
			res.writeHead(200);
			res.end();
	    });
	});

	app.head('/img/picam360.jpeg', function(req, res){
		var stat = fs.statSync(path);
		var etag = '"' + stat.size + '-' + Number(stat.mtime) + '"';
		res.writeHead(200, {
			'Content-Type' : 'image/jpeg',
			'Content-Length' : stat.size,
			'Cache-Control' : 'private, no-cache, no-store, must-revalidate',
			'Expires' : '-1',
			'Pragma' : 'no-cache',
			'ETag' : etag
		});
		res.end();
		console.log(etag);
	}		
	
	app.get('/img/picam360.jpeg', function(req, res){
		var stat = fs.statSync(path);
		var etag = '"' + stat.size + '-' + Number(stat.mtime) + '"';
		
		//check modified
		if( req.headers['if-none-match'] === etag ) {
			res.writeHead(304);
			res.end();
			return;
		}
	
		fs.readFile('/tmp/vr.jpeg', function(err, data) {
			if (err) {
				res.writeHead(404);
				res.end();
				console.log("404");
			} else {
				res.writeHead(200, {
					'Content-Type' : 'image/jpeg',
					'Content-Length' : data.length,
					'Cache-Control' : 'private, no-cache, no-store, must-revalidate',
					'Access-Control-Allow-Origin' : '*',
					'Expires' : '-1',
					'Pragma' : 'no-cache',
					'ETag' : etag
				});
				res.end(data);
				console.log("200");
			}
		});
	});
	
	app.get('/img/*.mp4', function(req, res){
		var url = req.url.split("?")[0];
		var query = req.url.split("?")[1];
		var filepath = 'userdata/' + url.split("/")[2];
		console.log(url);
		console.log(query);
		console.log(filepath);
		fs.readFile(filepath, function(err, data) {
			if (err) {
				res.writeHead(404);
				res.end();
				console.log("404");
			} else {
				res.writeHead(200, {
					'Content-Type' : 'video/mp4',
					'Content-Length' : data.length,
					'Cache-Control' : 'private, no-cache, no-store, must-revalidate',
					'Expires' : '-1',
					'Pragma' : 'no-cache',
				});
				res.end(data);
				console.log("200");
			}
		});
	});	
	
	app.use(express.static('www'));//this need be set after all dynamic files
	
	http.listen(9001, function(){
	  console.log('listening on *:9001');
	});
	
	callback(null);
} ], function(err, result) {
});