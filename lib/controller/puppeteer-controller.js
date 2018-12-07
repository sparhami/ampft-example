
import {
  Browser,
  Page,
  ElementHandle as PuppeteerHandle,
  JSHandle,
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
 * @param {!Page} page
 * @param {function(): !Promise<T>} valueFn
 * @param {!IArrayLike<*>} args
 * @param {function(T):boolean} condition
 * @return {!Promise<?T>}
 * @template T
 */
async function waitFor(page, valueFn, args, condition, opt_mutate) {
  let value = await evaluate(page, valueFn, ...args);
  if (opt_mutate) {
    value = opt_mutate(value);
  }

  while (!condition(value)) {
    const handle = await page.waitForFunction.call(page, valueFn, {}, ...args);
    value = await handle.jsonValue();
    if (opt_mutate) {
      value = opt_mutate(value);
    }
  }
  return value;
}

/**
 * Evaluate the given function and its arguments in the context of the document.
 * @param {!Page} page
 * @param {function(...*):*} fn
 * @param {...*} fnArgs Variadic arguments
 * @return {!Promise<!JSHandle>}
 */
function evaluate(page, fn) {
  const args = Array.prototype.slice.call(arguments, 2);
  return page.evaluate(fn, ...args);
}

/** @implements {FunctionalTestController} */
export class PuppeteerController {
  /**
   * @param {!Browser} browser
   */
  constructor(browser) {
    /** @private @const */
    this.browser_ = browser;

    /** @private */
    this.page_ = null;
  }

  /**
   * Get the current page object. Create the object if it does not exist.
   * @return {!Promise<!Page>}
   */
  async getPage_() {
    if (!this.page_) {
      this.page_ = await this.browser_.newPage();
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
    return async (condition, opt_mutate) => {
      opt_mutate = opt_mutate || (x => x);
      const page = await this.getPage_();
      return waitFor(page, valueFn, args, condition, opt_mutate);
    }
  }

  /**
   * Helper function to evaluate a function in the context of the document.
   * @param {function(...*):T} fn
   * @return {!Promise<!JSHandle>}
   * @template T
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
