var fs = require("fs");

serialize = function(obj) { return JSON.stringify(obj, null, 2); }

module.exports = function(save_path, save_ms) {
  var last_save = "";
  var save_ms = (save_ms|0) || 500; // Default to 5s
  var obj = {};

  // Load default.
  try {
    obj = require(save_path);
    console.log("Loaded", save_path);
    last_save = serialize(obj);
  }catch(err){
    console.log("Error loading", err, save_path);
  }

  setInterval(function() {
    var save = serialize(obj);
    if (save == last_save)
      return;
    console.log("Updating save");
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
