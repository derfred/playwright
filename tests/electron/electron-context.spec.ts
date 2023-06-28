import { expect, electronTest as test } from './electronTest';
import { parseTraceRaw } from '../config/utils';

test("should attach to an existing BrowserWindow", async ({ launchElectronApp }) => {
  const electronApp = await launchElectronApp('electron-window-attach.js');
  await electronApp.firstWindow();

  const checked = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    const context = await globalThis.__playwright._electron.attach(window);
    const page = await context.page();
    await page.setContent(`<input id='checkbox' type='checkbox'></input>`);
    await page.check('input');
    return await page.evaluate('checkbox.checked')
  });
  expect(checked).toBe(true);
});

test("should trace actions on existing window", async ({ launchElectronApp, server }, testInfo) => {
  const electronApp = await launchElectronApp('electron-window-attach.js');
  electronApp.process().stdout.on('data', (data) => console.log(`> ${data}`));
  electronApp.process().stderr.on('data', (data) => console.log(`> ${data}`));
  await electronApp.firstWindow();

  const traceFile = testInfo.outputPath('trace.zip');
  const serverPrefix = server.PREFIX;

  await electronApp.evaluate(async ({ BrowserWindow }, { serverPrefix, traceFile }) => {
    const window = BrowserWindow.getAllWindows()[0];
    const context = await globalThis.__playwright._electron.attach(window);
    await context.tracing.start({ snapshots: true, screenshots: true, sources: true });
    const page = await context.page();
    await page.goto(serverPrefix + '/input/button.html');
    await page.click('button');
    await context.tracing.stop({ path: traceFile });
  }, { serverPrefix, traceFile });

  const { events, actions } = await parseTraceRaw(traceFile);
  expect(events[0].type).toBe('context-options');
  expect(actions).toEqual(['page.goto', 'page.click']);
});
