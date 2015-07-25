var fs = require("fs");

serialize = function(obj) { return JSON.stringify(obj, null, 2); }

module.exports = function(save_path, save_ms) {
  var last_save = "";
  var save_ms = (save_ms|0) || 5000; // Default to 5s
  var obj = {};

  // Load default.
  try {
    obj = require(save_path);
    last_save = serializ(obj);
  }catch(err){
    console.log(err);
  }

  setInterval(function() {
    var save = serialize(obj);
    if (save == last_save)
      return;

    last_save = save;
    fs.writeFile(save_path, save, function(err) {
      if(err)
        console.log("Error saving:", err)
      else
        console.log(save_path, "saved.");
    });
  }, save_ms);

  return obj;
}
