import {ClientFunction, Selector, TestController} from 'testcafe';
import {
  ElementHandle,
  FunctionalTestController,
} from './functional-test-controller';

const getTitle = ClientFunction(() => document.title);

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

    /** @private */
    this.getTitle_ = bindTestRun(getTitle, this.t);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!Selector>>}
   * @override
   */
  async findElement(selector) {
    const elementHandle = await bindTestRun(Selector(selector).nth(0), this.t);
    return new ElementHandle(elementHandle);
  }

  /** @override */
  async navigateTo(location) {
    this.t.navigateTo(location);
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
  async getElementText(handle) {
    return await handle.getElement().innerText;
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @param {string} attribute
   * @return {!Promise<string>}
   * @override
   */
  async getElementAttribute(handle, attribute) {
    return await handle.getElement().getAttribute(attribute);
  }


  /** @override */
  async getTitle() {
    return await this.getTitle_();
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @return {!Promise}
   * @override
   */
  async click(handle) {
    return await this.t.click(handle.getElement());
  }
}
