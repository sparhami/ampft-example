
import {By, Key, WebDriver, WebElement, Condition, until} from 'selenium-webdriver';
import {
  ControllerPromise,
  ElementHandle,
  FunctionalTestController,
} from './functional-test-controller';

/**
 * @param {function(): !Promise<T>} value
 * @param {function(T):boolean} condition
 * @return {!Condition}
 * @template T
 */
function expectCondition(valueFn, condition, opt_mutate) {
  opt_mutate = opt_mutate || (x => x);
  return new Condition('value matches condition', async () => {
    const value = await valueFn();
    const mutatedValue = await opt_mutate(value);
    return condition(mutatedValue);
  });
}

/**
 * Make the test runner wait until the value returned by the valueFn matches
 * the given condition.
 * @param {function(): !Promise<T>} valueFn
 * @param {function(T): ?T} condition
 * @return {!Promise<?T>}
 * @template T
 */
function waitFor(browser, valueFn, condition, opt_mutate) {
  const conditionValue = value => {
    // Box the value in an object, so values that are present but falsy
    // (like "") do not cause browser.wait to continue waiting.
    return condition(value) ? {value} : null;
  };
  return browser.wait(expectCondition(valueFn, conditionValue, opt_mutate))
      .then(result => result.value); // Unbox the value.
}

/** @implements {FunctionalTestController} */
export class SeleniumWebdriverController {
  /**
   * @param {!WebDriver} browser
   */
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Return a wait function. When called, the function will cause the test
   * runner to wait until the given value matches the expected value.
   * @param {function(): !Promise<?T>} valueFn
   * @return {function(T,T): !Promise<?T>}
   * @template T
   */
  getWaitFn_(valueFn) {
    /**
     * @param {function(T): ?T} condition
     * @return {!Promise<?T>}
     */
    return (condition, opt_mutate) => {
      return waitFor(this.browser, valueFn, condition, opt_mutate);
    }
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!WebElement>>}
   * @override
   */
  async findElement(selector) {
    const {browser} = this;
    const bySelector = By.css(selector);

    await browser.wait(until.elementLocated(bySelector));
    const webElement = await browser.findElement(bySelector);
    return new ElementHandle(webElement, this);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle<!WebElement>>>}
   * @override
   */
  async findElements(selector) {
    const {browser} = this;
    const bySelector = By.css(selector);

    await browser.wait(until.elementLocated(bySelector));
    const webElements = await browser.findElements(bySelector);
    return webElements.map(webElement => new ElementHandle(webElement, this));
  }

  /**
   * @param {string} url
   * @return {!Promise}
   * @override
   */
  async navigateTo(location) {
    return await this.browser.get(location);
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
   * @param {string} keys
   * @return {!Promise}
   * @override
   */
  async type(handle, keys) {
    const targetElement = handle ?
      handle.getElement() :
      await this.browser.switchTo().activeElement();


    const key = Key[keys.toUpperCase()];
    if (key) {
      return await targetElement.sendKeys(key);
    }

    return await targetElement.sendKeys(keys);
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
   * @return {!Promise<string>}
   * @override
   */
  getElementText(handle) {
    const webElement = handle.getElement();
    return new ControllerPromise(
          webElement.getText(),
          this.getWaitFn_(() => webElement.getText()));
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
   * @param {string} attribute
   * @return {!Promise<string>}
   * @override
   */
  getElementAttribute(handle, attribute) {
    const webElement = handle.getElement();

    return new ControllerPromise(
        webElement.getAttribute(attribute),
        this.getWaitFn_(() => webElement.getAttribute(attribute)));
  }

  /**
   * Get the title of the current document.
   * @return {!Promise<string>}
   * @override
   */
  getTitle() {

    const getTitle = () => document.title;

    return new ControllerPromise(
        this.browser.executeScript(getTitle),
        this.getWaitFn_(() => this.browser.executeScript(getTitle)));
  }

  /**
   *
   * @param {!ElementHandle<!WebElement>} handle
   * @return {!Promise}
   * @override
   */
  async click(handle) {
    return await handle.getElement().click();
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
   * @return {!Promise}
   * @private
   */
  async switchToFrame_(handle) {
    const element = handle.getElement();
    // TODO(cvializ): This trashes cached element handles why?
    // await this.browser.wait(until.ableToSwitchToFrame(element));
    await this.browser.switchTo().frame(element);
  }


  /**
   * @return {!Promise}
   * @private
   */
  async switchToParent_() {
    // await this.browser.switchTo().parentFrame();
    await this.browser.switchTo().defaultContent();
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
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
