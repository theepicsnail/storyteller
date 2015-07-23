jsPlumb.Defaults.Anchor = 'AutoDefault';
jsPlumb.Defaults.EndpointStyle={};
jsPlumb.Defaults.ConnectionsDetachable = false;
jsPlumb.Defaults.PaintStyle.lineWidth=3;
jsPlumb.Defaults.Overlays=[['Arrow', {location:.95}]];
//jsPlumb.Defaults.Anchors = ['Continuous'];
jsPlumb.Defaults.Connector = 'Straight';

jsPlumb.ready(function() {
  setup();
});

RESIZE = {
  resize : function(event, ui) {
    jsPlumb.repaint(ui.helper);
  },
  handles: "all"
};



function newPassage(id) {
  console.log("create passage", id);
  if(id == undefined) {
    var rnd = (""+Math.random()).substr(2,4)
    id = "p" + (+new Date()) +rnd;
  }

  var d = document.createElement('div');
  d.id = id;
  d.className = 'passage gray';
  d.innerHTML = 'Empty passage';
  $(d).resizable(RESIZE).dblclick(onClick);
  document.getElementById('workspace').appendChild(d);

  var downPos;
  $(d).mousedown(function(evt){
    downPos = $(d).position();
  });
  $(d).mouseup(function(evt){
    var pos = $(d).position();
    if(pos.top==downPos.top && pos.left == downPos.Left)
      return;
    console.log('passage move', id, pos);
    socket.emit('passage move', id, pos);
  });
  jsPlumb.draggable(id, {containment:"parent"});
  return id
}

function onClick(evt) {
  socket.emit('edit', evt.target.id)
}


var autoSave = -1;
function setup() {
  var editor = $('#editor');
  console.log(editor);
  editor.keydown(function(evt){
    if (evt.keyCode == 9) {
      evt.preventDefault();
      var s = this.selectionStart;
      this.value = this.value.substring(0,this.selectionStart)
          + "  " +
          this.value.substring(this.selectionEnd);
      this.selectionEnd = s+2;
    }
    clearTimeout(autoSave);
    autoSave = setTimeout(function(){
      console.log("save");
      socket.emit('save', editor.val());
    }, 500);
  });
  $('#newPassage').on('click', function(){
    socket.emit('new passage');
  });
  $('#deletePassage').on('click', function() {
    selected = $('div.green');
    if(selected.length != 1) {
      console.log("Couldn't find selected passage");
      return;
    }

    id = selected.attr('id');
    text = selected.text();
    if(confirm("Delete passage '"+text+"'?")) {
      socket.emit('passage delete', id);
    }

  });

}

function setLockState(id, state){
  console.log("set",id,state);
  var e = $('#' + id);
  e.removeClass('red');
  e.removeClass('green');
  e.removeClass('gray');
  e.addClass(state);
}

var socket = io();
socket.on('connect', function(){
  $('#workspace').empty();
  socket.emit('init');
});
socket.on('passage add', newPassage);
socket.on('passage text', function(id, text){$('#' + id).text(text);});
socket.on('passage css', function(id, pos){
  $('#'+id).css(pos);
  try{
  jsPlumb.repaintEverything();
  }catch(err){}
});

socket.on('passage connections', function(id, connections){
  console.log("Conenctions", id, connections);
  var conns = jsPlumb.getConnections();
  var toRemove = []
  jsPlumb.getConnections().filter(function(c){
    return c.sourceId == id;
  }).forEach(function(c){
    jsPlumb.detach(c, {fireEvent: true, forceDetach:true});
  });
  connections.forEach(function(dst){
    jsPlumb.connect({
      source:id,
      target:dst
    });
  });
});
socket.on('passage delete', function(id) {
  var conns = jsPlumb.getConnections();
  var toRemove = []
  jsPlumb.getConnections().filter(function(c){
    return c.sourceId == id || c.targetId == id;
  }).forEach(function(c){
    jsPlumb.detach(c, {fireEvent: true, forceDetach:true});
  });
  $('#'+id).remove();
});

socket.on('ping', function(msg){socket.emit('pong', msg);});
socket.on('lock given', function(id){setLockState(id, 'green');});
socket.on('lock taken', function(id){setLockState(id, 'red');});
socket.on('lock released', function(id){setLockState(id, 'gray');});
socket.on('editor', function(msg){$('#editor').val(msg);});
socket.on('storyerror', function() {
  console.warn.apply(console, arguments);
});
