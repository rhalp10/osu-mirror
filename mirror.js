// The actual mirror that starts after a connection to the osu! has been enstabilished and confirmed.

var sqlite3 = require("sqlite3")
var db = new sqlite3.Database("osumirror.db")
var sanitize = require("sanitize-filename")

var fs = require("fs")
var config = require("./config")
var ibf = require("isbinaryfile")
// We're using the request module passed by index.js because that one is the one to have the cookie.
var request

var currentMapset
var notExistingCount = 0

exports.mirrorStart = function(r) {
  request = r
  db.get("SELECT * FROM stats", function(err, row) {
    if (err)
      throw err
    currentMapset = +(row.current_map_id)
    getMap()
  })
}

var getMap = function() {
  if (notExistingCount > 1000) {
    fixAndClose();
  }
  console.log("Starting download. s: " + currentMapset + "; notExistingCount: " + notExistingCount);
  request("https://osu.ppy.sh/api/get_beatmaps?k=" + config.apiKey + "&s=" + currentMapset, function(err, response, body) {
    if (err !== null) 
      console.log("an error happened while downloading " + filename)
    if (process.env.verbose = "yes")
      console.log(body)
    if (body == "[]") {
      notExistingCount += 1
      addMap([currentMapset, "", "0000-00-00 00:00:00", "0", "0", "0"])
    }
    else {
      notExistingCount = 0
      exFound = false
      try {
        body = JSON.parse(body)
      }
      catch (ex) {
        exFound = true
        console.log("Seems like cloudflare has meme'd us. Let's try again in 30 seconds.")
        setTimeout(function() {
          getMap()
        }, 30000)
      }
      if (!exFound && typeof body.error !== "undefined") {
        console.log("The osu! API tells us to provide a valid API key. We will retry in 1 minute to do the request, but check the api key is correct"
                  + " in the configuration file, just in case!")
        setTimeout(function() {getMap()}, 60000)
      }
      else if (!exFound) {
        var filename = sanitize(currentMapset + " " + body[0].artist + " - " + body[0].title)
        console.log("Starting download of " + filename)
        request("https://osu.ppy.sh/d/" + currentMapset, function(err) {
          if (err)
            console.log("Something went horribly wrong when trying to download mapset " + currentMapset + "!")
          console.log("done. checking download worked...")
          checkMap(filename, currentMapset, body, 0)
        }).pipe(fs.createWriteStream("maps/elab/" + filename + ".osz"))
      }
    }
  })
}

var checkMap = function(filename, currentMapset, body, retries) {
  var act_exist = "1"
  try {
    if (!ibf("maps/elab/" + filename + ".osz")) {
      console.log("Beatmap " + currentMapset + " isn't a binary file. Perhaps the beatmap download got removed?")
      act_exist = "0"
      fs.unlink("maps/elab/" + filename + ".osz")
    }
    else {
      fs.rename("maps/elab/" + filename + ".osz", "maps/out/" + filename + ".osz")
    }
  }
  catch (ex) {
    // Todo: add an if (ex instanceof ...) else throw ""
        
    retries += 1
    // if we've already retried a lot, then let's just get the map again and don't fuck around.
    if (retries > 15)
      getMap()
    else
      setTimeout(function() {checkMap(filename, currentMapset, body, retries)}, 1000)
  }
  console.log("completed beatmap " + filename)
  mightbeupdated = (body[0].approved > 0 && body[0].approved != 3) ? "0" : "1"
  addMap([currentMapset, filename + ".osz", body[0].last_update, act_exist, mightbeupdated, "0"], 0)
}

var addMap = function(arr) {
  db.run("INSERT INTO `maps`(`id`, `name`, `saved_version`, `act_exist`, `mightbeupdated`, `retries`) VALUES (?, ?, ?, ?, ?, ?)", arr)
  currentMapset += 1
  db.run("UPDATE `stats` SET `current_map_id`=? WHERE 1", currentMapset)
  setTimeout(function() { getMap() }, 3000);
}

var fixAndClose = function() {
  db.run("DELETE FROM `maps` WHERE `id` > ?", [currentMapset - notExistingCount - 1])
  db.run("UPDATE `stats` SET `current_map_id` = " + (currentMapset - notExistingCount) + " WHERE 1", function() {
    // LET THE ENDLESS RECURSION AND CALLBACKING STOP
    process.exit()
  })
}
