import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('AMP iframes', {
  engines: ['puppeteer'],
}, async (env) => {
  let controller;

  beforeEach(async () => {
    controller = env.controller;

    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await controller.navigateTo('https://static.ampb.in/DannLesNhQkne4abafny.html');
  });

  it('should query values in iframes', async () => {
    await expect(controller.getTitle()).to.equal('amp-twitter');

    const iframe = await controller.findElement('#tweet1 iframe');

    await controller.usingFrame(iframe, async () => {
      await expect(controller.getTitle()).to.equal('');
      const twitter = await controller.findElement('twitter-widget');
      await expect(controller.getElementAttribute(twitter, 'class')).to.contain('twitter-tweet');
    });

    await expect(controller.getTitle()).to.contain('amp-twitter');
  });
});
