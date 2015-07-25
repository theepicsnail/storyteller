var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var files = require('./project')('./save.json');

function serve(path, file) {
  if(file == undefined)
    file = path

  app.get(path, function(req, res){
    res.sendFile(__dirname + file);
  });
}
serve('/', '/index.html')
serve('/_.js', '/node_modules/underscore/underscore-min.js')
serve('/underscore-min.map', '/node_modules/underscore/underscore-min.map')
serve('/edit', '/editor.html')
serve('/editor.js')
serve('/runner.js')
serve('/bg.jpg')
serve('/save.json')

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function fileNameToId(name) {
  var out = [];
  for(var fid in files) {
    if(files[fid].name == name) {
      out.push(fid);
    }
  }
  return out;
}

function sendPassage(socket, id) {
    socket.emit('passage add', id);
    socket.emit('passage text', id, files[id].name);
    socket.emit('passage css', id, files[id].pos);
}


io.on('connection', function(socket){
  for(var evt in client_functions) {(function(evt){
    socket.on(evt, function() {
      var args = Array.prototype.slice.call(arguments);
      console.log(evt, socket.id, args);
      args.unshift(socket);
      client_functions[evt].apply(socket, args);
    });
  }(evt));}
});

client_functions = {
  'init': function(socket) {
    for(var id in files)
      sendPassage(socket, id);
    for(var id in files)
      socket.emit('passage connections', id, files[id].connectTo);
    for(var id in ownerOf){
      socket.emit('lock taken', id);
    }
  },
  'disconnect': function(socket) {
    releaseLock(socket);
  },
  'edit': function(socket, id) {
    if(files[id] && requestLock(socket, id))
    {
      socket.emit('editor', files[id].text)
    }
  },
  'save': function(socket, data) {
    saveFile(socket, data);
  },
  'pong': function(socket, data) {
    clearTimeout(pendingPings[data]);
  },
  'new passage': function(socket) {
    sendPassage(io.sockets, createFile());
  },
  'passage move': function(socket, id, pos) {
    files[id].pos = pos;
    pos.top = Math.floor(pos.top/10 +.5)*10;
    pos.left = Math.floor(pos.left/10 +.5)*10;
    io.sockets.emit('passage css', id, pos);
  },
  'passage delete': function(socket, id) {
    if(requestLock(socket, id)) {
      releaseLock(socket);
      delete files[id];
      io.sockets.emit('passage delete', id);
    }
  },
};

function createFile() {
  var id = 'p'+(+new Date());
  file = {name:id, text:'<%// ' + id + ' %>\n',
          pos:{left:0, top:0, width:100, height:50},
          connectTo:[]
         };
  files[id] = file;
  return id;
}

var pendingPings = {};
function ping(socket) {
  var val = ""+Math.random();
  pendingPings[val] = setTimeout(function() {
    console.log(socket.id, 'pung out');
    releaseLock(socket);
  }, 500);
  socket.emit('ping', val);
}

//---------------------------
// Lock stuff
var ownerOf = {}; // Key to owner
var ownedBy = {}; // Owner to key
function requestLock(sock, lockId) {
  console.log("GetLock", sock.id, lockId);
  if(!ownerOf.hasOwnProperty(lockId)){ // New lock
    announceLock(sock, lockId);
    return true;
  }
  var owner = ownerOf[lockId];
  if(owner.id == sock.id) {
    // they already have the lock.
    //announceLock(sock, lockId);
    return true;
  }

  ping(owner); // Check if they're dead
  sock.emit('lock taken', lockId);
  // Notify the requeser it's taken
  return false;
}

function releaseLock(owner) {
  console.log('ReleaseLock', owner.id);
  if(ownedBy[owner.id] == undefined)
    return

  id = ownedBy[owner.id];

  delete ownerOf[id]; // lock is nolonger held
  delete ownedBy[owner.id]; // owner is not longer holding
  io.sockets.emit('lock released', id);
}
function announceLock(owner, id){
    console.log("Lock taken", owner.id, id);
    if(ownedBy.hasOwnProperty(owner.id))
    {
      releaseLock(owner);
    }
    ownerOf[id] = owner;
    ownedBy[owner.id] = id;
    owner.broadcast.emit('lock taken', id);
    owner.emit('lock given', id);
}
//---------------------------

function saveFile(socket, data) {
  console.log(socket.id, "saving", data);
  var fileid = ownedBy[socket.id];
  if(files[fileid]== undefined) {
    console.log('unknown file');
    return
  }
  files[fileid].text = data;
  // Figure out the name of the file.
  var results = data.match("^(\\S)+ (\\S+)");
  if(results == null) {
    io.sockets.emit('passage text', fileid, 'INVALID');
    return;
  }
  var name = results[2];
  var commentStart = results[1];
  var safeCommentStart = escapeRegExp(commentStart);
  var linkRE = safeCommentStart + " -> (\\S+)";
  //console.log("Comment start:", commentStart);
  //console.log("Safe Comment start:", safeCommentStart);
  //console.log("Name:", name)

  files[fileid].name = name;
  io.sockets.emit('passage text', fileid, name);

  files[fileid].connectTo = [];
  data.split("\n").forEach(function(line){
    var res = line.match(linkRE);
    if(!res) return;
    //console.log("Link:", res[1]);
    ids = fileNameToId(res[1]);
    if(ids.length == 0) {
      socket.emit('storyerror', 'No passages named '+res[1]);
      return;
    }

    if(ids.length == 1) {
      files[fileid].connectTo.push(ids[0]);
      return;
    }

    socket.emit('storyerror', 'Multiple passages named '+res[1]);
  });
  io.sockets.emit('passage connections', fileid, files[fileid].connectTo);
}


function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

