import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

/**
 * How long to wait for the next scroll event before considering the scroll
 * done
 */
const BROWSER_SCROLL_WAIT_TIME = 200;

/**
 * How long to wait, after scrolling has stopped, for the carousel to reset
 * the scroll window.
 */
const CAROUSEL_RESET_WINDOW_WAIT_TIME = 300;

const SCROLL_STOP_WAIT_TIME = BROWSER_SCROLL_WAIT_TIME +
    CAROUSEL_RESET_WINDOW_WAIT_TIME;

describes.endtoend('AMP carousel', {
  engines: ['puppeteer'],
}, async (env) => {
  let controller;

  beforeEach(async () => {
    controller = env.controller;

    await controller.navigateTo(
      'http://localhost:8000/test/manual/amp-carousel-0-2/basic.amp.html');
  });

  it('should reset the window after scroll', async () => {
    const el = await controller.findElement('amp-carousel .scroll-container');
    // TODO(sparhami) 
    await controller.waitForScrollingToStop(el);
    const [scrollWidth, scrollLeft] = await Promise.all([
      controller.getElementScrollWidth(el),
      controller.getElementScrollLeft(el),
    ]);

    // TODO(sparhami) figure out how wide each slide is, and scroll by at least
    // 1 slide's width  + 1px.
    await controller.scrollElementLeftBy(el, 1000);
    await controller.waitForScrollingToStop(el, {
      waitTime: SCROLL_STOP_WAIT_TIME,
    });
    const [newScrollWidth, newScrollLeft] = await Promise.all([
      controller.getElementScrollWidth(el),
      controller.getElementScrollLeft(el),
    ]);

    // The new scroll width/left should be the same as before, since the
    // windowing should have been reset around the new element.
    await expect(newScrollWidth).to.equal(scrollWidth);
    await expect(newScrollLeft).to.equal(scrollLeft);
  });
});
