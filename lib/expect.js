import {ControllerPromise} from './controller/functional-test-controller';

export function install(chai) {
  // chai.use(chaiAsPromised);
  chai.use(installFunctionalTestAwareness);
}

function installFunctionalTestAwareness(chai, utils) {
  const {Assertion} = chai;
  const {flag} = utils;

  Assertion.overwriteMethod('equal', overwriteEquals);
  Assertion.overwriteMethod('equals', overwriteEquals);
  Assertion.overwriteMethod('eq', overwriteEquals);

  function overwriteEquals(_super) {
    return async function (outerExpected) {
      const obj = this._obj;
      const isControllerPromise = obj instanceof ControllerPromise;

      if (!isControllerPromise) {
        return _super.apply(this, arguments);
      }

      const {waitForValue} = obj;

      if (!waitForValue) {
        return _super.apply(this, arguments);
      }

      const negate = flag(this, 'negate');
      const condition = negate ?
        value => value != outerExpected :
        value => value == outerExpected;

      const result = await waitForValue(outerExpected, condition);
      console.log('result: ', result, '. expected: ', outerExpected);
      return new chai.Assertion(result).to.equal(outerExpected);
    }
  }
}

// let installed = false;
// /**
//  * @param {function()} valueGetterFn
//  */
// export function expect(valueGetterFn) {
//   if (!installed) {
//     installed = true;
//     chai.use(installFunctionalTestMethods);
//     chai.use(installFunctionalTestAwareness);
//   }

//   if (typeof valueGetterFn !== 'function') {
//     throw new Error('Expect must be a function');
//   }

//   return chaiExpect.apply(null, arguments).dom;
// }


// function installChaiProxy(chai, utils) {
//   chai.Assertion.addChainableMethod('dom', assertDom, chainDom);
//   chai.Assertion.addChainableMethod('selected', assertSelected, chainSelected);
//   chai.Assertion.addChainableMethod('unselected', assertUnselected, chainUnselected);
//   chai.Assertion.addChainableMethod('attribute', assertAttribute, chainAttribute);
//   chai.Assertion.addChainableMethod('property', assertProperty, chainProperty);
//   chai.Assertion.addChainableMethod('cssValue', assertCssValue, chainCssValue);
//   chai.Assertion.addChainableMethod('text', assertText, chainText);
//   chai.Assertion.addChainableMethod('enabled', assertEnabled, chainEnabled);
//   chai.Assertion.addChainableMethod('disabled', assertDisabled, chainDisabled);
// }

// function assertDom() {
//   // make sure we are working with a model
//   new Assertion(this._obj).to.be.an.instanceof(ElementHandle);
// }

// function chainDom() {
//   utils.flag(this, 'dom', true);
// }

