import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

/**
 * How long to wait for the next scroll event before considering the scroll
 * done
 */
const BROWSER_SCROLL_WAIT_TIME = 100;

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

  function prop(el, name) {
    return controller.getElementProperty(el, name);
  }

  beforeEach(async () => {
    controller = env.controller;

    await controller.navigateTo(
      'http://localhost:8000/test/manual/amp-carousel-0-2/basic.amp.html');
  });

  it('should snap when scrolling', async() => {
    const el = await controller.findElement('amp-carousel .scroll-container');
    const firstSlide = await controller.findElement('amp-carousel .scroll-container > *');

    // TODO(sparhami) 
    await controller.waitForScrollingToStop(el);
    const scrollLeft = await prop(el, 'scrollLeft');
    const firstSlideWidth = await prop(firstSlide, 'offsetWidth');
    const snappedScrollLeft = scrollLeft + firstSlideWidth;
    const requestedScrollLeft = snappedScrollLeft + 1;

    await controller.scroll(el, {left: requestedScrollLeft});
    await controller.waitForScrollingToStop(el, {
      waitTime: BROWSER_SCROLL_WAIT_TIME,
    });

    // We should have snapped to the edge of the slide rather than the
    // requested scroll position.
    await expect(prop(el, 'scrollLeft')).to.equal(snappedScrollLeft);
  });

  it('should reset the window after scroll', async() => {
    const el = await controller.findElement('amp-carousel .scroll-container');
    const firstSlide = await controller.findElement('amp-carousel .scroll-container > *');
    
    // TODO(sparhami) 
    await controller.waitForScrollingToStop(el);
    const scrollWidth = await prop(el, 'scrollWidth');
    const scrollLeft = await prop(el, 'scrollLeft');
    const firstSlideWidth = await prop(firstSlide, 'offsetWidth');
    const snappedScrollLeft = scrollLeft + firstSlideWidth;
    const requestedScrollLeft = snappedScrollLeft + 1;

    await controller.scroll(el, {left: requestedScrollLeft});
    await controller.waitForScrollingToStop(el, {
      waitTime: SCROLL_STOP_WAIT_TIME,
    });

    // The new scroll width/left should be the same as before, since the
    // windowing should have been reset around the new element.
    await expect(prop(el, 'scrollWidth')).to.equal(scrollWidth);
    await expect(prop(el, 'scrollLeft')).to.equal(scrollLeft);
  });
});
