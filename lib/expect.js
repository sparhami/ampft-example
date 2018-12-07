import chai, {expect as chaiExpect} from 'chai';
import {ControllerPromise} from './controller/functional-test-controller';

let installed;
/**
 * @param {*} actual
 * @param {string=} opt_message
 * @return
 */
export function expect(actual, opt_message) {
  if (!installed) {
    installed = true;
    // See https://www.chaijs.com/guide/helpers/ for details on implementation
    chai.use(installEqualWrapper);
    chai.use(installIncludeWrapper);
    chai.use(installMatchWrapper);
    chai.use(installLengthWrapper)
    chai.use(installAboveWrapper);
    chai.use(installBelowWrapper);
  }

  return chaiExpect(actual, opt_message);
}

function installEqualWrapper(chai, utils) {
  const {Assertion} = chai;

  const condition = (expected, value) => value == expected;
  const overwrite = overwriteWithCondition(utils, condition);
  Assertion.overwriteMethod('equal', overwrite);
  Assertion.overwriteMethod('equals', overwrite);
  Assertion.overwriteMethod('eq', overwrite);
}

function installIncludeWrapper(chai, utils) {
  const {Assertion} = chai;

  const condition = (expected, value) => value.indexOf(expected) > -1;
  const overwrite = overwriteWithCondition(utils, condition);
  Assertion.overwriteChainableMethod(
      'include', overwrite, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'includes', overwrite, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'contain', overwrite, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'contains', overwrite, inheritChainingBehavior);
}

function installMatchWrapper(chai, utils) {
  const {Assertion} = chai;

  const matchCondition = (expected, value) => expected.exec(value);
  const overwriteMatch = overwriteWithCondition(utils, matchCondition);
  Assertion.overwriteMethod('match', overwriteMatch);
  Assertion.overwriteMethod('matches', overwriteMatch);
}

function installLengthWrapper(chai, utils) {
  const {Assertion} = chai;

  const condition = (expected, value) => value.length == expected;
  const overwrite = overwriteWithCondition(utils, condition);
  Assertion.overwriteChainableMethod(
      'length', overwrite, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'lengthOf', overwrite, inheritChainingBehavior);
}

function installAboveWrapper(chai, utils) {
  const {Assertion} = chai;
  const {flag} = utils;

  const condition = function(expected, value) {
    if (flag(this, 'doLength')) {
      value = value.length;
    }
    return value > expected;
  };
  const overwrite = overwriteWithCondition(utils, condition);
  Assertion.overwriteMethod('above', overwrite);
  Assertion.overwriteMethod('gt', overwrite);
  Assertion.overwriteMethod('greaterThan', overwrite);
}

function installBelowWrapper(chai, utils) {
  const {Assertion} = chai;
  const {flag} = utils;

  const condition = function(expected, value) {
    if (flag(this, 'doLength')) {
      value = value.length;
    }
    return value < expected;
  };
  const overwrite = overwriteWithCondition(utils, condition);
  Assertion.overwriteMethod('below', overwrite);
  Assertion.overwriteMethod('lt', overwrite);
  Assertion.overwriteMethod('lessThan', overwrite);
}


function overwriteWithCondition(utils, condition) {
  const {flag} = utils;

  return function(_super) {
    return async function (expected) {
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

      const boundCondition = condition.bind(this, expected);
      const maybeNegatedCondition = flag(this, 'negate') ?
        value => !boundCondition(value) : boundCondition;
      flag(this, 'object', await waitForValue(maybeNegatedCondition));

      return _super.apply(this, arguments);
    }
  }
}

function inheritChainingBehavior(_super) {
  return function() {
    _super.apply(this, arguments);
  };
}
