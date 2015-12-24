var _ = require('underscore');
var express = require('express');
var Flickr = require('flickrapi');
var flickrOptions = {
  api_key: "c893f0ef29d0d5141acd2626e434ee6b",
  secret: "5e679464ec9b36ca"
};

var photoURL = "https://farm$1.staticflickr.com/$2/$3_$4_$5.jpg";
var router = express.Router();

router.get('/photos', function(req, res) {
  var query = req.query.q;
  var count = req.query.count;

  count = count > 500 ? 500 : count;
  count = count < 1 ? 1 : count;

  var request = {
    content_type: 1,
    safe_search: 1,
    sort: 'relevance',
    media: "photos",
    text: query,
    per_page: count
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
        url = url.replace('$5', 'q');

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

router.get('/photos/:id', function(req, res) {
  Flickr.tokenOnly(flickrOptions, function(error, flickr) {

    var type = req.query.type;

    if (error) {
      error = "error: " + error;
      res.error(error);
      return;
    }

    var query = {photo_id: req.params.id};
    flickr.photos.getInfo(query, function(err, result) {

      if(type === 'cms') {
        var url = photoURL;
        var data = result.photo;
        url = url.replace('$1', data.farm);
        url = url.replace('$2', data.server);
        url = url.replace('$3', data.id);
        url = url.replace('$4', data.secret);
        url = url.replace('$5', req.query.sizing);

        var photo = {
          id: data.id,
          title: data.title._content,
          url: url
        };

        result = photo;
      }

      res.status(200).send(result);
    });
  });
});

module.exports = router;
