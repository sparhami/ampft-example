import * as describes from '../lib/describes';
import {install} from '../lib/expect';
import chai, {expect} from 'chai';
import {ControllerPromise} from '../lib/controller/functional-test-controller';
// describes.testcafe('AMP carousel', {
//     browsers: ['chrome'],
// }, async env => {
//     let expect;
//     let controller;
//     let nextButton;

//     beforeEach(async () => {
//         controller = env.controller;

//         // It is suggested that on HTML side, add proper CSS rules to make things simpler
//         // Also, it is suggested that different carousel for testing sit on a different page
//         await controller.navigateTo('https://static.ampb.in/c4eNlMzf6mZE1bHZVziK.html');

//         const nextButtonSelector = '#slides .amp-carousel-button.amp-carousel-button-next';
//         nextButton = await controller.findElement(nextButtonSelector);
//     });

//     it('should navigate to the next slide', async () => {
//         await controller.click(nextButton);

//         const img1 = await controller.findElement(':first-child > amp-img');
//         expect(await controller.getElementAttribute(img1, 'aria-hidden')).to.equal('true');

//         const img2 = await controller.findElement(':nth-child(2) > amp-img');
//         expect(await controller.getElementAttribute(img2, 'aria-hidden')).to.equal('false');
//     });
// });

install(chai);

describes.selenium('AMP carousel', {
  browsers: ['chrome'],
}, async env => {
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

  it('should navigate to the next slide', async () => {
    await controller.click(nextButton);

    const img1 = await controller.findElement(':first-child > amp-img');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.not.equal('true');

    const img2 = await controller.findElement(':nth-child(2) > amp-img');
    await expect(controller.getElementAttribute(img2, 'aria-hidden')).to.not.equal('false');
  });
});
