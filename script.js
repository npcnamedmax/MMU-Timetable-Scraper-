const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

// Path to ChromeDriver executable
const chromeDriverPath = path.resolve('chromedriver-linux64/chromedriver'); // Adjust the path accordingly

(async function example() {
    // Path to Chrome headless shell binary
    const chromeBinaryPath = 'chrome-headless-shell-linux64/chrome-headless-shell'; // Adjust the path accordingly

    // Create a new instance of the Chrome driver
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options()
            .setChromeBinaryPath(chromeBinaryPath)
            .addArguments('--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage')
        )
        .setChromeService(new chrome.ServiceBuilder(chromeDriverPath))
        .build();

    try {
        // Example usage of the driver
        await driver.get('https://example.com');
        let title = await driver.getTitle();
        console.log('Page title is:', title);

        // Additional actions can be added here

    } finally {
        // Quit the driver
        await driver.quit();
    }
})();
