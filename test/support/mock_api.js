var restify = require('restify'),
    bunyan = require('bunyan'),
    _ = require('./underscore');

function MockAPI() {

    var _this = this;

    this.log = bunyan.createLogger({
        name: 'mock_api', 
        level: 'debug'
    });

    this.server = restify.createServer({log: this.log});
    this.server.use(restify.requestLogger());
    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser({ mapParams: false }));

    this._route('users');
    this._route('posts');
    this._route('dogs');

    this.reset();
};

MockAPI.prototype.reset = function() {
    this.users = {};
    this.posts = {};
    this.dogs = {};

    this._count = {
        users: 0,
        posts: 0,
        dogs: 0
    };
};

MockAPI.prototype._route = function(resource) {

    var _this = this;

    this.server.get('/' + resource, function(req, res, next) {

        var query;

        if (typeof req.params.query !== 'undefined') {
            query = JSON.parse(req.params.query);
        }

        res.json(_this._all(resource, query));
        next();
    });

    this.server.get('/' + resource + '/:id', function(req, res, next) {

        try {
            var obj = _this._find(resource, parseInt(req.params.id));
            res.json(obj);
            next();
        } catch (err) {
            return next(err);
        }
        
    });
    
    this.server.head('/' + resource + '/:id', function(req, res, next) {
        
        try {
            var obj = _this._find(resource, parseInt(req.params.id));
            res.send(200);
            next();
        } catch (err) {
            return next(err);
        }

    });

    this.server.post('/' + resource, function(req, res, next) {
        var obj = _this._create(resource, req.body);
        res.json(201, obj);
        next();
    });

    this.server.put('/' + resource + '/:id', function(req, res, next) {

        try {
            var obj = _this._update(resource, parseInt(req.params.id), req.body);
            res.json(obj);
            next();
        } catch (err) {
            return next(err);
        }
    });

    this.server.del('/' + resource + '/:id', function(req, rest, next) {
        try {
            _this._delete(resource, parseInt(req.params.id));
            res.send(200);
            next();
        } catch (err) {
            return next(err);
        }

    });

};

MockAPI.prototype._all = function(resource, query) {
    
    var collection = _.values(this[resource]);
    
    if (typeof query !== 'undefined') {

        if (typeof query.where === 'object') {
            collection = _.where(collection, query.where);
        }

        if (typeof query.order === 'string') {

            var order = query.order.match(/^(.+?)(?:\s+(ASC|DESC))?$/);
            var by = order[1],
                direction = order[2];

            collection = _.sortBy(collection, function(e) {
                return e[by];
            });

            if (direction === 'DESC') {
                collection = collection.reverse();
            }

        }
    }

    return collection;
};

MockAPI.prototype._find = function(resource, id) {
    if (this[resource].hasOwnProperty(id)) {
        return this[resource][id];
    } else {
        throw new restify.ResourceNotFoundError('not found');
    }
};

MockAPI.prototype._create = function(resource, obj) {
    ++this._count[resource];
    obj.id = this._count[resource];
    this[resource][obj.id] = obj;

    return obj;
};

MockAPI.prototype._update = function(resource, id, obj) {
    
    if (this[resource].hasOwnProperty(id)) {
        return _.extend(this[resource][id], obj);
    } else {
        throw new restify.ResourceNotFoundError('not found');
    }
    
};

MockAPI.prototype._delete = function(resource, id) {
    if (this[resource].hasOwnProperty(id)) {
        delete this[resource][id];
        --this._count[resource].count;
    } else {
        throw new restify.ResourceNotFoundError('not found');
    }
};

MockAPI.prototype.listen = function(port, callback) {
    var _this = this;

    this.server.listen(port, function() {
        callback.call(_this);
    });
};

module.exports = MockAPI;