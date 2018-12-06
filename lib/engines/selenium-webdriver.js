import webdriver from 'selenium-webdriver';

export function create(config) {
  const {
    browsers
  } = config;

  const capabilities = {
    'browserName' : 'chrome',
  };

  const builder = new webdriver.Builder()
      .withCapabilities(capabilities);
  return Promise.resolve({testController: builder.build()});
}
