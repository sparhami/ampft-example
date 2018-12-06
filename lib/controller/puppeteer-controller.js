
import {
  Browser,
  ElementHandle as PuppeteerHandle
} from 'puppeteer';
import {
  ControllerPromise,
  ElementHandle,
  FunctionalTestController,
} from './functional-test-controller';

const KeysMapping = {
  'ENTER': 'Enter',
}

/**
 * Make the test runner wait until the value returned by the valueFn matches
 * the given condition.
 * @param {function(): !Promise<T>} valueFn
 * @param {function(T): ?T} condition
 * @return {!Promise<?T>}
 * @template T
 */
async function waitFor(page, valueFn, args, condition) {
  const conditionValue = value => condition(value) ? value : null;
  let value = await evaluate(page, valueFn, ...args);

  while (conditionValue(value) === null) {
    const result = await page.waitForFunction.apply(
        page, [valueFn, {}].concat(args));
    value = await result.jsonValue();
  }

  return value;
}

function evaluate(page, fn) {
  const args = Array.prototype.slice.call(arguments, 2);
  return page.evaluate(fn, ...args);
}

function timeout(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/** @implements {FunctionalTestController} */
export class PuppeteerController {
  /**
   * @param {!Browser} browser
   */
  constructor(browser) {
    this.browser = browser;

    this.page_ = null;
  }

  async on(eventName, cb) {
    const page = await this.getPage_();
    const result = await page.evaluate(eventName => {
      const handler = value => {
        document.removeEventListener(eventName, handler);
        resolve(value);
      };
      return new Promise(resolve => {
        document.addEventListener(eventName, handler);
      });
    }, eventName);
    cb(result);
  }

  async getPage_() {
    if (!this.page_) {
      this.page_ = await this.browser.newPage();
      await this.page_.setViewport({width: 1024, height: 768});
    }
    return this.page_;
  }

  /**
   * Return a wait function. When called, the function will cause the test
   * runner to wait until the given value matches the expected value.
   * @param {function(): !Promise<?T>} valueFn
   * @return {function(T,T): !Promise<?T>}
   * @template T
   */
  getWaitFn_(valueFn) {
    const args = Array.prototype.slice.call(arguments, 1);

    /**
     * @param {function(T): ?T} condition
     * @return {!Promise<?T>}
     */
    return async condition => {
      const page = await this.getPage_();
      return waitFor(page, valueFn, args, condition);
    }
  }

  /**
   * Helper function to evaluate a function in the context of the document.
   * @param {function()} fn
   */
  async evaluate_(fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    const page = await this.getPage_();
    return await evaluate(page, fn, ...args);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!PuppeteerHandle>>}
   * @override
   */
  async findElement(selector) {
    const page = await this.getPage_();
    const elementHandle = await page.waitForSelector(selector);

    return new ElementHandle(elementHandle, this);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle<!PuppeteerHandle>>>}
   * @override
   */
  async findElements(selector) {
    const page = await this.getPage_();
    await page.waitForSelector(selector);

    const elementHandles = await page.$$(selector);
    return elementHandles.map(
        elementHandle => new ElementHandle(elementHandle, this));
  }

  /**
   * @param {string} url
   * @return {!Promise}
   * @override
   */
  async navigateTo(location) {
    const page = await this.getPage_();
    await page.goto(location, {waitUntil: 'networkidle0'});
  }

  /**
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @param {string} keys
   * @return {!Promise}
   * @override
   */
  async type(handle, keys) {
    const page = await this.getPage_();
    const targetElement = handle ?
      handle.getElement() :
      await page.$(':focus');


    const key = KeysMapping[keys.toUpperCase()];
    if (key) {
      await targetElement.press(key);
      return;
    }

    await targetElement.type(keys);
  }

  /**
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @return {!Promise<string>}
   * @override
   */
  getElementText(handle) {
    const element = handle.getElement();
    const getter = element => element.textContent;
    return new ControllerPromise(
        this.evaluate_(getter, element),
        this.getWaitFn_(getter, element));
  }

  /**
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @param {string} attribute
   * @return {!Promise<string>}
   * @override
   */
  getElementAttribute(handle, attribute) {
    const element = handle.getElement();
    const getter = (element, attribute) => element.getAttribute(attribute);
    return new ControllerPromise(
        this.evaluate_(getter, element, attribute),
        this.getWaitFn_(getter, element, attribute));
  }

  /**
   * @return {!Promise<string>}
   * @override
   */
  getTitle() {
    const title = this.getPage_()
        .then(page => page.waitForFunction(() => document.title))
        .then(result => result.jsonValue());
    return new ControllerPromise(title);
  }

  /**
   * TODO(cvializ): decide if we need to waitForNavigation on click and keypress
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @return {!Promise}
   * @override
   */
  click(handle) {
    return handle.getElement().click();
  }
}
