import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const tabs = await (await fetch('http://localhost:9222/json')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id;
  pending.set(key, message => message.error ? reject(message.error) : resolve(message.result));
  ws.send(JSON.stringify({ id: key, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const assert = (value, label) => { if (!value) throw new Error(label); };
const navigate = async page => {
  await send('Page.navigate', { url: `http://localhost:8000/${page}` });
  await new Promise(resolve => setTimeout(resolve, 350));
};
const screenshot = async path => {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(path, Buffer.from(shot.data, 'base64'));
};
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await navigate('social-card.svg');
await screenshot('social-card.png');
console.log('Exported social-card.png (1200 × 630)');
const pages = ['index.html', 'technical_notes.html', 'notes/atmospheric-absorption.html', 'notes/kl-divergence.html', 'notes/finetuning-llms-locally.html'];
for (const width of [1440, 390]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 960, deviceScaleFactor: 1, mobile: false });
  for (const page of pages) {
    await navigate(page);
    for (const theme of ['dark', 'light']) {
      await evaluate(`document.documentElement.dataset.theme !== '${theme}' && document.getElementById('dark-mode-toggle').click()`);
      await new Promise(resolve => setTimeout(resolve, 320));
      const result = await evaluate(`({ overflow: document.documentElement.scrollWidth > innerWidth, brokenImages: [...document.images].filter(i => !i.complete || !i.naturalWidth).length, theme: document.documentElement.dataset.theme, saved: localStorage.getItem('theme'), main: document.querySelectorAll('main').length, headings: document.querySelectorAll('h1').length, skip: !!document.querySelector(document.querySelector('.skip-link').getAttribute('href')), unnamed: [...document.querySelectorAll('a, button, input')].filter(e => !e.textContent.trim() && !e.getAttribute('aria-label') && !e.labels?.length).length })`);
      assert(!result.overflow && !result.brokenImages && result.main === 1 && result.headings === 1 && result.skip && !result.unnamed, `${width} ${page} ${theme}: ${JSON.stringify(result)}`);
      assert(result.theme === theme, 'Theme failed');
      const ax = await send('Accessibility.getFullAXTree');
      assert(ax.nodes.some(n => n.role?.value === 'main'), 'Missing accessible main landmark');
      if (theme === 'dark') await screenshot(join(tmpdir(), `portfolio-review-${width}-${page.replaceAll('/', '-')}.png`));
    }
    const broken = await evaluate(`(async () => {
      const failures = [];
      for (const a of document.querySelectorAll('a[href], link[rel="stylesheet"], link[rel="icon"], script[src]')) {
        const url = new URL(a.getAttribute('href') || a.getAttribute('src'), location.href);
        if (url.origin !== location.origin) continue;
        const r = await fetch(url);
        if (!r.ok) { failures.push(url.href); continue; }
        if (url.hash) {
          const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
          if (!doc.getElementById(decodeURIComponent(url.hash.slice(1)))) failures.push(url.href);
        }
      }
      return failures;
    })()`);
    assert(!broken.length, 'Broken internal references: ' + broken);
    // Exercise the actual keyboard skip link, not only its DOM target.
    await navigate(page);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    assert(await evaluate(`document.activeElement.classList.contains('skip-link')`), 'Skip link is not first keyboard stop');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    assert(await evaluate(`document.activeElement.tagName === 'MAIN'`), 'Skip link did not focus main');
    if (page === 'index.html') {
      const terminal = await evaluate(`(() => {
        const launcher = document.getElementById('terminal-launcher');
        launcher.focus(); launcher.click();
        const input = document.getElementById('terminal-input');
        const focus = document.activeElement === input;
        const inert = document.querySelector('main').inert;
        input.value = 'projects'; document.getElementById('terminal-form').requestSubmit();
        const output = document.getElementById('terminal-output').textContent;
        const projects = ['MCP PR Agent', 'CryptoMetrics & CryptoGrubbs', 'Network Telemetry', 'Tyre Image Analysis'].every(t => output.includes(t));
        input.value = 'whoami'; document.getElementById('terminal-form').requestSubmit();
        const role = document.getElementById('terminal-output').textContent.includes('Senior Software Engineer');
        document.getElementById('portfolio-terminal').dispatchEvent(new KeyboardEvent('keydown', {key:'Tab', bubbles:true}));
        const trapped = document.activeElement.id === 'terminal-close';
        document.getElementById('portfolio-terminal').dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
        return {focus, inert, projects, role, trapped, restored: document.activeElement === launcher && !document.querySelector('main').inert};
      })()`);
      assert(Object.values(terminal).every(Boolean), 'Terminal: ' + JSON.stringify(terminal));
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      assert(await evaluate(`getComputedStyle(document.querySelector('.hero-orbit')).animationName === 'none' && getComputedStyle(document.documentElement).scrollBehavior === 'auto'`), 'Reduced motion failed');
      await send('Emulation.setEmulatedMedia', { features: [] });
      await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
      await new Promise(resolve => setTimeout(resolve, 800));
      assert(await evaluate(`parseFloat(document.getElementById('scroll-bar').style.width) > 95`), 'Scroll indicator failed');
    }
    if (page.includes('kl-divergence')) {
      assert(await evaluate(`(() => { const s = document.getElementById('kl-drift'); s.value = 100; s.dispatchEvent(new Event('input')); return s.getAttribute('aria-valuetext') === '100% drift' && document.querySelector('.kl-bars').getAttribute('aria-label').includes('Q 18.0%'); })()`), 'KL accessibility failed');
    }
    console.log('PASS', width, page, '(both themes, layout, keyboard, internal links)');
  }
}
assert(!errors.length, 'Browser errors: ' + errors.join('; '));
console.log('No browser console or runtime errors.');
await send('Browser.close');
ws.close();
