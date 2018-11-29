
import {By, Key, WebElement, WebElementCondition, until} from 'selenium-webdriver';
import {
  ControllerPromise,
  ElementHandle,
  FunctionalTestController,
} from './functional-test-controller';


function elementAttributeIs(element, attribute, value) {
  return new WebElementCondition('until element has attribute with value', function() {
    return element.getAttribute(attribute).then(v => v != value ? null : element);
  });
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
   * @param {(string|RegEx)=} opt_expect An expected value to wait for
   * @return {!Promise<string>}
   * @override
   */
  getElementText(handle, opt_expect) {
    let condition = null;
    if (opt_expect) {
      condition = typeof opt_expect == 'string' ?
        until.elementTextContains(opt_expect) :
        until.elementTextMatches(opt_expect);
    }
    const wait = (condition ? this.browser.wait(condition) : Promise.resolve());
    return wait.then(() =>
      new ControllerPromise(handle.getElement().getText(), this, 'getElementText', opt_expect));
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
   * @param {string} attribute
   * @param {string=} opt_expect An expected value to wait for
   * @return {!Promise<string>}
   * @override
   */
  getElementAttribute(handle, attribute, opt_expect) {
    const webElement = handle.getElement();
    let condition = null;
    if (opt_expect) {
      console.log('expected:', opt_expect);
      condition = elementAttributeIs(webElement, attribute, opt_expect);
    }
    const wait = (condition ? this.browser.wait(condition) : Promise.resolve());
    const retrieve = wait.then(() => webElement.getAttribute(attribute));
    retrieve.then(result => {
      console.log(`getElementAttribute(${attribute}, ${opt_expect}) = ${result}`);
    });

    return new ControllerPromise(retrieve, this, 'getElementAttribute', arguments);
  }

  /**
   * Get the title of the current document.
   * @return {!Promise<string>}
   * @override
   */
  async getTitle() {
    return await this.browser.getTitle();
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
