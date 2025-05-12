const { Interval, IntervalTree } = require("./Trees.js");

const criteria = {
  isOpen: 0, //0 means any, 1 means open
  earliestTime: -1, //-1 means any earliest time
  latestTime: -1, //-1 means any latest time
  numOfDays: 3, //number of days in the week, 0 means any
  days: "0", //12 means tues and wed, 0 means any day
};

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

// Now `data` is a valid JS object that uses the Interval class.

class CmbAttributes {
  //attributes of combination
  constructor(nSubs) {
    this.dayIntervalArr = Array.from({ length: 7 }, () => new IntervalTree());
    this.subjects = new Array(nSubs); //[{optionId: int, classNames: [string], status: string, datetimes: [{day: idx, time: Interval(Minute1, minute2)}]}]
    //num of school days in a week
    this.numOfDays = 0;
  }

  hasOverlap(day, interval) {
    if (this.dayIntervalArr[day].isEmpty()) return false;
    return this.dayIntervalArr[day].hasOverlap(interval);
  }

  hasSubjectOnDay(day) {
    return !this.dayIntervalArr[day].isEmpty();
  }

  addSub(subject, idx) {
    //time in minute

    this.subjects[idx] = subject;

    for (const { day, time: interval } of subject.datetimes) {
      if (this.hasOverlap(day, interval)) {
        return;
      }

      if (this.dayIntervalArr[day].isEmpty()) {
        this.numOfDays++;
      }

      this.dayIntervalArr[day].insert(interval);
    }
  }

  removeSub(subject, idx) {
    this.subjects[idx] = null;

    for (const { day, time: interval } of subject.datetimes) {
      this.dayIntervalArr[day].remove(interval);
      if (this.dayIntervalArr[day].isEmpty()) {
        this.numOfDays--;
      }
    }
  }
}

function matchRec(courseDetails, cmbAttributes, criteria, idx, combinations) {
  /*criteria: {
      isOpen: number, //0 means any, 1 means open
      earliestTime: number, //-1 means any earliest time
      latestTime: number, //-1 means any latest time
      days: string //12 means tues and wed, 0 means any day
      numOfDays: number //number of days in the week, 0 means any day **only filters based on this
    }*/
  /* each subject in courseDetails:
      [{
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
      }]*/

  if (idx == courseDetails.length) {
    //console.dir(cmbAttributes.subjects, {depth: null});
    //console.log('pushed');
    combinations.push([...cmbAttributes.subjects]);
    return;
  }

  const subjectArr = courseDetails[idx];
  //console.dir(courseDetails, {depth: null});
  for (let i = 0; i < subjectArr.length; i++) {
    if (
      subjectArr[i].datetimes.some((datetime) => {
        return (
          cmbAttributes.hasOverlap(datetime.day, datetime.time) ||
          cmbAttributes.numOfDays > criteria.numOfDays ||
          (cmbAttributes.numOfDays == criteria.numOfDays &&
            !cmbAttributes.hasSubjectOnDay(datetime.day))
        ); //check if theres overlap or numOfDays exceeds criteria
      })
    ) {
      //console.log('skipped');
      continue;
    }
    //console.dir(subjectArr[i], {depth: null});
    //console.log('idx is ' , idx , ' num of day si ' , cmbAttributes.numOfDays , ' hasDay ' , cmbAttributes.hasSubjectOnDay(subjectArr[i].datetimes[0].day) || cmbAttributes.hasSubjectOnDay(subjectArr[i].datetimes[1].day));
    cmbAttributes.addSub(subjectArr[i], idx);
    matchRec(courseDetails, cmbAttributes, criteria, idx + 1, combinations);
    cmbAttributes.removeSub(subjectArr[i], idx);
  }
}

function match(courseDetails, criteria) {
  let cmbAttributes = new CmbAttributes(courseDetails.length);
  let combinations = [];
  if (criteria.numOfDays == 0) criteria.numOfDays = Infinity; //any num days possible
  matchRec(courseDetails, cmbAttributes, criteria, 0, combinations); //starts from first sub
  return combinations;
}

module.exports = { match };
