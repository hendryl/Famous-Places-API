var expect = require("expect.js");
var request = require("supertest");

describe('Loading express', function() {
  var server;

  beforeEach(function() {
    delete require.cache[require.resolve('../app')];
    server = require('../app');
  });

  afterEach(function() {
    server.close();
  });

  describe('Testing index route', function() {
    it('responds to /api/', function(done) {
      request(server)
      .get('/api/')
      .expect(200)
      .expect({message: "This is the Famous Places API"}, done);
    });
  });
});
