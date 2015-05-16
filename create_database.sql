CREATE TABLE IF NOT EXISTS `maps` (
  `id` int(11) NOT NULL,
  `name` varchar(128) NOT NULL,
  `saved_version` datetime NOT NULL,
  `act_exist` tinyint(1) NOT NULL,
  `mightbeupdated` tinyint(1) NOT NULL,
  `retries` tinyint(4) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `stats` (
  `current_map_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `stats`(`current_map_id`) VALUES ("1")
