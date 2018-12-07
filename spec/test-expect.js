import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('AMP carousel', {
  engines: ['puppeteer'],
}, async (env) => {
  let controller;
  let nextButton;

  beforeEach(async () => {
    controller = env.controller;

    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await controller.navigateTo('https://static.ampb.in/c4eNlMzf6mZE1bHZVziK.html');

    const nextButtonSelector = '#slides .amp-carousel-button.amp-carousel-button-next';
    nextButton = await controller.findElement(nextButtonSelector);
  });

  it('should work with mixed promises', async () => {
    await controller.click(nextButton);

    const img1 = await controller.findElement(':first-child > amp-img');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.equal('true');

    const img2 = await controller.findElement(':nth-child(2) > amp-img');
    const x = controller.getElementAttribute(img2, 'aria-hidden')
        .then(x => upperCaseAsync(x)).then(x => x.toLowerCase());
    await expect(x).to.equal('FALSE');
  });

  function upperCaseAsync(str) {
    return new Promise(resolve => resolve(str.toUpperCase()));
  }
});
