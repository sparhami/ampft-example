import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('AMP carousel', {
  engines: ['puppeteer'],
}, async (env) => {
  let controller;

  beforeEach(async () => {
    controller = env.controller;

    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await controller.navigateTo('https://static.ampb.in/c4eNlMzf6mZE1bHZVziK.html');
  });

  it('should work with sync values', async () => {
    await expect(2+2).to.equal(4);
    await expect(2+2).to.be.above(3);
    await expect(2+2).to.be.below(5);

    await expect({a: '2', b: '3'}).to.include({a: '2'});
    await expect('hello world').to.include('o w');
    await expect('hello world').includes('o w');
    await expect('hello world').to.contain('o w');
    await expect('hello world').contains('o w');

    await expect('hello world').to.match(/o w/);
    await expect('hello world').matches(/o w/);

    await expect('hello').to.have.length('hello'.length);
    await expect('hello').to.have.length.above('hello'.length - 1);
    await expect('hello').to.have.length.below('hello'.length + 1);
  });

  it('should work with negated sync values', async () => {
    await expect(2+2).to.not.equal(5);
    await expect(2+2).to.not.be.above(5);
    await expect(2+2).to.not.be.below(3);

    await expect({a: '2', b: '3'}).to.not.include({a: '7'});
    await expect('hello world').to.not.include('foo bar');
    await expect('hello world').not.includes('foo bar');
    await expect('hello world').to.not.contain('foo bar');
    await expect('hello world').not.contains('foo bar');

    await expect('hello world').to.not.match(/foo bar/);
    await expect('hello world').not.matches(/foo bar/);

    await expect('hello').to.not.have.length('hello'.length + 1);
    await expect('hello').to.not.have.length.above('hello'.length + 1);
    await expect('hello').to.not.have.length.below('hello'.length - 1);
  });

  it('should work with async values', async () => {

    const nextButtonSelector = '#slides .amp-carousel-button.amp-carousel-button-next';
    const nextButton = await controller.findElement(nextButtonSelector);

    await controller.click(nextButton);

    const img1 = await controller.findElement(':first-child > amp-img');

    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.equal('true');

    const length = controller.getElementAttribute(img1, 'aria-hidden').then(value => value.length);
    await expect(length).to.equal(4);
    await expect(length).to.be.above(3);
    await expect(length).to.be.below(5);
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.include('t');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.contain('t');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).includes('t');
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).contains('t');

    const testObj = controller.getElementAttribute(img1, 'aria-hidden').then(value => {
      return {ariaHidden: value};
    });
    await expect(testObj).to.include({ariaHidden: 'true'});

    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.match(/t/);
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).matches(/t/);

    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.have.length(4);
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.have.length.above(3);
    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.have.length.below(5);
  });

  it('should work with negated async values', async () => {
    const nextButtonSelector = '#slides .amp-carousel-button.amp-carousel-button-next';
    const nextButton = await controller.findElement(nextButtonSelector);

    await controller.click(nextButton);

    const img1 = await controller.findElement(':first-child > amp-img');

    await expect(controller.getElementAttribute(img1, 'aria-hidden')).to.not.equal('false');

    const testObj = controller.getElementAttribute(img1, 'aria-hidden').then(value => {
      return {ariaHidden: value};
    });
    await expect(testObj).to.not.include({ariaHidden: 'false'});

    const length = controller.getElementAttribute(img1, 'aria-hidden').then(value => value.length);
    await expect(length).to.equal(4);
    await expect(length).to.equal(4);
  });

  it('should work with Promise chains that sync mutate', async () => {
    const img2 = await controller.findElement(':nth-child(2) > amp-img');
    const result = controller.getElementAttribute(img2, 'aria-hidden')
        .then(str => str.toLowerCase() + '0');
    await expect(result).to.equal('true0');
  });

  it('should work with Promise chains that async mutate', async () => {
    const img2 = await controller.findElement(':nth-child(2) > amp-img');
    const result = controller.getElementAttribute(img2, 'aria-hidden')
        .then(str => upperCaseAsync(str));
    await expect(result).to.equal('TRUE');
  });

  it('should work with Promise chains that async and sync mutate', async () => {
    const img2 = await controller.findElement(':nth-child(2) > amp-img');
    const result = controller.getElementAttribute(img2, 'aria-hidden')
        .then(str => str.toLowerCase() + '0')
        .then(str => upperCaseAsync(str));

    result.then(str => console.log(str));

    await expect(result).to.equal('TRUE0');
  });

  function upperCaseAsync(str) {
    return new Promise(resolve => resolve(str.toUpperCase()));
  }
});