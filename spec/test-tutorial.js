import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('Tutorial test', {
  /**
   * 1.  You can set this to ['selenium'], ['puppeteer'], or ['testcafe']
   *     Support for multiple engines may be added later.
   */
  engines: ['selenium'],
}, async env => {
  let controller;
  let nextButton;

  beforeEach(async () => {
    controller = env.controller;

    /**
     * 2.  The browser must navigate to the page that needs to be tested.
     *     This is as if the user typed the URL into the URL bar.
     * 2a. `async`/`await` syntax is used extensively.
     */
    await controller.navigateTo('https://static.ampb.in/c4eNlMzf6mZE1bHZVziK.html');

    const nextButtonSelector = '#slides .amp-carousel-button.amp-carousel-button-next';
    nextButton = await controller.findElement(nextButtonSelector);
  });

  /**
   * 4.  Standard `expect` syntax works like normal. We should always prepend
   *     `await` to the `expect` to avoid footguns in other test code,
   *     even if the expression does not return a Promise.
   */
  it('should expect hello to not equal world', async () => {
    await expect('hello').to.not.equal('world');
  });
  /**
   * 5.  Async `expect` syntax behaves differently depending on what you pass to
   *     the `expect`.
   *     `FunctionalTestController` getter methods (methods that return
   *     primitive values in Promises) use a special kind of Promise
   *     implemented by the ControllerPromise class that allows
   *     `expect` to wait for the value to match the expectation.
   *     This solves the problem where the test code needs to manually poll for
   *     the value to change.
   *
   * 5a. If you directly `await` a ControllerPromise, it will evaluate it
   *     immediately, so `expect` will not be able to wait for the value to
   *     change to the expected value.
   *
   * 5c. If you have used `chai-as-promised` you know that Chai does not
   *     natively support Promises. The '../lib/expect` implementation adds
   *     Promise support to `expect` directly so you don't need to add
   *     `eventually` to the chain.
   */
  it('should navigate to the next slide', async () => {
    /**
     * 5d. This assignment waits for the controller to fetch the title
     *     from the document. `title` is a string.
     *     The expectation will not wait for the value to become "AMP" before
     *     continuing, like the case in 5a.
     */
    const title = await controller.getTitle(); // typeof title == 'string'
    await expect(title).to.contain('AMP');

    /**
     * 5e. This line waits for the controller to fetch the title, and also
     *     the `expect` chain will wait for the value to contain "AMP" before
     *     continuing.
     *
     * 5f. Almost always, you will want to use this pattern.
     */
    const title2 = controller.getTitle(); // title2 instanceof ControllerPromise
    await expect(title2).to.contain('AMP');

    await controller.click(nextButton);

    const img1 = await controller.findElement(':first-child > amp-img');
    /**
     * 5g. This commented-out expectation will fail if uncommented,
     *     because the attribute value might equal `false` because it does not
     *     change immediately after the driver clicks the element.
     */
    // expect(await controller.getElementAttribute(img1, 'aria-hidden')).to.equal('true');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.equal('true');

    /**
     * 5h. Calling `then` on ControllerPromises returns another
     *     ControllerPromise so the `expect` chain will still wait for the
     *     result to match the expectation.
     */
    const img2 = await controller.findElement(':nth-child(2) > amp-img');
    const mutatedAttr = controller.getElementAttribute(img2, 'aria-hidden')
        .then(x => x.toUpperCase());
    await expect(mutatedAttr).to.equal('FALSE');
  });
});
