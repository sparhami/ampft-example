import testControllerHolder from './testcafe-controller-holder';
import testcafe from 'testcafe';
import fs from 'fs';


export function create(config) {
  const {
    browsers
  } = config;

  createTestFile();
  const runnerPromise = runTest(browsers);

  return Promise.all([testControllerHolder.get(), runnerPromise]).then(results => {
    const testController = results[0];
    const runner = results[1];

    return {testController, runner};
  });
}

export function createTestFile(name) {
  const testFile = `
import testControllerHolder from './lib/engines/testcafe-controller-holder';

fixture('TestCafe test')
test('test', testControllerHolder.capture);
`;
  fs.writeFileSync('test.js', testFile);
}

export function cleanupTestFile() {
  fs.unlinkSync('test.js');
}

const BASE_PORT = 1338;

let iteration = 0;
export function runTest(browsers) {
  const port1 = BASE_PORT + iteration * 2;
  const port2 = BASE_PORT + iteration * 2 + 1;
  iteration++;
  return testcafe('localhost', port1, port2)
      .then(function(tc) {
        const runner = tc.createRunner();
        // http://devexpress.github.io/testcafe/documentation/using-testcafe/programming-interface/runner.html
        runner
            .src('./test.js')
            .screenshots('reports/screenshots/', true)
            .browsers(browsers)
            .run()
            .catch(error => console.error(error));
        return tc;
      });
}
