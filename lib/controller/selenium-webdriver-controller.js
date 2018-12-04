
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
function expectCondition(valueFn, condition) {
  return new Condition('value matches condition',
      () => valueFn().then(condition));
}

/**
 * Make the test runner wait until the value returned by the valueFn matches
 * the given condition.
 * @param {function(): !Promise<T>} valueFn
 * @param {function(T): ?T} condition
 * @return {!Promise<?T>}
 * @template T
 */
function waitFor(browser, valueFn, condition) {
  const conditionValue = value => condition(value) ? value : null;
  return browser.wait(expectCondition(valueFn, conditionValue));
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
     * @param {T} expected
     * @param {function(T): ?T} condition
     * @return {!Promise<?T>}
     */
    return (expected, opt_condition) => {
      opt_condition = opt_condition || (value => value == expected);
      return waitFor(this.browser, valueFn, opt_condition);
    }
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!WebElement>>}
   * @override
   */
  async findElement(selector) {
    const bySelector = By.css(selector);
    const webElement = await this.browser.findElement(bySelector);
    return new ElementHandle(webElement, this);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle<!WebElement>>>}
   * @override
   */
  async findElements(selector) {
    const bySelector = By.css(selector);
    const webElements = await this.browser.findElements(bySelector);
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
    return new ControllerPromise(
        this.browser.getTitle(),
        this.getWaitFn_(() => this.browser.getTitle()));
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
}
