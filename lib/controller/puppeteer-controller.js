
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
    value = await opt_mutate(value);
  }

  while (!condition(value)) {
    const handle = await page.waitForFunction.call(page, valueFn, {}, ...args);
    value = await handle.jsonValue();
    if (opt_mutate) {
      value = await opt_mutate(value);
    }
  }
  return value;
}

/**
 * Evaluate the given function and its arguments in the context of the document.
 * @param {!Frame} frame
 * @param {function(...*):*} fn
 * @param {...*} fnArgs Variadic arguments
 * @return {!Promise<!JSHandle>}
 */
function evaluate(frame, fn) {
  const args = Array.prototype.slice.call(arguments, 2);
  return frame.evaluate(fn, ...args);
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

    /** @private */
    this.currentFrame_ = null;
  }

  /**
   * Get the current page object. Create the object if it does not exist.
   * @return {!Promise<!Page>}
   */
  async getPage_() {
    if (!this.page_) {
      this.page_ = await this.browser_.newPage();
      await this.page_.setViewport({
        width: 1024,
        height: 768,
        hasTouch: true,
      });
    }
    return this.page_;
  }

  /**
   * Get the current page object. Create the object if it does not exist.
   * @return {!Promise<!Frame>}
   */
  async getCurrentFrame_() {
    if (!this.currentFrame_) {
      const page = await this.getPage_();
      this.currentFrame_ = page.mainFrame();
    }

    return this.currentFrame_;
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
      const frame = await this.getCurrentFrame_();
      return waitFor(frame, valueFn, args, condition, opt_mutate);
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
    const frame = await this.getCurrentFrame_();
    return await evaluate(frame, fn, ...args);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!PuppeteerHandle>>}
   * @override
   */
  async findElement(selector) {
    const frame = await this.getCurrentFrame_();
    const elementHandle = await frame.waitForSelector(selector);

    return new ElementHandle(elementHandle, this);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle<!PuppeteerHandle>>>}
   * @override
   */
  async findElements(selector) {
    const frame = await this.getCurrentFrame_();
    await frame.waitForSelector(selector);

    const elementHandles = await frame.$$(selector);
    return elementHandles.map(
        elementHandle => new ElementHandle(elementHandle, this));
  }

  /**
   * @param {string} url
   * @return {!Promise}
   * @override
   */
  async navigateTo(location) {
    const frame = await this.getCurrentFrame_();
    await frame.goto(location, {waitUntil: 'domcontentloaded'});
  }

  /**
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @param {string} keys
   * @return {!Promise}
   * @override
   */
  async type(handle, keys) {
    const frame = await this.getCurrentFrame_();
    const targetElement = handle ?
      handle.getElement() :
      await frame.$(':focus');


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
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @param {string} property
   * @return {!Promise<string>}
   * @override
   */
  getElementProperty(handle, property) {
    const element = handle.getElement();
    const getter = (element, property) => element[property];
    return new ControllerPromise(
        this.evaluate_(getter, element, property),
        this.getWaitFn_(getter, element, property));
  }

  /**
   * @param {!WindowRectDef} rect
   * @return {!Promise}
   * @override
   */
  async setWindowRect(rect) {
    const {
      width,
      height,
    } = rect;
    const page = await this.getPage_();
    await page.setViewport({width, height});
  }

  /**
   * @return {!Promise<string>}
   * @override
   */
  getTitle() {
    const title = this.getCurrentFrame_().then(frame => frame.title());
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

  /**
   * @param {!ElementHandle<!PuppeteerHandle>} handle
   * @param {!ScrollToOptionsDef=} opt_scrollToOptions
   * @return {!Promise}
   * @override
   */
  async scroll(handle, opt_scrollToOptions) {
    const element = handle.getElement();
    const frame = await this.getCurrentFrame_();
    await evaluate(frame, (element, opt_scrollToOptions) => {
      element.scrollTo(opt_scrollToOptions);
    }, element, opt_scrollToOptions);
  }

  /**
   * @param {string} path
   * @return {!Promise<string>} An encoded string representing the image data
   * @override
   */
  async takeScreenshot(path) {
    const options = {
      path,
      type: 'png',
    };
    const page = await this.getPage_();
    await page.screenshot(options);
  }

  /**
   * @param {string} path
   * @param {!ElementHandle} handle
   * @return {!Promise<string>} An encoded string representing the image data
   * @override
   */
  async takeElementScreenshot(handle, path) {
    const options = {
      path,
      type: 'png',
    };
    const element = handle.getElement();
    await element.screenshot(options);
  }

  /**
   * @param {?ElementHandle} handle
   * @return {!Promise}
   * @private
   */
  async switchToFrame_(handle) {
    const element = handle.getElement();
    this.currentFrame_ = await element.contentFrame();
  }

  /**
   * @return {!Promise}
   * @private
   */
  async switchToParent_() {
    let frame = await this.currentFrame_.parentFrame();
    if (!frame) {
      const page = this.getPage_();
      frame = page.mainFrame();
    }
    this.currentFrame_ = frame;
  }

  /**
   * @param {!ElementHandle<!PuppeteerHandle>} handle
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
