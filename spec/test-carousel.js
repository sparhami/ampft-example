import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('AMP carousel', {
  engines: ['puppeteer'],
}, async (env) => {
  /** The total number of slides in the carousel */
  const SLIDE_COUNT = 7;

  let controller;

  function prop(el, name) {
    return controller.getElementProperty(el, name);
  }

  async function waitForImgLoad(el) {
    await expect(prop(el, 'naturalWidth')).to.be.greaterThan(0); 
  }

  async function waitForCarouselImg(n) {
    // We cannot use CSS's nth child due to non-slide elements in the scroll
    // container. We query all the imgs upfront, since they might not have
    // laid out yet.
    const el = await controller.findElementXPath(
      `//div[contains(@class, 'slotted')][${n + 1}]//img`);
    return await waitForImgLoad(el);
  }

  beforeEach(async () => {
    controller = env.controller;

    await controller.navigateTo(
      'http://localhost:8000/test/manual/amp-carousel-0-2/basic.amp.html');
  });

  it('should render correctly', async() => {
    await waitForCarouselImg(0);
    await controller.takeScreenshot('screenshots/render.png');
  });

  it('should layout the two adjacent slides', async() => {
    await waitForCarouselImg(1);
    await waitForCarouselImg(SLIDE_COUNT - 1);
  });

  it('should snap when scrolling', async() => {
    const el = await controller.findElement('amp-carousel .scroll-container');
    const firstSlide = await controller.findElement('amp-carousel .scroll-container > *');

    // Wait for the first two slides's imgs to load.
    await waitForCarouselImg(0);
    await waitForCarouselImg(1);

    const scrollLeft = await prop(el, 'scrollLeft');
    const firstSlideWidth = await prop(firstSlide, 'offsetWidth');
    const snappedScrollLeft = scrollLeft + firstSlideWidth;
    const requestedScrollLeft = snappedScrollLeft + 1;

    await controller.scroll(el, {left: requestedScrollLeft});
    // We should have snapped to the edge of the slide rather than the
    // requested scroll position.
    await expect(prop(el, 'scrollLeft')).to.equal(snappedScrollLeft);
    await controller.takeScreenshot('screenshots/snapped.png');
  });

  it('should reset the window after scroll', async() => {
    const el = await controller.findElement('amp-carousel .scroll-container');
    const firstSlide = await controller.findElement('amp-carousel .scroll-container > *');
    
    // Wait for the first two slides's imgs to load.
    await waitForCarouselImg(0);
    await waitForCarouselImg(1);

    const scrollWidth = await prop(el, 'scrollWidth');
    const scrollLeft = await prop(el, 'scrollLeft');
    const firstSlideWidth = await prop(firstSlide, 'offsetWidth');
    const snappedScrollLeft = scrollLeft + firstSlideWidth;
    const requestedScrollLeft = snappedScrollLeft + 1;

    await controller.scroll(el, {left: requestedScrollLeft});
    // Wait for the scrolling to settle
    await expect(prop(el, 'scrollLeft')).to.equal(snappedScrollLeft);
    // The new scroll width/left should eventually be the same as before,
    // since the windowing should have been reset around the new element.
    await expect(prop(el, 'scrollWidth')).to.equal(scrollWidth);
    await expect(prop(el, 'scrollLeft')).to.equal(scrollLeft);
    await controller.takeScreenshot('screenshots/after-reset.png');
  });
});
