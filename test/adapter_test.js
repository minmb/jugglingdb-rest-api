var jdb = require('jugglingdb'),
    Schema = jdb.Schema,
    test = jdb.test;

var schema = new Schema('rest-api', {
    url: 'http://127.0.0.1:8080'
});

test(module.exports, schema);