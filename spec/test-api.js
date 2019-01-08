import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('AMP carousel', {
  engines: ['selenium'],
}, async (env) => {
  let controller;

  beforeEach(async () => {
    controller = env.controller;

    // amp-carousel demo page
    await controller.navigateTo('https://static.ampb.in/c4eNlMzf6mZE1bHZVziK.html');
  });

  it('should get the document title with getTitle', async () => {
    await expect(controller.getTitle()).to.equal('AMP #0');
  });

  it('should get the current URL with getCurrentUrl', async () => {
    await expect(controller.getCurrentUrl()).to.equal('https://static.ampb.in/c4eNlMzf6mZE1bHZVziK.html');
  });

  it('should get the document activeElement with getActiveElement', async () => {
    const activeElement = await controller.getActiveElement();
    const tagName = 
        await controller.getElementProperty(activeElement, 'tagName');

    await expect(tagName).to.equal('BODY');
  })

  it('should find an element with findElement', async () => {
    const img1 = await controller.findElement(':first-child > amp-img');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.equal('true');
  });

  it('should find multiple elements with findElements', async () => {
    const img1 = await controller.findElements('amp-img');
    await expect(img1).to.have.length(3);
  });

  it('find a child element with findElementFromElement', async () => {
    
  });
});