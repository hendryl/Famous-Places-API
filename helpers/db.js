var pg = require('pg-then');
var conString = "postgres://gxcwajlqnngmcd:Zwn-y92PuvU3_POXPm4IXjMq-x@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d4kfkhe3k34bbp";

var dev_conString = "postgres://gxcwajlqnngmcd:Zwn-y92PuvU3_POXPm4IXjMq-x@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d4kfkhe3k34bbp?ssl=true";

var db = pg.Pool(dev_conString);

module.exports = db;
