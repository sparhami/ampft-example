# ampft-example

This repo contains an example implementation of the abstract AMP E2E Functional Test API.

To run, try the `package.json` scripts

```
yarn
./install-drivers.sh

yarn run test-amp
yarn run test-expect
yarn run test-github
yarn run test-hello
yarn run test-iframe
```

You can also run tests using:

```
yarn run test spec/test-amp.js
```

To run a specific test case, you can use Mocha's grep functionality to find test cases matching a regex. For example:

```
yarn run test spec/test-amp.js -g "scroll"
```

## Writing tests

Tests can be written with `mocha` style structure, and using the API methods
from the `FunctionalTestController` API.

```js
import * as describes from '../lib/describes';
import {expect} from '../lib/expect';

describes.endtoend('First test', {
    engines: ['puppeteer'],
}, async env => {
  let controller;

  beforeEach(async () => {
    controller = env.controller;
    await controller.navigateTo('https://www.google.com');
  });

  it('should expect hello to not equal world', async () => {
    await expect('hello').to.not.equal('world');
  });
});
```

## Debugging tests

Tests can be debugged using the Chrome debugger. Run the test command and pass the `--inspect-brk` flag. Then open Chrome DevTools and click the Node icon. This will allow you to step through the code. The DevTools breakpoints can sometimes not trigger, but `debugger` statements in test code or component code are a dependable way to interrupt control flow.