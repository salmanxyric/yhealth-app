import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generatePDF() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const htmlPath = path.join(__dirname, 'balanciaUIUX.html');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

  const outputPath = path.join(__dirname, 'Balencia-UIUX-Vision-Questionnaire.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0.6in', bottom: '0.7in', left: '0.7in', right: '0.7in' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7px;color:#64748b;width:100%;text-align:right;padding-right:0.7in;font-family:system-ui;">Balencia UI/UX Vision Questionnaire</div>`,
    footerTemplate: `<div style="font-size:7px;color:#64748b;width:100%;display:flex;justify-content:space-between;padding:0 0.7in;font-family:system-ui;"><span>Confidential &mdash; Balencia / Xyric</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });

  console.log(`PDF generated: ${outputPath}`);
  await browser.close();
}

generatePDF().catch(console.error);
