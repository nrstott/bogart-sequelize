'use strict'

var bogart = require('bogart');
var _ = require('underscore');
var inflect = require('inflect');

var Resource = bogart.Resource;

function SequelizeResource(Model, name, viewEngine) {
  var sequelizeResource = Object.create(SequelizeResource.prototype);
  Resource.call(sequelizeResource, name, viewEngine);

  sequelizeResource.list = function (limit, offset) {
    return Model
      .findAndCountAll({
        limit: limit,
        offset: offset
      })
      .then(function (findResult) {
        findResult = _.extend({}, findResult, {
          offset: offset,
          limit: limit
        });

        findResult.rows = findResult.rows.map(function (row) {
          row.links = _.extend({}, row.links, {
            edit: sequelizeResource.editLink(row.id),
            show: sequelizeResource.showLink(row.id)
          });

          return row;
        });

        return findResult;
      });
  };

  sequelizeResource.new = function () {
    return Model.build();
  };

  sequelizeResource.edit = function (id) {
    return Model.find(id).then(function (model) {
      if (!model) {
        throw new Resource.HttpError(404, 'Not Found');
      }
    });
  };

  sequelizeResource.create = function (params) {
    return Model.create(params).then(function (model) {
      return model.id;
    });
  };

  sequelizeResource.update = function (id, params) {
    return Model.find(id).then(function (model) {
      return model.updateAttributes(params);
    });
  };

  sequelizeResource.show = function (id) {
    return Model.find(id);
  };

  return sequelizeResource;
}

SequelizeResource.prototype = Object.create(Resource.prototype);

SequelizeResource.create = function (name, modelName) {
  if (modelName === undefined) {
    modelName = inflect.capitalize(name);
  }

  var ctor = function (Model, viewEngine) {
    var sequelizeResource = SequelizeResource(Model, name, viewEngine);

    return sequelizeResource;
  };

  return [ modelName, 'viewEngine', ctor ];
};

module.exports = SequelizeResource;
