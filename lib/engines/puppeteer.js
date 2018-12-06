import puppeteer from 'puppeteer';

export async function create(config) {
  const browser = await puppeteer.launch();
  return {browser};
}
