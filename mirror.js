// The actual mirror that starts after a connection to the osu! has been enstabilished and confirmed.

var mysql = require("mysql")
var deasync = require("deasync")
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
var getMap = function(consec) {
    consec = typeof consec !== "undefined" ? consec : 0
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
                body = JSON.parse(body)
                var filename = sanitize(maptoget + " " + body[0].artist + " - " + body[0].title)
                console.log("Starting download of " + filename)
                request("https://osu.ppy.sh/d/" + maptoget, function(err) {
                    if (err) console.log("Something went horribly wrong when trying to download mapset " + maptoget + "!")
                    var act_exist = "1"
                    console.log("done. checking download worked...")
                    var ibf = require("isbinaryfile")
                    if (!ibf("maps/out/" + filename + ".osz")) {
                        console.log("Something went wrong. The test beatmap isn't a binary file. Perhaps the beatmap download got removed?")
                        act_exist = "0"
                        fs.unlink("maps/out/" + filename + ".osz")
                    }
                    console.log("completed beatmap " + filename)
                    mightbeupdated = body[0].approved > 0 ? "0" : "1"
                    addMap([maptoget, filename + ".osz", body[0].last_update, act_exist, mightbeupdated, "0"], 0)
                }).pipe(fs.createWriteStream("maps/out/" + filename + ".osz"))
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
