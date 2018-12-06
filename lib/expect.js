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
  }

  return chaiExpect(actual, opt_message);
}

function installEqualWrapper(chai, utils) {
  const {Assertion} = chai;

  const equalsCondition = (expected, value) => value == expected;
  const overwriteEquals = overwriteWithCondition(utils, equalsCondition);
  Assertion.overwriteMethod('equal', overwriteEquals);
  Assertion.overwriteMethod('equals', overwriteEquals);
  Assertion.overwriteMethod('eq', overwriteEquals);
}

function installIncludeWrapper(chai, utils) {
  const {Assertion} = chai;

  const includeCondition = (expected, value) => value.indexOf(expected) > -1;
  const overwriteInclude = overwriteWithCondition(utils, includeCondition);
  Assertion.overwriteChainableMethod(
      'include', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'includes', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'contain', overwriteInclude, inheritChainingBehavior);
  Assertion.overwriteChainableMethod(
      'contains', overwriteInclude, inheritChainingBehavior);
}

function installMatchWrapper(chai, utils) {
  const {Assertion} = chai;

  const matchCondition = (expected, value) => expected.exec(value);
  const overwriteMatch = overwriteWithCondition(utils, matchCondition);
  Assertion.overwriteMethod('match', overwriteMatch);
  Assertion.overwriteMethod('matches', overwriteMatch);
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

      const boundCondition = condition.bind(null, expected);
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
