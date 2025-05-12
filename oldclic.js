//will not work

const {
  By,
  Builder,
  until,
  Browser,
  LogInspector,
} = require("selenium-webdriver");
const Chrome = require("selenium-webdriver/chrome");
const assert = require("assert");

async function getCoursesInPlanner(driver) {
  let courses = [];
  let elements = await driver.findElements(
    By.xpath("//*[starts-with(@id, 'CRSE_NAME')]"),
  );
  let descriptions = await driver.findElements(
    By.xpath("//*[@title='Description']"),
  );

  for (let i = 0; i < Math.min(elements.length, descriptions.length); i++) {
    //remove whitespaces
    let text = (await elements[i].getText()).replaceAll(" ", "");
    let title = await descriptions[i].getText();
    let id = await elements[i].getAttribute("id");
    courses.push({ id: id, code: text, title });
  }

  return courses;
}

async function getCourseTime(driver, course) {}

//async function findClassLink

(async function main() {
  let driver;

  try {
    const Options = new Chrome.Options().enableBidi();
    driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(Options)
      .build();
    await driver.get("file:///home/a/selenium/test.html");
    //set up logging
    const inspector = await LogInspector(driver);
    await inspector.onConsoleEntry(function (log) {
      console.log(log.text);
    });

    let title = await driver.getTitle();
    console.log("Page title is:", title);
    /*await driver.wait(until.elementLocated(By.id('SSS_MY_PLANNER')), 10000);

    let courses = await getCoursesInPlanner(driver);
    console.log(courses);
    */

    //await driver.wait(until.elementLocated(By.xpath("//*[@value = 'Plan by My Requirements']")), 10000);

    //await driver.findElement(By.xpath("//*[@value = 'Plan by My Requirements']")).click();
    /*
    await driver.wait(until.elementLocated(By.xpath("//*[@value = 'Expand All']")), 10000);

    await driver.findElement(By.xpath("//*[@value = 'Expand All']")).click();
    */
    //find the course to click
    await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(),'PROGRAMMING FUNDAMENTALS')]"),
      ),
      10000,
    );
    await driver
      .findElement(By.xpath("//*[contains(text(),'PROGRAMMING FUNDAMENTALS')]"))
      .click();

    //after clicking on course, click on view class sections (assume it works)
    /*
    await driver.wait(until.elementLocated(By.xpath("//*[@value = 'View Class Sections']")), 10000);
    await driver.findElement(By.xpath("//*[@value = 'View Class Sections']")).click();
    */
    //select
    await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(),'Show Sections')]", 10000),
      ),
    );
    await driver
      .findElement(By.xpath("//*[contains(text(),'View Class Sections')]"))
      .click();
  } catch (e) {
    console.log(e);
  } finally {
    await driver.quit();
  }
})();
