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
function setPage(page) {
  content = include(page)
  if(content == undefined)
    return
  document.body.innerHTML=content
}
function css(code) {
  return "<style>" + passageContent(code) + "</style>";
}
function js(code) {
  eval(passageContent(code));
  return "";
}
function button(text, nextPage) {
  return $('<input>')
      .attr({
        type:'button',
        value:text,
        onclick:'setPage("' +nextPage + '")'})
      .prop('outerHTML');
}
function link(text, nextPage) {
  console.log(nextPage);
  a = $('<a>')
    .text(text)
    .attr({
      href:'#',
      onclick:'setPage(\'' + nextPage + '\')'
    });
  console.log(a);
  console.log(a.prop('outerHTML'));
  return a.prop('outerHTML');
}
function dump(obj) {
  out = "<table>";
  for(var k in obj) {
    out += "<tr><td>" + k + "</td><td>" + obj[k] +"</td></tr>";
  }
  return out +"</table>";
}
