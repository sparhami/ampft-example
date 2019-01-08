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

import {create as createPuppeteer} from './engines/puppeteer';
import {create as createSeleniumWebdriver} from './engines/selenium-webdriver';
import {
  create as createTestcafe,
  cleanupTestFile,
} from './engines/testcafe';
import {PuppeteerController} from './controller/puppeteer-controller';
import {SeleniumWebdriverController} from './controller/selenium-webdriver-controller';
import {TestcafeController} from './controller/testcafe-controller';
import {addErrorToController} from './engines/testcafe-error-handling';
import { textChangeRangeIsUnchanged } from 'typescript';
import {clearLastExpectError, getLastExpectError} from './expect';

/** Should have something in the name, otherwise nothing is shown. */
const SUB = ' ';

const TIMEOUT = 20000;

/**
 * @typedef {{
 *   fakeRegisterElement: (boolean|undefined),
 * }}
 */
export let TestSpec;

export const testcafe =
    describeEnv(spec => [new TestcafeFunctionalFixture(spec)]);

export const selenium =
    describeEnv(spec => [new SeleniumWebdriverFunctionalFixture(spec)]);

export const endtoend = describeEnv(spec => {
  const EngineConstructorMap = {
    'selenium': SeleniumWebdriverFunctionalFixture,
    'testcafe': TestcafeFunctionalFixture,
    'puppeteer': PuppeteerFunctionalFixture,
  };

  const engines = (spec.engines || ['selenium']);
  return engines.map(engine => new EngineConstructorMap[engine](spec));
});

/**
 * We may need to use something like this to make async `it`s work.
 * https://staxmanade.com/2015/11/testing-asyncronous-code-with-mochajs-and-es7-async-await/
 */
export const mochaAsync = (fn) => {
  return done => {
    fn().then(done, err => {
      done(err);
    });
  };
};

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
      let asyncErrorTimerId;
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
        clearLastExpectError();
        clearTimeout(asyncErrorTimerId);
        // Tear down all fixtures.
        fixtures.slice(0).reverse().forEach(fixture => {
          // TODO(cvializ): handle errors better
          // if (this.currentTest.state == 'failed') {
          //   fixture.handleError();
          // }
          fixture.teardown(env);
        });

        // Delete all other keys.
        for (const key in env) {
          delete env[key];
        }
      });

      describe(SUB, function() {
        // If there is an async expect error, throw it in the final state.
        asyncErrorTimerId = setTimeout(() => {
          const lastExpectError = getLastExpectError();
          if (lastExpectError) {
            throw lastExpectError;
          }
        }, this.timeout() - 1);
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

    const {browsers} = spec;
    this.ready_ = createTestcafe({browsers});
  }

  /** @override */
  isOn() {
    return true;
  }

  /** @override */
  setup(env) {
    return this.ready_.then(({testController, runner}) => {
      env.controller = new TestcafeController(testController);
      this.runner_ = runner;
      this.frameworkController_ = testController;
    });
  }

  /** @override */
  teardown(env) {
    // cleanupTestFile();
    // this.runner_.close();
    // this.runner_ = null;
  }

  // handleError(env) {
  //   addErrorToController(this.frameworkController_);
  // }
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
      this.driver_ = testController;
      env.controller = new SeleniumWebdriverController(testController);
    });
  }

  /** @override */
  teardown(env) {
    this.driver_.quit();
    this.driver_ = null;
  }
}


/** @implements {FixtureInterface} */
class PuppeteerFunctionalFixture {

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

    return createPuppeteer({browsers}).then(({browser}) => {
      this.driver_ = browser;
      env.controller = new PuppeteerController(browser);
    });
  }

  /** @override */
  teardown(env) {
    this.driver_.close();
    this.driver_ = null;
  }
}
