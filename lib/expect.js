import {ControllerPromise} from './controller/functional-test-controller';

export function install(chai) {
  // chai.use(chaiAsPromised);
  chai.use(installFunctionalTestAwareness);
}

function installFunctionalTestAwareness(chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.overwriteMethod('equal', function (_super) {
    return async function (outerExpected) {
      const obj = this._obj;
      if (obj instanceof ControllerPromise) {
        const {controller, method, args} = obj;

        const result = await controller[method].apply(controller, [].slice.apply(args).concat([outerExpected]));
        console.log('result ', result);
        new chai.Assertion(result).to.equal(outerExpected);
      } else {
        _super.apply(this, arguments);
      }
    }
  });
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

