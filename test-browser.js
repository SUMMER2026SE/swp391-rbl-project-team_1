const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'test-screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

async function runTest() {
    console.log('🚀 Starting Playwright test on Edge...');

    const browser = await chromium.launch({
        channel: 'msedge',
        headless: false,
        args: [
            '--use-fake-ui-for-media-stream',     // Auto-allow camera & mic
            '--use-fake-device-for-media-stream', // Use fake camera/mic device
            '--allow-http-screen-capture',
        ]
    });

    const context = await browser.newContext({
        permissions: ['camera', 'microphone', 'geolocation'],
        geolocation: { latitude: 16.0722, longitude: 108.2198 },  // Da Nang
    });

    const page = await context.newPage();

    // Collect console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(`[ERROR] ${msg.text()}`);
    });
    page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

    try {
        // === Step 1: Login Page ===
        console.log('\n📍 Step 1: Navigate to login page...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login.png`, fullPage: true });
        console.log('✅ Screenshot: 01-login.png');

        // === Step 2: Login as Doctor ===
        console.log('\n📍 Step 2: Login as doctor...');
        await page.fill('input[type="email"]', 'le-duc-nhan@medbooking.com');
        await page.fill('input[type="password"]', '123456');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-filled.png`, fullPage: true });
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-login.png`, fullPage: true });
        console.log(`✅ After login - URL: ${page.url()}`);

        // === Step 3: Video Call Page ===
        console.log('\n📍 Step 3: Navigate to /doctor/video-call...');
        await page.goto('http://localhost:3000/doctor/video-call', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(3000); // Wait for webcam to initialize
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-video-call.png`, fullPage: true });
        console.log(`✅ Screenshot: 04-video-call.png, URL: ${page.url()}`);

        // Check for visible error elements
        const errorBanner = await page.$('.bg-amber-500');
        if (errorBanner) {
            const errText = await errorBanner.textContent();
            console.log(`⚠️  Error banner found: ${errText}`);
        }

        // === Step 4: Test Record Button ===
        console.log('\n📍 Step 4: Click Record button...');
        const recordBtn = await page.$('button:has-text("Bắt đầu ghi âm")');
        if (recordBtn) {
            await recordBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/05-recording.png`, fullPage: true });
            console.log('✅ Screenshot: 05-recording.png');
        } else {
            console.log('⚠️  Record button not found!');
        }

        // === Step 5: Doctors/GPS Page ===
        console.log('\n📍 Step 5: Navigate to /doctors...');
        await page.goto('http://localhost:3000/doctors', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-doctors.png`, fullPage: true });
        console.log('✅ Screenshot: 06-doctors.png');

        // Click on GPS map tab
        const gpsTab = await page.$('button:has-text("GPS"), button:has-text("Map"), button:has-text("Định vị"), [role="tab"]:has-text("GPS")');
        if (gpsTab) {
            await gpsTab.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/07-gps-tab.png`, fullPage: true });
            console.log('✅ Screenshot: 07-gps-tab.png');
        } else {
            // Look for any tab that looks like GPS/Location
            const allTabs = await page.$$('[role="tab"]');
            console.log(`Found ${allTabs.length} tabs`);
            for (const tab of allTabs) {
                const text = await tab.textContent();
                console.log(`  Tab: "${text}"`);
            }
        }

        // === GPS Button Click ===
        const gpsBtn = await page.$('button:has-text("Định vị"), button:has-text("GPS")');
        if (gpsBtn) {
            await gpsBtn.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/08-gps-result.png`, fullPage: true });
            console.log('✅ Screenshot: 08-gps-result.png');
        }

    } finally {
        // Report errors
        console.log('\n📋 Console Errors Collected:');
        if (errors.length === 0) {
            console.log('✅ No JS errors found!');
        } else {
            errors.forEach(e => console.log(`  ${e}`));
        }

        console.log('\n📸 Screenshots saved in:', SCREENSHOT_DIR);
        await browser.close();
    }
}

runTest().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
