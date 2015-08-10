var sqlite = require("sqlite3");
var db = new sqlite.Database("osumirror.db");

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS `maps` ( `id` int(11) NOT NULL, `name` varchar(600) NOT NULL, `saved_version` datetime NOT NULL, " +
         "`act_exist` tinyint(1) NOT NULL, `mightbeupdated` tinyint(1) NOT NULL, `retries` tinyint(4) NOT NULL);");
  db.run("CREATE TABLE IF NOT EXISTS `stats` (`current_map_id` int(11) NOT NULL);");
  db.run("INSERT INTO `stats`(`current_map_id`) VALUES (\"1\");");
});
