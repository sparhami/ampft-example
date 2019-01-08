import {ClientFunction, Selector, TestController} from 'testcafe';
import {
  ControllerPromise,
  ElementHandle,
  FunctionalTestController,
} from './functional-test-controller';

/**
 * TODO(cvializ);
 * Are the more objects with `with` functions than ClientFunction and Selector?
 * @record
 */
class Withable {
  /**
   * @template THIS
   * @this {THIS}
   * @return {THIS}
   * @param {!Object} config
   */
  with(config) {}
}

/**
 * @param {T} toBind
 * @param {TestController} testRun
 * @return {T}
 */
function bindTestRun(toBind, testRun) {
  return /** @type {T} */ (
    /** @type {Withable} */ (toBind.with({boundTestRun: testRun}))
  );
}

/** @implements {FunctionalTestController} */
export class TestcafeController {
  /**
   * @param {TestController} t
   */
  constructor(t) {
    /** @private */
    this.t = t;
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!Selector>>}
   * @override
   */
  async findElement(selector) {
    const elementSelector = await bindTestRun(Selector(selector).nth(0), this.t);
    return new ElementHandle(elementSelector);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle<!Selector>>>}
   * @override
   */
  async findElements(selector) {
    const elementSelector = await bindTestRun(Selector(selector).nth(0), this.t);
    const results = [];
    const length = elementSelector.count;

    for (let i = 0; i < length; i++) {
      results.push(new ElementHandle(elementSelector.nth(i)));
    }
    return results;
  }

  /** @override */
  async navigateTo(location) {
    await this.t.navigateTo(location);
  }

  /**
   * @param {?ElementHandle<!Selector>} handle
   * @param {string} keys
   * @return {!Promise}
   * @override
   */
  async type(handle, keys) {
    if (!handle) {
      await this.t.pressKey(keys);
      return;
    }

    await this.t.typeText(handle.getElement(), keys);
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @return {!Promise<string>}
   * @override
   */
  getElementText(handle) {
    return new ControllerPromise(handle.getElement().innerText);
  }

  // /**
  //  * Return a wait function. When called, the function will cause the test
  //  * runner to wait until the given value matches the expected value.
  //  * @param {function(): !Promise<?T>} valueFn
  //  * @return {function(T,T): !Promise<?T>}
  //  * @template T
  //  */
  // getWaitFn_(valueFn) {
  //   /**
  //    * @param {function(T): ?T} condition
  //    * @return {!Promise<?T>}
  //    */
  //   return async (condition, opt_mutate) => {
  //     opt_mutate = opt_mutate || (x => x);
  //     const value = opt_mutate(await valueFn());
  //     return this.t.expect(condition((value))).ok() ? value : null;
  //   }
  // }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @param {string} attribute
   * @return {!Promise<string>}
   * @override
   */
  getElementAttribute(handle, attribute) {
    return new ControllerPromise(handle.getElement().getAttribute(attribute));
        // handle.getElement().getAttribute(attribute),
        // this.getWaitFn_(() => handle.getElement().getAttribute(attribute)));
  }

  /** @override */
  getTitle() {
    const getter = ClientFunction(() => document.title, {boundTestRun: this.t});
    return new ControllerPromise(getter());
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @return {!Promise}
   * @override
   */
  async click(handle) {
    return await this.t.click(handle.getElement());
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @return {!Promise}
   * @private
   */
  async switchToFrame_(handle) {
    const element = handle.getElement();
    await this.t.switchToIframe(element);
  }

  /**
   * @return {!Promise}
   * @private
   */
  async switchToParent_() {
    await this.t.switchToMainWindow();
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @param {function():(!Promise|undefined)} fn
   * @return {!Promise}
   * @override
   */
  async usingFrame(handle, fn) {
    await this.switchToFrame_(handle);
    await fn();
    await this.switchToParent_();
  }
}
