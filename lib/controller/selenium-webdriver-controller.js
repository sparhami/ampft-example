
import {By, Key, WebElement, until} from 'selenium-webdriver';
import {
  ElementHandle,
  FunctionalTestController,
} from './functional-test-controller';


/** @implements {FunctionalTestController} */
export class SeleniumWebdriverController {
  /**
   * @param {!WebDriver} browser
   */
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Get a reference to an element from the document under test.
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!WebElement>>}
   * @override
   */
  async findElement(selector) {
    const bySelector = By.css(selector);
    await this.browser.wait(until.elementLocated(bySelector));
    const elementHandle = await this.browser.findElement(bySelector);
    return new ElementHandle(elementHandle);
  }

  /**
   * Navigate the browser to the given URL.
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
  async getElementText(handle) {
    return await handle.getElement().getText();
  }

  /**
   * @param {!ElementHandle<!WebElement>} handle
   * @param {string} attribute
   * @return {!Promise<string>}
   * @override
   */
  async getElementAttribute(handle, attribute) {
    return await handle.getElement().getAttribute(attribute);
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
