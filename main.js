const {
  By,
  Builder,
  until,
  Browser,
  LogInspector,
} = require("selenium-webdriver");
const Chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
const { WebElement } = require("selenium-webdriver");
const { Interval } = require("./Trees.js");
const { match } = require("./timetableMatch.cjs");
const readline = require("readline");

const dayMap = new Map([
  ["Monday", 0],
  ["Tuesday", 1],
  ["Wednesday", 2],
  ["Thursday", 3],
  ["Friday", 4],
  ["Saturday", 5],
  ["Sunday", 6],
]);

function timeParse(time) {
  //return {day: idx, time: Interval(Minute1, minute2)}
  //Monday\n8:00AM to 10:00AM, parse with regex
  let day = time.match(
    /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/,
  );
  //console.log(day[0]);
  if (day == null) throw Error("Invalid day");

  let timeStrArr = time.match(/\d{1,2}:\d{2}[AP]M/g);
  if (timeStrArr == null) throw Error("Invalid time");
  //console.log(timeArr);
  let timeArr = [];
  for (let time of timeStrArr) {
    let hourStr = time.match(/\d{1,2}(?=:)/);
    let minuteStr = time.match(/(?<=:)\d{2}(?=[AP]M)/);
    let ampmStr = time.match(/[AP](?=M)/);

    if (hourStr == null || minuteStr == null || ampmStr == null)
      throw Error("Invalid time");

    let hour = parseInt(hourStr[0]);
    let minute = parseInt(minuteStr[0]);
    let ampm = ampmStr[0];

    let totalMin = 0;

    if (hour != 12) {
      if (ampm == "A") {
        totalMin = hour * 60 + minute;
      } else if (ampm == "P") {
        totalMin = (hour + 12) * 60 + minute;
      }
    } else if (hour == 12) {
      if (ampm == "A") {
        totalMin = minute;
      } else if (ampm == "P") {
        totalMin = hour * 60 + minute;
      }
    }

    timeArr.push(totalMin);
  }
  const interval = new Interval(
    Math.min(timeArr[0], timeArr[1]),
    Math.max(timeArr[0], timeArr[1]),
  );
  return { day: dayMap.get(day[0]), time: interval };
}

/*criteria: {
  isOpen: number, //0 means any, 1 means open
  earliestTime: number, //-1 means any earliest time
  latestTime: number, //-1 means any latest time
  numOfDays: number //number of days in the week, 0 means any day
  days: string //12 means tues and wed, 0 means any day
}*/

function getCriteria() {
  console.log("Enter criteria: (numOfDays == days.length)");
  //parse then validate
}

function validateCriteria(criteria) {
  const { isOpen, earliestTime, latestTime, numOfDays, days } = criteria;
  let numDays = numOfDays;
  let daysIsValid = false;
  if (
    days.length == 0 ||
    days.length > 5 ||
    (days[0] == "0" && days.length != 1)
  ) {
    return false;
  }
  const newSet = new Set();
  let newDays = "";

  for (const c of days) {
    if (newSet.has(c)) {
      continue;
    }
    if (c < "0" || c > "6") {
      return false;
    } else {
      newSet.add(c);
      newDays += c;
    }
  }
  daysIsValid = true;

  if (numDays == 0 && newDays[0] != "0") {
    numDays = newDays.length;
  }

  return (
    (isOpen == 0 || isOpen == 1) &&
    earliestTime >= -1 &&
    latestTime >= -1 &&
    daysIsValid &&
    numDays > 0 &&
    numDays <= 5 &&
    (newDays[0] == "0" || numDays <= newDays.length)
  );
}

function checkMatch(combination, criteria) {
  //check if a subject matches criteria
  //subject:
  /*
  {
    optionId: '22',
    classNames: [
      'Component LEC - Class Sect TC1L - Class',
      'Component TUT - Class Sect TT4L - Class'
    ],
    datetimes: [
      { day: 0, time: Interval { low: 960, high: 1080 } },
      { day: 3, time: Interval { low: 840, high: 960 } }
    ],
    status: 'Closed'
  }
  */
  //All criterias will be filtered here except numofdays, which will be filtered when matching
  const { isOpen, earliestTime, latestTime, days } = criteria;
  return (
    (isOpen == 0 || (isOpen == 1 && combination.status == "Open")) &&
    combination.datetimes.every((dt) => {
      return (
        (earliestTime == -1 || dt.time.low >= earliestTime) &&
        (latestTime == -1 || dt.time.high <= latestTime) &&
        (days == "0" || days.includes(dt.day))
      );
    })
  );
}

function filterSubArr(subjectArr, criteria) {
  const arr = subjectArr.filter((combination) => {
    return checkMatch(combination, criteria);
  });
  if (arr.length == 0) {
    console.log("No subjects match criteria");
    return null;
  }
  return arr;
}

async function getUserInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function delay(params) {
  return new Promise((resolve) => {
    setTimeout(resolve, params);
  });
}

(async function main() {
  const Options = new Chrome.Options()
    .enableBidi()
    .addArguments("--start-maximized");
  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(Options)
    .build();
  try {
    //await driver.get('file:///home/a/selenium/test.html'); //https://clic.mmu.edu.my/psc/csprd_1/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_MD_SP_FL.GBL?Action=U&MD=Y&GMenu=SSR_STUDENT_FL&GComp=SSR_START_PAGE_FL&GPage=SSR_START_PAGE_FL&scname=CS_SSR_MANAGE_CLASSES_NAV
    await driver.get(
      "https://clic.mmu.edu.my/psc/csprd_1/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_MD_SP_FL.GBL?Action=U&MD=Y&GMenu=SSR_STUDENT_FL&GComp=SSR_START_PAGE_FL&GPage=SSR_START_PAGE_FL&scname=CS_SSR_MANAGE_CLASSES_NAV",
    );
    //set up logging
    const inspector = await LogInspector(driver);
    await inspector.onConsoleEntry(function (log) {
      console.log(log.text);
    });

    let title = await driver.getTitle();
    console.log("Page title is:", title);

    //login page
    await driver.wait(until.elementLocated(By.name("login")), 10000);
    await driver.findElement(By.id("userid")).sendKeys("1231301611");

    await driver.findElement(By.id("pwd")).sendKeys("Jx@0809");
    await driver.findElement(By.name("Submit")).click();

    //arrive at otp page
    await driver.wait(until.elementLocated(By.name("otp")), 10000);

    let otp = await getUserInput("Enter OTP: ");

    await driver.findElement(By.name("otp")).sendKeys(otp);
    await driver.findElement(By.name("Submit")).click();

    //----------------------------------------------------

    //click planner:
    await driver.wait(
      until.elementLocated(By.xpath("//*[@title='Planner']//a")),
      10000,
    );
    const element = await driver.findElement(
      By.xpath("//*[@title='Planner']//a"),
    );
    await driver.executeScript("arguments[0].scrollIntoView(true);", element);
    await delay(500);
    //await driver.executeScript("arguments[0].click();", element);

    await driver.wait(until.elementIsVisible(element), 10000).click();

    //click on term detail
    await driver.wait(
      until.elementLocated(By.xpath("//*[@title='Term Detail']")),
      10000,
    );

    await driver.findElement(By.xpath("//*[@title='Term Detail']//a")).click();

    //View all courses after selecting in planner
    await delay(500);
    await driver.wait(
      until.elementLocated(By.xpath("//*[@title = 'View Course Details']")),
      10000,
    );

    let courseDetails = []; //array of arrays of subject sections
    await delay(500);
    let elements = await driver.findElements(
      By.xpath("//*[@title = 'View Course Details']"),
    );
    //console.log(elements);
    const numSub = elements.length;

    for (let i = 0; i < numSub; i++) {
      //for every course
      let subjectArr = [];
      //view classes button
      await elements[i].click();

      //select view classes button
      await driver.wait(
        until.elementLocated(By.xpath("//*[@title = 'View Class Sections']")),
        10000,
      );
      await driver
        .findElement(By.xpath(".//*[@title = 'View Class Sections']"))
        .click();

      //select the most recent trimester
      await driver.wait(
        until.elementLocated(
          By.xpath(
            "//*[@title='Current Terms']//*[contains(text(), 'Trimester')]",
          ),
        ),
        10000,
      );
      await delay(500);
      await (
        await driver.findElements(
          By.xpath(
            "//*[@title='Current Terms']//*[contains(text(), 'Trimester')]",
          ),
        )
      )
        .at(-1)
        .click(); //the last trimester (most recent)

      await driver.wait(
        until.elementLocated(By.xpath("//table[@title='Class Options']//tr")),
        10000,
      ); //get all section rows, ignore the header
      //console.log(sections.length);
      await delay(1000);
      let sections = await driver.findElements(
        By.xpath("//table[@title='Class Options']//tr"),
      ); //get all section rows incl table header
      //console.log(sections.length);

      for (let [idx, section] of sections.entries()) {
        if (idx == 0) continue; //skip the header

        //get option number which is the first child of an element with title 'Option Number' under section/row
        let optionId = await section
          .findElement(By.xpath(".//*[@title='Option Number']/*"))
          .getText();

        //selects the immediate child of the element with title 'Class Number'
        let classNames = await section.findElements(
          By.xpath(".//*[@title='Class Number']/*"),
        );

        //console.log(classNames);
        let classNameArr = await Promise.all(
          classNames.map(async (e) => {
            return await e.getText();
          }),
        );

        //selects the spans with text 'day'
        let times = await section.findElements(
          By.xpath(
            ".//*[contains(@class, 'DAYS_TIMES')]//span[contains(text(), 'day')]",
          ),
        );
        let timeArr = await Promise.all(
          times.map(async (e) => {
            const timeStr = await e.getText(); //Monday\n8:00AM to 10:00AM, call timeParse to parse it to {day: idx, time: Interval(Minute1, minute2)}
            return timeParse(timeStr);
          }),
        );

        //get status
        let status = await section
          .findElement(
            By.xpath(".//span[text()='Open'] | .//span[text()='Closed']"),
          )
          .getText();
        subjectArr.push({
          optionId: optionId,
          classNames: classNameArr,
          datetimes: timeArr,
          status: status,
        });
      }
      courseDetails.push(subjectArr);

      //go back to course details page
      await driver.findElement(By.xpath("//*[@title='Course Detail']")).click();

      await delay(500);
      //go back to all subjects page
      await driver.wait(
        until.elementLocated(By.xpath("//*[@title='Planner']"), 10000),
      );
      await delay(500);
      await driver.findElement(By.xpath("//*[@title='Planner']")).click();

      //repopulate elements array
      await delay(500);
      await driver.wait(
        until.elementLocated(By.xpath("//*[@title = 'View Course Details']")),
        10000,
      );
      elements = await driver.findElements(
        By.xpath("//*[@title = 'View Course Details']"),
      );
    }
    console.dir(courseDetails, { depth: null });

    //get criteria here: getInput (criteria), validate criteria input and make sure final arr != empty in getInput fc.
    const criteria = {
      isOpen: 0, //0 means any, 1 means open
      earliestTime: 480, //-1 means any earliest time
      latestTime: -1, //-1 means any latest time
      numOfDays: 2, //number of days in the week, 0 means any
      days: "0", //12 means tues and wed, 0 means any day
    };

    if (!validateCriteria(criteria)) {
      console.log("Invalid criteria");
      return;
    }
    //from here onwards, repeat if criteria changes
    for (let subject of courseDetails) {
      subject = filterSubArr(subject, criteria);
    }
    /*
    while(subjectArr == null) {
      //get input then validate
      subjectArr = filterSubArr(subjectArr, criteria); //make sure subject still has sections after filter
    }
    */
    const finalArr = match(courseDetails, criteria);
    console.log("finalArr length", finalArr.length);
    console.dir(finalArr, { depth: null });
  } catch (e) {
    console.log(e);
  } finally {
    await driver.quit();
  }
})();
