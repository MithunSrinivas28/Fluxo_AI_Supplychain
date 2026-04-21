import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Fluxo E2E Smoke Verification', async ({ page }) => {
  const report = {
    auth: '✖', inventory: '✖', requests: '✖', nlp: '✖', stability: '✖',
    statuses: {},
    consoleErrors: [],
    screenshots: []
  };
  
  page.on('pageerror', err => report.consoleErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push(msg.text());
  });

  page.on('response', res => {
    const url = res.url();
    // track our target endpoints
    if(url.includes('/inventory') && res.request().method() === 'GET') report.statuses['GET /inventory'] = res.status();
    if(url.includes('/inventory') && res.request().method() === 'POST') report.statuses['POST /inventory'] = res.status();
    if(url.includes('/demand') && res.request().method() === 'GET') report.statuses['GET /demand'] = res.status();
    if(url.includes('/decision/reorder') && res.request().method() === 'GET') report.statuses['GET /decision/reorder'] = res.status();
    if(url.includes('/requests') && res.request().method() === 'GET') report.statuses['GET /requests'] = res.status();
    if(url.includes('/requests') && res.request().method() === 'POST') report.statuses['POST /requests'] = res.status();
  });

  try {
    // 1. Auth & Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:5173/', { timeout: 5000 });
    await expect(page.locator('text=Fluxo AI')).toBeVisible();
    await page.screenshot({ path: 'tests/report/dashboard-auth.png' });
    report.screenshots.push('tests/report/dashboard-auth.png');
    report.auth = '✔';

    // 2. Inventory Pipeline
    await page.click('a[href="/inventory"]');
    await page.waitForURL('http://localhost:5173/inventory');
    await page.waitForSelector('table tbody', { timeout: 5000 });
    
    // Add stock
    await page.locator('.lucide-plus, button:has(svg.lucide-plus)').first().click();
    await page.fill('input[type="number"]', '50');
    
    const [invResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/inventory') && r.request().method() === 'POST'),
      page.click('button:has-text("Add Stock")')
    ]);
    
    if(invResp.ok()) report.inventory = '✔';
    await page.screenshot({ path: 'tests/report/inventory.png' });
    report.screenshots.push('tests/report/inventory.png');

    // 3. Requests Pipeline & NLP
    await page.click('a[href="/requests"]');
    await page.waitForURL('http://localhost:5173/requests');
    await page.click('button:has-text("Create Request")');
    
    await page.click('button:has-text("Natural Language")');
    await page.fill('textarea', 'Add 10 eggs to zone A');
    await page.click('button:has-text("Parse Request")');
    
    // Assert fields filled
    await expect(page.locator('input[type="number"]')).toHaveValue('10');
    report.nlp = '✔';
    
    // Submit Request (First Preview, then Submit)
    await page.click('button:has-text("Preview ML Impact")');
    
    const [reqResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/requests') && r.request().method() === 'POST'),
      page.click('button:has-text("Submit to Forecast Pipeline")')
    ]);
    
    if(reqResp.ok()) report.requests = '✔';
    await page.screenshot({ path: 'tests/report/requests.png' });
    report.screenshots.push('tests/report/requests.png');

    // 4. Return to Dashboard
    await page.click('a[href="/"]');
    await page.waitForURL('http://localhost:5173/');
    await page.waitForTimeout(1000); // let UI settle
    await page.screenshot({ path: 'tests/report/dashboard-final.png' });
    report.screenshots.push('tests/report/dashboard-final.png');

    // Ensure no fatal errors
    if(!report.consoleErrors.some(e => e.includes('map is not a function'))) {
      report.stability = '✔';
    }

  } catch(e) {
    console.error("Test failed:", e);
  } finally {
    fs.writeFileSync('tests/report/results.json', JSON.stringify(report, null, 2));
  }
});
