import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('AMP carousel', {
  engines: ['puppeteer'],
}, async (env) => {
  let controller;

  beforeEach(async () => {
    controller = env.controller;

    await controller.navigateTo('http://localhost:8080/test.html');
  });

  it('should have 5 amp-imgs with layout with css', async() => {
    // Make sure there are 5 amp-imgs that have laid out
    const imgsWithLayout = await controller.findElements('amp-img.i-amphtml-layout');
    await expect(imgsWithLayout).to.have.length(5);
  });

  it('should have 5 amp-imgs with layout with xpath', async() => {
    // Make sure there are 5 amp-imgs that have laid out
    const fifthImg = await controller.findElementXPath(
      '(//amp-img[contains(@class, "i-amphtml-layout")])[5]');
    await expect(fifthImg).to.not.be.undefined;
    await expect(fifthImg).to.not.be.null;
  });
});
