/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  create as createTestcafe,
  cleanupTestFile,
} from './engines/testcafe';
import {create as createSeleniumWebdriver} from './engines/selenium-webdriver';
import {SeleniumWebdriverController} from './controller/selenium-webdriver-controller';
import {TestcafeController} from './controller/testcafe-controller';
import {addErrorToController} from './engines/testcafe-error-handling';

/** Should have something in the name, otherwise nothing is shown. */
const SUB = ' ';

const TIMEOUT = 20000;

/**
 * @typedef {{
 *   fakeRegisterElement: (boolean|undefined),
 * }}
 */
export let TestSpec;


/**
 * An object specifying the configuration of an AmpFixture.
 *
 * - ampdoc: "single", "shadow", "multi", "none", "fie".
 *
 * @typedef {{
 *   runtimeOn: (boolean|undefined),
 *   extensions: (!Array<string>|undefined),
 *   canonicalUrl: (string|undefined),
 *   ampdoc: (string|undefined),
 *   params: (!Object<string, string>|undefined),
 * }}
 */
export let AmpTestSpec;


/**
 * An object containing artifacts of AmpFixture that's returned to test methods.
 * @typedef {{
 *   win: !Window,
 *   extensions: !Extensions,
 *   ampdocService: !AmpDocService,
 *   ampdoc: (!AmpDoc|undefined),
 *   flushVsync: function(),
 * }}
 */
export let AmpTestEnv;


/**
 * A test with a sandbox.
 * @param {string} name
 * @param {!TestSpec} spec
 * @param {function()} fn
 */
export const testcafe = describeEnv(spec => [new TestcafeFunctionalFixture(spec)]);
export const selenium = describeEnv(spec => [new SeleniumWebdriverFunctionalFixture(spec)]);

/**
 * A repeating test.
 * @param {string} name
 * @param {!Object<string, *>} variants
 * @param {function(string, *)} fn
 */
export const repeated = (function() {
  /**
   * @param {string} name
   * @param {!Object<string, *>} variants
   * @param {function(string, *)} fn
   * @param {function(string, function())} describeFunc
   */
  const templateFunc = function(name, variants, fn, describeFunc) {
    return describeFunc(name, function() {
      for (const name in variants) {
        describe(name ? ` ${name} ` : SUB, function() {
          fn.call(this, name, variants[name]);
        });
      }
    });
  };

  /**
   * @param {string} name
   * @param {!Object<string, *>} variants
   * @param {function(string, *)} fn
   */
  const mainFunc = function(name, variants, fn) {
    return templateFunc(name, variants, fn, describe);
  };

  /**
   * @param {string} name
   * @param {!Object<string, *>} variants
   * @param {function(string, *)} fn
   */
  mainFunc.only = function(name, variants, fn) {
    return templateFunc(name, variants, fn, describe./*OK*/only);
  };

  return mainFunc;
})();

/**
 * Returns a wrapped version of Mocha's describe(), it() and only() methods
 * that also sets up the provided fixtures and returns the corresponding
 * environment objects of each fixture to the test method.
 * @param {function(!Object):!Array<?Fixture>} factory
 */
function describeEnv(factory) {
  /**
   * @param {string} name
   * @param {!Object} spec
   * @param {function(!Object)} fn
   * @param {function(string, function())} describeFunc
   */
  const templateFunc = function(name, spec, fn, describeFunc) {
    const fixtures = [];
    factory(spec).forEach(fixture => {
      if (fixture && fixture.isOn()) {
        fixtures.push(fixture);
      }
    });
    return describeFunc(name, function() {
      const env = Object.create(null);
      this.timeout(TIMEOUT);
      beforeEach(() => {
        let totalPromise = undefined;
        // Set up all fixtures.
        fixtures.forEach((fixture, unusedIndex) => {
          if (totalPromise) {
            totalPromise = totalPromise.then(() => fixture.setup(env));
          } else {
            const res = fixture.setup(env);
            if (res && typeof res.then == 'function') {
              totalPromise = res;
            }
          }
        });
        return totalPromise;
      });

      afterEach(function () {
        // Tear down all fixtures.
        fixtures.slice(0).reverse().forEach(fixture => {
          debugger;
          if (this.currentTest.state == 'failed') {
            fixture.handleError();
          }
          fixture.teardown(env);
        });

        // Delete all other keys.
        for (const key in env) {
          delete env[key];
        }
      });

      describe(SUB, function() {
        fn.call(this, env);
      });
    });
  };

  /**
   * @param {string} name
   * @param {!Object} spec
   * @param {function(!Object)} fn
   */
  const mainFunc = function(name, spec, fn) {
    return templateFunc(name, spec, fn, describe);
  };

  /**
   * @param {string} name
   * @param {!Object} spec
   * @param {function(!Object)} fn
   */
  mainFunc.only = function(name, spec, fn) {
    return templateFunc(name, spec, fn, describe./*OK*/only);
  };

  mainFunc.skip = function(name, variants, fn) {
    return templateFunc(name, variants, fn, describe.skip);
  };

  return mainFunc;
}


/** @interface */
class FixtureInterface {

  /** @return {boolean} */
  isOn() {}

  /**
   * @param {!Object} env
   * @return {!Promise|undefined}
   */
  setup(unusedEnv) {}

  /**
   * @param {!Object} env
   */
  teardown(unusedEnv) {}

  handleError() {}
}


/** @implements {FixtureInterface} */
class TestcafeFunctionalFixture {

  /** @param {!TestSpec} spec */
  constructor(spec) {
    /** @const */
    this.spec = spec;

    /** @const */
    this.runner_ = null;

    this.frameworkController_ = null;
  }

  /** @override */
  isOn() {
    return true;
  }

  /** @override */
  setup(env) {
    const {browsers} = this.spec;

    return createTestcafe({browsers}).then(({testController, runner}) => {
      env.controller = new TestcafeController(testController);
      this.runner_ = runner;
      this.frameworkController_ = testController;
    });
  }

  /** @override */
  teardown(env) {
    cleanupTestFile();
    this.runner_.close();
  }

  handleError(env) {
    addErrorToController(this.frameworkController_);
  }
}


/** @implements {FixtureInterface} */
class SeleniumWebdriverFunctionalFixture {

  /** @param {!TestSpec} spec */
  constructor(spec) {
    /** @private @const */
    this.spec = spec;

    /** @private */
    this.driver_ = null;
  }

  /** @override */
  isOn() {
    return true;
  }

  /** @override */
  setup(env) {
    const {browsers} = this.spec;

    return createSeleniumWebdriver({browsers}).then(({testController}) => {
      this.driver_ = new SeleniumWebdriverController(testController);
      env.controller = this.driver_;
    });
  }

  /** @override */
  teardown(env) {
    // this.driver_.browser.quit();
  }

  handleError() {

  }
}
