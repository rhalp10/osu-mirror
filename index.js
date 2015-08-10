console.log("osu!mirror started. loading modules...")

var fs = require("fs")
var request = require("request")
request = request.defaults({ jar: true })
var config = require("./config")
var ibf = require("isbinaryfile")
var mirror = require("./mirror")

console.log("finished loading.")

// On https://osu.ppy.sh/forum/ucp.php?mode=login there is a form, that has these elements.
// This object essentially contains the data to send to the osu! server for logging in.
var loginObject = { 
  username: config.user, 
  password: config.password, 
  autologin: "on", 
  sid: "",
  redirect: "index.php",
  viewonline: "off",
  login: "Login"
}

console.log("logging in...")
// Making a POST request to the URL https://osu.ppy.sh/forum/ucp.php?mode=login, sending the data in loginObject.
request.post({ url: "https://osu.ppy.sh/forum/ucp.php?mode=login", form: loginObject }, function(err,httpResponse,body) {
  if (err === null)
    console.log("Page downloading success!")
  else
    throw ""

  console.log("now downloading test beatmap...")
  request("https://osu.ppy.sh/d/194239n", function() {
    console.log("done. checking download worked...")
    if (!ibf("maps/test/test-beatmap.osz")) {
      console.log("Something went wrong. The test beatmap isn't a binary file. Perhaps you wrote the wrong password?")
    }
    console.log("It seems to have worked! Now starting.")
    mirror.mirrorStart(fs, request, config, ibf)
  }).pipe(fs.createWriteStream("maps/test/test-beatmap.osz"))
})
