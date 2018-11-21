import webdriver from 'selenium-webdriver';

export function create(config) {
  const {
    browsers
  } = config;

  const capabilities = {
    'browserName' : browsers[0],
  };

  const builder = new webdriver.Builder()
    .withCapabilities(capabilities);
  return Promise.resolve(builder.build());
}
