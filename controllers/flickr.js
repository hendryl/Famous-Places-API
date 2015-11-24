var _ = require('underscore');
var express = require('express');
var Flickr = require('flickrapi');
var flickrOptions = {
  api_key: "c893f0ef29d0d5141acd2626e434ee6b",
  secret: "5e679464ec9b36ca"
};

var photoURL = "https://farm$1.staticflickr.com/$2/$3_$4_z.jpg";
var router = express.Router();

router.get('/photos', function(req, res) {

  res.set('api_key', flickrOptions.api_key);
  res.set('secret', flickrOptions.secret);

  var query = req.query.q;
  var request = {
    content_type: 1,
    safe_search: 1,
    sort: 'relevance',
    text: query
  };

  Flickr.tokenOnly(flickrOptions, function(error, flickr) {
    flickr.photos.search(request, function(err, result) {
      if (err) {
        var error = "error: " + err;
        console.log(error);
        res.error(error);
        return;
      }

      var photos = result.photos.photo;
      var response = [];
      _.each(photos, function(data) {
        var url = photoURL;
        url = url.replace('$1', data.farm);
        url = url.replace('$2', data.server);
        url = url.replace('$3', data.id);
        url = url.replace('$4', data.secret);

        var photo = {
          id: data.id,
          title: data.title,
          url: url
        };

        response.push(photo);
      });

      res.status(200).send(response);
    });
  });
});

module.exports = router;
