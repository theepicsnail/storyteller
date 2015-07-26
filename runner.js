$.getJSON("save.json", function(data) {
  window.pageToId= {};
  for(var id in data) {
    pageToId[data[id].name]=id;
  }
  window.data = data;

  setPage('Main');
});

function passageContent(page) {
  if(pageToId[page] == undefined) {
    console.error(page + " isn't a defined passage");
    return undefined;
  }
  return window.data[pageToId[page]].text;
}

function include(page) {
  var content = passageContent(page);
  if(content == undefined)
    return

  return _.template(content)(window.state)
}

var page_history=[];
function setPage(page) {
  console.log('setPage', page);
  content = include(page)
  if(content == undefined)
    return
  page_history.push(page)
  document.body.innerHTML=content
}
function back() {
  page_history.pop();
  setPage(page_history.pop())
}

function css(code) {
  return "<style>" + passageContent(code) + "</style>";
}

function js(code) {
  eval(passageContent(code));
  return "";
}

var nid = 0;
function ID(prefix) {
  nid += 1;
  id = prefix + nid
  console.log(id);
  return id;
  //return (prefix + (+new Date()) + Math.random()).replace(".", "");
}

function button(text, nextPage) {
  var id=ID("b");
  $(document).on('click', '#'+id, function() {
    setPage(nextPage);
  });
  return $('<input>')
      .attr({
        type:'button',
        value:text,
        id:id,
        class: 'mdl-button mdl-js-button mdl-js-ripple-effect'
      })
      .prop('outerHTML');
}

/*
  Create a text link (anchor tag) that when clicked calls
  [onclick] with the remaning args.

  textCallback("someText", setPage, "other")
  will add the text 'someText', then when clicked will call
  setPage('other')
*/
function textCallback(text, onclick) {
  console.log('textCallback', text);
  var id=ID("a");
  var args = Array.prototype.slice.call(arguments, 2)
  $(document).on('click', '#'+id, function() {
    console.log("calling", onclick);
    console.log("with", args);
    onclick.apply(this, args);
  });
  return $('<a>')
      .text(text)
      .attr({
        href:'#',
        id:id,
      })
      .prop('outerHTML');

}

function link(text, nextPage) {
  console.log('link', nextPage)
  return textCallback(text, setPage, nextPage);
}
function website(text, url) {
  return textCallback(text, window.open.bind(window), url);
}

function table(data) {
  out = "<table>";
  for(var row in data) {
    out += "<tr>";
    for(var col in data[row]){
      out += "<td>" + data[row][col] +"</td>";
    }
    out += "</tr>";
  }
  return out +"</table>";
}

function image(url) {
  return $('<img>')
    .attr({
      src:url
    })
  .prop('outerHTML');
}

