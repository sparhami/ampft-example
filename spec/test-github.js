import * as describes from '../lib/describes';
import {expect} from '../lib/expect';
import { ControllerPromise } from '../lib/controller/functional-test-controller';

const Keys = {
    ENTER: 'enter',
};

describes.testcafe('GitHub search results', {
    browsers: ['chrome'],
}, async env => {
    let controller;

    beforeEach(async () => {
        controller = env.controller;
        await controller.navigateTo('https://github.com/');
    });

    it('should contain a result for the search term', async () => {
        const searchButtonHandle = await controller.findElement('.header-search-input');
        await controller.type(searchButtonHandle, 'TestCafe');
        await controller.type(null, Keys.ENTER);

        await expect(controller.getTitle()).to.contain('TestCafe');

        const itemHandle = await controller.findElement('.repo-list-item');
        await expect(controller.getElementText(itemHandle)).to.contain('DevExpress/testcafe');
    });
});

describes.testcafe('GitHub login', {
    browsers: ['chrome'],
}, async env => {
    let controller;

    beforeEach(async () => {
        controller = env.controller;
        await controller.navigateTo('https://github.com/login');
    });

    it('should fail to login with no credentials', async () => {
        const loginButton = await controller.findElement('.btn.btn-primary.btn-block');
        await controller.click(loginButton);

        const errorHandle = await controller.findElement('#js-flash-container > div > div');
        await expect(controller.getElementText(errorHandle)).to.contain('Incorrect username or password.');
    });
});
