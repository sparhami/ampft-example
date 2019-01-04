import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

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

    const scrollLeft = await prop(el, 'scrollLeft');
    const firstSlideWidth = await prop(firstSlide, 'offsetWidth');
    const snappedScrollLeft = scrollLeft + firstSlideWidth;
    const requestedScrollLeft = snappedScrollLeft + 1;

    await controller.scroll(el, {left: requestedScrollLeft});
    // We should have snapped to the edge of the slide rather than the
    // requested scroll position.
    await expect(prop(el, 'scrollLeft')).to.equal(snappedScrollLeft);
  });

  it('should reset the window after scroll', async() => {
    const el = await controller.findElement('amp-carousel .scroll-container');
    const firstSlide = await controller.findElement('amp-carousel .scroll-container > *');
    
    const scrollWidth = await prop(el, 'scrollWidth');
    const scrollLeft = await prop(el, 'scrollLeft');
    const firstSlideWidth = await prop(firstSlide, 'offsetWidth');
    const snappedScrollLeft = scrollLeft + firstSlideWidth;
    const requestedScrollLeft = snappedScrollLeft + 1;

    await controller.scroll(el, {left: requestedScrollLeft});
    // The new scroll width/left should eventually be the same as before,
    // since the windowing should have been reset around the new element.
    await expect(prop(el, 'scrollWidth')).to.equal(scrollWidth);
    await expect(prop(el, 'scrollLeft')).to.equal(scrollLeft);
  });
});
