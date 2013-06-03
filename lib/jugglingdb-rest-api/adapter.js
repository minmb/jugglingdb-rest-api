'use strict';

var jdb = require('jugglingdb'),
    restify = require('restify'),
    inflection = require('inflection');

exports.initialize = function(schema, callback) {

    var options = {
        accept:             undefined,
        connectTimeout:     undefined,
        url:                undefined,
        userAgent:          undefined,
        version:            undefined
    };

    var settings = schema.settings || {};

    for (var key in options) {
        if (settings.hasOwnProperty(key)) {
            options[key] = settings[key];
        }
    }

    schema.adapter = new RestAPI(options);

    callback();
};

function RestAPI(options) {
    this._models = {};
    this.client = restify.createJSONClient(options);
}

RestAPI.prototype._url = function(model, id_or_query) {

    var resource = inflection.underscore(inflection.pluralize(model));
    var url = '/' + resource;

    if (typeof id_or_query === 'object' && id_or_query !== null) {
        url += '?query=' + JSON.stringify(id_or_query);
    } else if (id_or_query) {
        url += '/' + id_or_query;
    }

    return url;

};

RestAPI.prototype.define = function(descr) {
    if (!descr.settings) descr.settings = {};
    this._models[descr.model.modelName] = descr;
};

RestAPI.prototype.defineProperty = function(model, prop, params) {
    this._models[model].properties[prop] = params;
};

RestAPI.prototype.create = function(model, obj, callback) {

    this.client.post(this._url(model), obj, function(err, req, res, obj) {
        callback(err, obj.id || obj);
    });

};

RestAPI.prototype.save = function(model, obj, callback) {

    this.client.put(this._url(model, obj.id), obj, function(err, req, res, obj) {
        callback(err, obj);
    });

};

RestAPI.prototype.updateAttributes = function(model, id, obj, callback) {

    obj.id = id;
    this.save(model, obj, callback);

};

RestAPI.prototype.destroy = function(model, id, callback) {

    this.client.del(this._url(model, id), function(err, req, res) {
        callback(err);
    });

};

RestAPI.prototype.exists = function(model, id, callback) {

    this.client.head(this._url(model, id), function(err, req, res) {

        if (res.statusCode === 404) {
            callback(null, false);
        } else if (!err) {
            callback(null, true);
        } else {
            callback(err);
        }

    });

};

RestAPI.prototype.find = function find(model, id, callback) {

    this.client.get(this._url(model, id), function(err, req, res, obj) {
        callback(err, Object.keys(obj).length === 0 || err ? null : obj);
    });

};

RestAPI.prototype.all = function all(model, query, callback) {
    
    this.client.get(this._url(model, query), function(err, req, res, collection) {
        callback(err, collection);
    });

};

RestAPI.prototype.destroyAll = function(model, callback) {
    throw new Error('Not supported');
};

RestAPI.prototype.count = function(model, callback, query) {
    throw new Error('Not supported');
};