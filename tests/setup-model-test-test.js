import Ember from 'ember';
import DS from 'ember-data';
import { setupModelTest } from 'ember-mocha';
import { setResolverRegistry } from 'tests/test-support/resolver';
import { describe, it } from 'mocha';

const { expect } = window.chai;

/* globals Pretender */

var Whazzit = DS.Model.extend({ gear: DS.attr('string') });
var whazzitAdapterFindAllCalled = false;
var WhazzitAdapter = DS.FixtureAdapter.extend({
  findAll: function(/* store, type */) {
    whazzitAdapterFindAllCalled = true;
    return this._super.apply(this, arguments);
  }
});

var ApplicationAdapter = DS.JSONAPIAdapter || DS.FixtureAdapter;

function setupRegistry() {
  setResolverRegistry({
    'model:whazzit': Whazzit,
    'adapter:whazzit': WhazzitAdapter,
    'adapter:application': ApplicationAdapter
  });
}

///////////////////////////////////////////////////////////////////////////////

describe('setupModelTest', function() {

  describe('model:whazzit without adapter', function() {
    setupModelTest('whazzit', {

      beforeSetup: function() {
        setupRegistry();
      },

      setup: function() {
        Whazzit.FIXTURES = [];
      }
   });

    it('store exists', function() {
      var store = this.store();
      expect(store).to.be.an.instanceof(DS.Store);
    });

    it('model exists as subject', function() {
      var model = this.subject();
      expect(model).to.exist;
      expect(model).to.be.an.instanceof(DS.Model);
      expect(model).to.be.an.instanceof(Whazzit);
    });

    it('model is using the FixtureAdapter', function() {
      var model = this.subject(),
        store = this.store(),
        adapter = DS.JSONAPIAdapter || DS.FixtureAdapter;

      expect(store.adapterFor(model.constructor)).to.be.an.instanceof(adapter);
      expect(store.adapterFor(model.constructor)).to.not.be.an.instanceof(WhazzitAdapter);
    });
  });


  ///////////////////////////////////////////////////////////////////////////////

  describe('model:whazzit with custom adapter', function() {
    setupModelTest('whazzit', {
      needs: ['adapter:whazzit'],

      beforeSetup: function() {
        setupRegistry();
      },

      setup: function() {
        Whazzit.FIXTURES = [];
        if (DS.JSONAPIAdapter && ApplicationAdapter === DS.JSONAPIAdapter) {
          new Pretender(function() {
            this.get('/whazzits', function(/* request */) {
              return [200, {"Content-Type": "application/json"}, JSON.stringify({ data: Whazzit.FIXTURES })];
            });
          });
        }
        whazzitAdapterFindAllCalled = false;
      }
    });

    it('uses the WhazzitAdapter', function() {
      var model = this.subject(),
        store = this.store();

      expect(store.adapterFor(model.constructor)).to.be.an.instanceof(WhazzitAdapter);
    });

    it('uses the WhazzitAdapter for a `findAll` request', function(done) {
      var store = this.store();

      expect(whazzitAdapterFindAllCalled).to.be.false;

      store = this.store();

      return Ember.run(function() {
        return store.findAll('whazzit', { reload: true }).then(function() {
          expect(whazzitAdapterFindAllCalled).to.be.true;
          done();
        });
      });
    });
  });

  ///////////////////////////////////////////////////////////////////////////////

  describe('model:whazzit with application adapter', function() {
    setupModelTest('whazzit', {
      needs: ['adapter:application'],

      beforeSetup: function() {
        setupRegistry();
      },

      setup: function() {
        Whazzit.FIXTURES = [];
      }
    });

    it('uses the ApplicationAdapter', function() {
      var model = this.subject(),
          store = this.store();

      expect(store.adapterFor(model.constructor)).to.be.an.instanceof(ApplicationAdapter);
      expect(store.adapterFor(model.constructor)).to.not.be.an.instanceof(WhazzitAdapter);
    });
  });
});
