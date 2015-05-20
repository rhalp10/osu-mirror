// The actual mirror that starts after a connection to the osu! has been enstabilished and confirmed.

var mysql = require("mysql")
var sanitize = require("sanitize-filename")

var fs
var request
var config
var ibf
var connection

var addMap = function(arr, consec) {
    connection.query("INSERT INTO `" + config.mysqlDatabase + "`.`maps`(`id`, `name`, `saved_version`, `act_exist`, `mightbeupdated`, `retries`) VALUES (?, ?, ?, ?, ?, ?)", arr, function(){})
    connection.query("UPDATE `" + config.mysqlDatabase + "`.`stats` SET `current_map_id`=? WHERE 1", arr[0] + 1, function(){})
    getMap(consec)
}

var fixAndClose = function() {
    // dat nesting tho
    // TODO: I need to think better if it's better to have 31 or 30 if this happens on consec == 30.
    // but logic is not for me at the moment, so I'll just go with what my instinct tells for now.
    connection.query("SELECT `id` FROM `" + config.mysqlDatabase + "`.`maps` ORDER BY `maps`.`id` DESC LIMIT 1", function(error, rows, fields) {
        connection.query("DELETE FROM `" + config.mysqlDatabase + "`.`maps` WHERE `id` > ?", [fields[0].id - 31], function(){
            connection.query("UPDATE `" + config.mysqlDatabase + "`.`stats` SET `current_map_id` = `current_map_id` - 31 WHERE 1", function() {
                // LET THE ENDLESS RECURSION AND CALLBACKING STOP
                process.exit()
            })
        })
    })
}

var checkMap = function(filename, maptoget, body, retries) {
    var act_exist = "1"
    try {
        if (!ibf("maps/elab/" + filename + ".osz")) {
            console.log("Beatmap " + maptoget + " isn't a binary file. Perhaps the beatmap download got removed?")
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
            setTimeout(function() {checkMap(filename, maptoget, body, retries)}, 1000)
    }
    console.log("completed beatmap " + filename)
    mightbeupdated = (body[0].approved > 0 && body[0].approved != 3) ? "0" : "1"
    addMap([maptoget, filename + ".osz", body[0].last_update, act_exist, mightbeupdated, "0"], 0)
}

var getMap = function(consec) {
    consec = typeof consec !== "undefined" ? consec : 0
    // I won't believe you if you tell me more than thirty maps in a row have been deleted.
    if (consec == 30) {
        fixAndClose()
    }
    connection.query("SELECT * FROM `" + config.mysqlDatabase + "`.`stats` WHERE 1", function(error, rows, fields) {
        if (error) throw error
        if (rows.length !== 1) throw ""
        maptoget = rows[0].current_map_id
        request("https://osu.ppy.sh/api/get_beatmaps?k=" + config.apiKey + "&s=" + maptoget, function(err, response, body) {
            if (err !== null) console.log("an error happened while downloading " + filename)
            if (body == "[]") {
                addMap([maptoget, "", "0000-00-00 00:00:00", "0", "0", "0"], consec + 1)
            }
            else {
                try {
                    body = JSON.parse(body)
                }
                catch (ex) {
                    console.log("Seems like cloudflare has meme'd us. Let's try again in 30 seconds.")
                    setTimeout(function() {
                        getMap(consec)
                    }, 30000)
                }
                var filename = sanitize(maptoget + " " + body[0].artist + " - " + body[0].title)
                console.log("Starting download of " + filename)
                request("https://osu.ppy.sh/d/" + maptoget, function(err) {
                    if (err)
                        console.log("Something went horribly wrong when trying to download mapset " + maptoget + "!")
                    console.log("done. checking download worked...")
                    checkMap(filename, maptoget, body, 0)
                }).pipe(fs.createWriteStream("maps/elab/" + filename + ".osz"))
            }
        })
    })
}

exports.mirrorStart = function(fs1, request1, config1, ibf1) {
    fs = fs1
    request = request1
    config = config1
    ibf = ibf1
    connection = mysql.createConnection({
        host     : config.mysqlHost,
        user     : config.mysqlUser,
        password : config.mysqlPassword
    })
    connection.connect(function(err) {
        if (err) throw err
        getMap(0)
    })
}
