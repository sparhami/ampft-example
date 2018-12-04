import chai, {expect as chaiExpect} from 'chai';
import {ControllerPromise} from './controller/functional-test-controller';

let installed;
/**
 *
 * @param {*} actual
 * @param {string=} opt_message
 * @return
 */
export function expect(actual, opt_message) {
  if (!installed) {
    installed = true;
    chai.use(installFunctionalTestAwareness);
  }
  return chaiExpect(actual, opt_message);
}

function installFunctionalTestAwareness(chai, utils) {
  const {Assertion} = chai;
  const {flag} = utils;

  Assertion.overwriteMethod('equal', overwriteEquals);
  Assertion.overwriteMethod('equals', overwriteEquals);
  Assertion.overwriteMethod('eq', overwriteEquals);
  Assertion.overwriteChainableMethod('include', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteChainableMethod('includes', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteChainableMethod('contain', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteChainableMethod('contains', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteMethod('match', overwriteMatches);
  Assertion.overwriteMethod('matches', overwriteMatches);

  function overwriteEquals(_super) {
    return async function (outerExpected) {
      const obj = this._obj;
      const isControllerPromise = obj instanceof ControllerPromise;
      if (!isControllerPromise) {
        return _super.apply(this, arguments);
      }
      const {waitForValue} = obj;
      if (!waitForValue) {
        const result = await obj;
        flag(this, 'object', result);
        return _super.apply(this, arguments);
      }

      const condition = flag(this, 'negate') ?
        value => value != outerExpected :
        value => value == outerExpected;
      flag(this, 'object', await waitForValue(outerExpected, condition));
      return _super.apply(this, arguments);
    }
  }

  function overwriteInclude(_super) {
    return async function (outerExpected) {
      const obj = this._obj;
      const isControllerPromise = obj instanceof ControllerPromise;
      if (!isControllerPromise) {
        return _super.apply(this, arguments);
      }
      const {waitForValue} = obj;
      if (!waitForValue) {
        const result = await obj;
        flag(this, 'object', result);
        return _super.apply(this, arguments);
      }

      const condition = flag(this, 'negate') ?
        value => value.indexOf(outerExpected) == -1 :
        value => value.indexOf(outerExpected) > -1;
      flag(this, 'object', await waitForValue(outerExpected, condition));
      return _super.apply(this, arguments);
    }
  }

  function overwriteMatches(_super) {
    return async function (outerExpected) {
      const obj = this._obj;
      const isControllerPromise = obj instanceof ControllerPromise;
      if (!isControllerPromise) {
        return _super.apply(this, arguments);
      }
      const {waitForValue} = obj;
      if (!waitForValue) {
        flag(this, 'object', await obj);
        return _super.apply(this, arguments);
      }

      const condition = flag(this, 'negate') ?
        value => !outerExpected.exec(value) :
        value => outerExpected.exec(value);
      flag(this, 'object', await waitForValue(outerExpected, condition));
      return _super.apply(this, arguments);
    }
  }
}

function inheritChainingBehavior(_super) {
  return function() {
    _super.apply(this, arguments);
  };
}
