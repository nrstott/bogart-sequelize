'use strict'

require('jasmine-node-promises')();

var SequelizeResource = require('../lib/sequelize_resource');

var bogart = require('bogart');
var Resource = require('bogart-resource');
var q = bogart.q;

describe('SequelizeResource', function () {

  describe('constructor', function () {
    var sequelizeResource;

    beforeEach(function () {
      spyOn(Resource, 'call').andCallThrough();

      var Project = {};
      var viewEngine = bogart.viewEngine();

      sequelizeResource = new SequelizeResource(Project, 'project', viewEngine);
    });

    it('should call Resource constructor', function () {
      expect(Resource.call).toHaveBeenCalled();
    });

    it('should be an instance of SequelizeResource', function () {
      expect(sequelizeResource instanceof SequelizeResource).toBe(true);
    });
  });

  describe('list', function () {
    var ID = 123;

    var result, sequelizeResource, Model, viewEngine, limit = 5, offset = 10;

    beforeEach(function (done) {
      var fail = this.fail.bind(this);

      var findAndCountAllResult = q({
        rows: [ { id: ID } ]
      });

      Model = {
        findAndCountAll: jasmine.createSpy('Model#findAndCountAll').andReturn(findAndCountAllResult)
      };

      viewEngine = bogart.viewEngine();

      sequelizeResource = new SequelizeResource(Model, 'model', viewEngine);

      sequelizeResource.list(limit, offset)
        .then(function (listResult) {
          result = listResult;
        })
        .fail(fail)
        .fin(done);
    });

    it('should call findAndCountAll with correct limit', function () {
      expect(getFindAndCountAllOpts().limit).toBe(limit);
    });

    it('should call findAndCountAll with correct offset', function () {
      expect(getFindAndCountAllOpts().offset).toBe(offset);
    });

    it('should have correct edit link', function () {
      expect(result.rows[0].links.edit).toEqual(sequelizeResource.editLink(ID));
    });

    it('should have correct show link', function () {
      expect(result.rows[0].links.show).toEqual(sequelizeResource.showLink(ID));
    });

    it('should have correct limit', function () {
      expect(result.limit).toBe(limit);
    });

    it('should have correct offset', function () {
      expect(result.offset).toBe(offset);
    });

    function getFindAndCountAllOpts() {
      return Model.findAndCountAll.mostRecentCall.args[0];
    }
  });

  describe('new', function () {

    var Model;

    beforeEach(function () {
      Model = {
        build: jasmine.createSpy('Model#build')
      };

      var sequelizeResource = new SequelizeResource(Model, 'model', bogart.viewEngine());

      sequelizeResource.new();
    });

    it('should have called Model#build', function () {
      expect(Model.build).toHaveBeenCalled();
    });
  });

  describe('edit given existing model id', function () {
    var ID = 876;

    var result, Model, model, viewEngine, sequelizeResource;

    beforeEach(function (done) {
      model = { foo: 'bar' };

      Model = createModelWithFind(q(model));

      viewEngine = bogart.viewEngine();

      sequelizeResource = new SequelizeResource(Model, 'model', viewEngine);

      sequelizeResource
        .edit(ID, { foo: 'zap' })
        .then(function (editResult) {
          result = editResult;
        })
        .fin(done);
    });

    it('should call find with correct id', function () {
      expect(Model.find).toHaveBeenCalledWith(ID);
    });
  });

  describe('edit given non-existant model id', function () {
    var ID = 777;

    var rejection, Model, viewEngine, sequelizeResource;

    beforeEach(function (done) {
      Model = createModelWithFind(q(undefined));

      viewEngine = bogart.viewEngine();

      sequelizeResource = new SequelizeResource(Model, 'model', viewEngine);

      sequelizeResource
        .edit(ID)
        .then(void 0, function (editRejection) {
          rejection = editRejection;
        })
        .fin(done);
    });

    it('should reject with HttpError 404', function () {
      expect(rejection).toEqual(new Resource.HttpError(404));
    });
  });

  describe('create', function () {
    var ID = 555;

    var result, Model, params;

    beforeEach(function (done) {
      Model = {
        create: jasmine.createSpy('Model#create').andReturn(q({ id: ID }))
      };

      params = { foo: 'bar', bar: 'baz' };

      var sequelizeResource = new SequelizeResource(Model, 'model', bogart.viewEngine())

      sequelizeResource.create(params)
        .then(function (createResult) {
          result = createResult;
        })
        .fin(done);
    });

    it('should call Model#create with params', function () {
      expect(Model.create).toHaveBeenCalledWith(params);
    });

    it('should return id', function () {
      expect(result).toBe(ID);
    });
  });

  describe('update', function () {
    var ID = 222;

    var result, Model, model, params, updateAttributesResult;

    beforeEach(function (done) {
      updateAttributesResult = {
        id: ID
      };

      model = {
        updateAttributes: jasmine.createSpy('Model#updateAttributes').andReturn(q(updateAttributesResult))
      };

      Model = createModelWithFind(q(model));

      var sequelizeResource = new SequelizeResource(Model, 'model', bogart.viewEngine());

      params = { foo: 'bar' };

      sequelizeResource.update(ID, params)
        .then(function (updateResult) {
          result = updateResult;
        })
        .fin(done);
    });

    it('should call Model::find with correct ID', function () {
      expect(Model.find).toHaveBeenCalledWith(ID);
    });

    it('should call Model#updateAttributes with params', function () {
      expect(model.updateAttributes).toHaveBeenCalledWith(params);
    });

    it('should return update attributes result', function () {
      expect(result).toBe(updateAttributesResult);
    });
  });

  describe('show', function () {
    var ID = 999;

    var result, Model, model;

    beforeEach(function (done) {
      model = { foo: 'bar' };

      Model = createModelWithFind(q(model));

      var sequelizeResource = new SequelizeResource(Model, 'model', bogart.viewEngine());
      sequelizeResource.show(ID)
        .then(function (showResult) {
          result = showResult;
        })
        .fin(done);
    });

    it('should return model', function () {
      expect(result).toBe(model);
    });

    it('should call find with correct id', function () {
      expect(Model.find).toHaveBeenCalledWith(ID);
    });
  });

  function createModelWithFind(findReturn) {
    return {
      find: jasmine.createSpy('Model#find').andReturn(findReturn)
    };
  }
});
