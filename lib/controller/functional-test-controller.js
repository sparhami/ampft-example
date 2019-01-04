
/**
 * A wrapper class that allows client code to own references to
 * framework-specific element handles, but which does not expose any of the
 * framework-specific methods on that element.
 *
 * @template T
 * @public
 */
export class ElementHandle {
  /**
   * Wrap the framework-specific element handle object.
   * @param {!T} element
   * @package
   */
  constructor(element, controller) {
    /** @private */
    this.element_ = element;
  }

  /**
   * Unwrap the framework-specific element handle object.
   * @return {!T}
   * @package
   */
  getElement() {
  	return this.element_;
  }
}

/**
 * Allow expectations to await the expected value.
 * Duck-type a real Promise.
 * @template TYPE
 * @extends {Promise}
 */
export class ControllerPromise {
  /**
   * @param {function(function(?TYPE):void, function(*):void):void|!Promise<TYPE>} executorOrPromise
   * @param {function(TYPE,function(TYPE): ?TYPE): !Promise=} opt_waitForValue
  */
  constructor(executorOrPromise, opt_waitForValue) {
    this.promise_ = typeof executorOrPromise == 'function' ?
      new Promise(executorOrPromise) :
      executorOrPromise;

    /**
     * Returns a Promise that resolves when the given expected value fulfills
     * the given condition.
     * @param {function(TYPE): ?TYPE} condition
     * @return {!Promise<?TYPE>}
     */
    this.waitForValue = opt_waitForValue;
  }

	/** @override */
  catch(onRejected) {
    return new ControllerPromise(
        this.promise_.catch(onRejected),
        this.waitForValue);
  }

 	/** @override */
  finally(onFinally) {
    return new ControllerPromise(
        this.promise_.finally(onFinally),
        this.waitForValue);
  }

  /** @override */
  then(opt_onFulfilled, opt_onRejected) {
    // Allow this and future `then`s to update the wait value.
    let wrappedWait = null;
    if(this.waitForValue) {
      wrappedWait = (condition, opt_mutate = opt_onFulfilled) => {
        return this.waitForValue(condition, value => opt_mutate(value));
      };
    }

    return new ControllerPromise(
        this.promise_.then(opt_onFulfilled, opt_onRejected),
        wrappedWait);
  }
}

/** @interface */
export class FunctionalTestController {
  /**
   * Navigates to the given URL.
   * {@link https://www.w3.org/TR/webdriver1/#navigate-to}

   * @param {string} url
   * @return {!Promise}
   */
  async navigateTo(url) {}

  /**
   * Retrieves the URL for the current page.
   * {@link https://www.w3.org/TR/webdriver1/#get-current-url}
   *
   * @return {!Promise<string>}
   */
  async getCurrentUrl() {}

  /**
   * Returns the document title.
   * {@link https://www.w3.org/TR/webdriver1/#get-title}
   *
   * @return {!Promise<string>}
   */
  async getTitle() {}

  /**
   * Selects the current top-level browsing context or a child browsing context
   * of the current browsing context to use as the current browsing context for
   * subsequent commands.
   * {@link https://www.w3.org/TR/webdriver1/#switch-to-frame}
   *
   * @param {!ElementHandle} handle
   * @param {function():(!Promise|undefined)}
   * @return {!Promise}
   */
  async usingFrame(handle, fn) {}

  /**
   * Gets the active element of the current browsing context’s document element.
   * {@link https://www.w3.org/TR/webdriver1/#get-active-element}
   *
   * @return {!Promise<!ElementHandle>}
   */
  async getActiveElement() {}

  /**
   * The Find Element command is used to find the first element matching the
   * given selector in the current browsing context that can be used as the
   * web element context for future element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-element}
   *
   * @param {string} selector
   * @return {!Promise<!ElementHandle>}
   */
  async findElement(selector) {}

  /**
   * The Find Elements command is used to find all elements matching the
   * given selector in the current browsing context that can be used as the
   * web element context for future element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-elements}
   *
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async findElements(selector) {}

  /**
   * The Find Element From Element command is used to find the first element
   * that is a descendent of the given element matching the given selector in
   * the current browsing context that can be used as the web element context
   * for future element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-element-from-element}
   *
   * @param {!ElementHandle} handle
   * @param {string} selector
   * @return {!Promise<!ElementHandle>}
   */
  async findElementFromElement(handle, selector) {}

  /**
   * The Find Elements command is used to find all elements that are descendents
   * of the given element matching the given selector in the current
   * browsing context that can be used as the web element context for future
   * element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-elements-from-element}
   *
   * @param {!ElementHandle} handle
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async findElementsFromElement(handle, selector) {}

  /**
   * Determines if the referenced element is elected or not.
   * This operation only makes sense on input elements of the Checkbox- and
   * Radio Button states, or on option elements.
   * {@link https://www.w3.org/TR/webdriver1/#is-element-selected}
   *
   * @param {!ElementHandle} handle
   * @param {boolean=} opt_expect An expected value to wait for
   * @return {!Promise<boolean>}
   */
  async isElementSelected(handle, opt_expect) {}

  /**
   * Return the value of the given attribute name on the given element.
   * Note: for boolean attributes, the value returned is "true".
   * {@link https://www.w3.org/TR/webdriver1/#get-element-attribute}
   *
   * @param {!ElementHandle} handle
   * @param {string} attribute
   * @param {string=} opt_expect An expected value to wait for
   * @return {!Promise<string>}
   */
  async getElementAttribute(handle, attribute, opt_expect) {}

  /**
   * Return the value of the given property name on the given element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-property}
   *
   * @param {!ElementHandle} handle
   * @param {string} property
   * @param {string=} opt_expect An expected value to wait for
   * @return {!Promise<string>} property
   */
  async getElementProperty(handle, property, opt_expect) {}

  /**
   * Return the value of the given CSS value on the given element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-css-value}
   *
   * @param {!ElementHandle} handle
   * @param {string} styleProperty
   * @param {string=} opt_expect An expected value to wait for
   * @return {!Promise<string>} styleProperty
   */
  async getElementCssValue(handle, styleProperty, opt_expect) {}

  /**
   * The Get Element Text command intends to return an element’s text
   * “as rendered”. An element’s rendered text is also used for locating `<a>`
   * elements by their link text and partial link text.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-text}
   *
   * @param {!ElementHandle} handle
   * @param {(string|RegExp)=} opt_expect An expected value to wait for
   * @return {!Promise<string>}
   */
  async getElementText(handle, opt_expect) {}

  /**
   * Return the value of the tag name for the given element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-tag-name}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<string>}
   */
  async getElementTagName(handle) {}

  /**
   * The Get Element Rect command returns the dimensions and coordinates of
   * the given web element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-rect}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<!DOMRectDef>}
   */
  async getElementRect(handle) {}

  /**
   * Return the enabled state of the given element. i.e. `false` if the
   * given element has the "disabled" attribute.
   * {@link https://www.w3.org/TR/webdriver1/#is-element-enabled}
   *
   * @param {!ElementHandle} handle
   * @param {boolean=} opt_expect An expected value to wait for
   * @return {!Promise<boolean>}
   */
  async isElementEnabled(handle, opt_expect) {}

  /**
   * The Set Window Rect command alters the size and the position of the
   * operating system window corresponding to the current top-level browsing
   * context.
   * {@link https://www.w3.org/TR/webdriver1/#set-window-rect}
   *
   * @param {!WindowRectDef} rect
   * @return {!Promise}
   */
  async setWindowRect(rect) {}

  /**
   * The Take Screenshot command takes a screenshot of the
   * visible region encompassed by the bounding rectangle of the window.
   * {@link https://www.w3.org/TR/webdriver1/#take-screenshot}
   * @param {string} path
   * @return {!Promise}
   */
  async takeScreenshot(path) {}

  /**
   * The Take Element Screenshot command takes a screenshot of the visible
   * region encompassed by the bounding rectangle of an element.
   * {@link https://www.w3.org/TR/webdriver1/#take-element-screenshot}
   *
   * @param {!ElementHandle} handle
   * @param {string} path
   * @return {!Promise}
   */
  async takeElementScreenshot(handle, path) {}

  /**
   * Clicks the given element in its center point.
   * {@link https://www.w3.org/TR/webdriver1/#element-click}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async click(handle) {}

  /**
   * Sends the provided keys to the given form control element. If an element
   * is not provided, the active element receives the keys.
   * {@link https://www.w3.org/TR/webdriver1/#element-send-keys}
   *
   * @param {?ElementHandle} handle
   * @param {string} keys
   * @return {!Promise}
   */
  async type(handle, keys) {}

  /**
   * Scrolls the given element using the scroll options if provided.
   * If the element cannot scroll, then no scroll will be performed.
   * Note: This is not yet spec'd in the W3C WebDriver spec, but there are plans
   * to include it.
   * {@link https://github.com/w3c/webdriver/issues/1005#issuecomment-436629425}
   *
   * @param {!ElementHandle} handle
   * @param {!ScrollToOptionsDef=} opt_scrollToOptions
   * @return {!Promise}
   */
  async scroll(handle, opt_scrollToOptions) {}
}


/**
 * @typedef {{
 *   width: number,
 *   height: number
 * }}
*/
export let WindowRectDef;

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number
 * }}
*/
export let DOMRectDef;

/** @enum {string} */
export let ScrollBehavior = {
  AUTO: 'auto',
  SMOOTH: 'smooth',
}

/** @typedef {{
 *   left: number,
 *   top: number,
 *   behavior: ScrollBehavior
 * }}
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions}
 */
export let ScrollToOptionsDef;
