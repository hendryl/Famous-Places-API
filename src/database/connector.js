class DatabaseConnector {
  constructor() {

    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: "ap-cdbr-azure-southeast-a.cloudapp.net",
      user: "bde8cb8240112c",
      password: "a5d9fcce",
      port: 3306,
      database: "famousplacesdb"
    });

    var disconnect = function() {
      connection.end(function(err) {
        if (err) {
          throw err;
        }
      });
    };

    this.query = function(query) {
      connection.query(query, function(err, rows, fields) {
        if (err) {
          console.log(err);
          throw err;
        }

        console.log("Query successful");

        disconnect();
      });
    };

    this.queryWithValues = function(query, values) {
      connection.query(query, values, function(err, rows, fields) {
        if (err) {
          throw err;
        }

        console.log("Query with values successful");

        disconnect();
      });
    };
  };
}

export default DatabaseConnector;
