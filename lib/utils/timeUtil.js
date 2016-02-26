'use strict';

require('date-utils');
let assert = require('assert');
let _ = require('underscore');
let app = global.app;
let consts = app.get('consts');
let exp = module.exports;

let FOUR_OCLOCK = 4;
let TWELVE_OCLOCK = 12;
let EIGHTEEN_OCLOCK = 18;

/**
 * All timeUtil.* depend on now method, mainly for test purpose
 * @return {[type]} [description]
 */
exp.now = function() {
  return new Date();
};

exp.nowTime = function() {
  return Date.now();
}

/**
 * One day begin at 4:00 am
 * @return {Date}
 */
exp.today = function() {
  // return exp.createTodayXOClock(FOUR_OCLOCK);
  let now = exp.now();
  return exp.getBeginTimeOfDate(now);
};

exp.todayTime = function() {
  return exp.today().getTime();
}

exp.yesterday = function() {
  return exp.createYesterdayXOClock(FOUR_OCLOCK);
};

exp.yesterdayTime = function() {
  return exp.yesterday().getTime();
};

exp.yesterdayLastSecond = function() {
  return exp.today().addSeconds(-1);
}

exp.tomorrow = function() {
  return exp.today().addDays(1);
}

exp.tomorrowTime = function() {
  return exp.tomorrow().getTime();
}

exp.theDayAfterTomorrow = function() {
  return exp.today().addDays(2);
}

let forever = new Date('2037-01-01 00:00:00');
Object.freeze(forever);
exp.forever = function() {
  return forever;
}

let longLongAgo = new Date('2001-01-01 00:00:00');
Object.freeze(longLongAgo);
exp.longLongAgo = function() {
  return longLongAgo;
}

exp.nextWeek = function() {
  return this.monday().addDays(exp.DAYS_OF_WEEK);
}

exp.isValidDate = function(d) {
  return _.isDate(d) && !_.isNaN(d.getTime());
}

/**
 * return the monday of this week, a week begins from monday
 * @return {Date}
 */
exp.monday = function(weekDate) {
  weekDate = !!weekDate && new Date(weekDate) || exp.now();
  // console.log(exp.format(weekDate));
  let weekDay = weekDate.getDay() === 0 ? 7 : weekDate.getDay();
  return weekDate.add({
    days: 1 - weekDay,
    hours: FOUR_OCLOCK - weekDate.getHours(),
    minutes: -weekDate.getMinutes(),
    seconds: -weekDate.getSeconds(),
    milliseconds: -weekDate.getMilliseconds(),
  });
}

exp.sunday = function(weekDate) {
  weekDate = weekDate || exp.now();
  return exp.monday(weekDate).addDays(6);
}

exp.isToday = function(time) {
  return time.getTime() >= exp.today().getTime() &&
    time.getTime() < exp.tomorrow().getTime();
};

exp.isYesterday = function(time) {
  return time.getTime() >= exp.yesterday().getTime() &&
    time.getTime() < exp.today().getTime();
};

exp.createTodayXOClock = function(x) {
  let today = exp.today();
  x = (x < FOUR_OCLOCK) ? (exp.HOURS_OF_DAY + x) : x;
  today.addHours(x - FOUR_OCLOCK);
  return today;
};

exp.createYesterdayXOClock = function(x) {
  return exp.createTodayXOClock(x).addHours(-exp.HOURS_OF_DAY);
};

exp.twelveOClock = function() {
  return exp.createTodayXOClock(TWELVE_OCLOCK);
};

exp.eighteenOClock = function() {
  return exp.createTodayXOClock(EIGHTEEN_OCLOCK);
};

exp.yesterdayEighteenOClock = function() {
  return exp.createYesterdayXOClock(EIGHTEEN_OCLOCK);
}

exp.format = function(time, format) {
  time = time || exp.now();
  format = format || 'YYYY-MM-DD HH24:MI:SS';
  return time.toFormat(format);
}

exp.print = function(time) {
  console.log(exp.format(time));
}

/**
 * return seconds from now to time, time > now
 * @param  {Date} time
 * @return {Number}
 */
exp.cd = function(time) {
  if (typeof time === 'number') {
    time = new Date(time);
  }
  let now = exp.now();
  let res = now.getSecondsBetween(time);
  // if (res < 0) {
  //   assert.ok(false, 'expect time[' + time + '] >= now[' + exp.now() + ']');
  // }
  return res;
}

let toDate = function(date) {
  if (date.constructor !== Date) {
    return new Date(date);
  };
  return date;
}

/**
 * return seconds from time1 to time2, time2 default is now, time1 <= time2
 * @param  {Date} time
 * @return {Number}
 */
exp.elapse = function(time1, time2) {
  if (typeof time1 === 'number') {
    time1 = new Date(time1);
  }
  if (typeof time2 === 'number') {
    time2 = new Date(time2);
  }
  time2 = time2 || exp.now();
  let res = time1.getSecondsBetween(time2);
  // if (res < 0) {
  //   assert.ok(false, 'expect time1[' + time1 + '] <= time2[' + time2 + ']:' + res);
  // }
  return res;
}

exp.elapseHours = function(time1, time2) {
  time2 = time2 || exp.now();
  let res = time1.getHoursBetween(time2);
  if (res < 0) {
    assert.ok(false, 'expect time1[' + time1 + '] <= time2[' + time2 + ']:' + res);
  }
  return res;
}

exp.elapseDays = function(time1, time2) {
  time2 = time2 || exp.now();
  // time1 = toDate(time1);
  // time2 = toDate(time2);
  return Math.ceil(exp.elapse(time1, time2) / exp.SECONDS_OF_DAY);
}

exp.unixtime = function(time) {
  time = time || exp.now();
  return Math.floor(time.getTime() / 1000);
}

exp.fromUnixtime = function(time) {
  assert.ok(!isNaN(time));
  return new Date(time * 1000);
}

exp.getBeginTimeOfDate = function(date) {
  date = new Date(date);
  return date.add({
    days: date.getHours() < FOUR_OCLOCK ? -1 : 0,
    hours: FOUR_OCLOCK - date.getHours(),
    minutes: -date.getMinutes(),
    seconds: -date.getSeconds(),
    milliseconds: -date.getMilliseconds(),
  });
}

exp.timespanTypeTimeRegexp = function() {
  return /^\d{4}-\d{1,2}-\d{1,2}#\d{1,2}:\d{1,2}:\d{1,2}$/;
}

exp.convertTimeSpanTypeTime = function(timeStr) {
  let regExp = exp.timespanTypeTimeRegexp();
  assert.ok(regExp.test(timeStr), 'invalid time string: ' + timeStr);
  return new Date(timeStr.replace('#', ' '));
};

exp.weeklyTypeTimeRegexp = function() {
  return /^(\d)#(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
}

/**
 * return a week date
 * @param  {String} timeStr  week date string, like '1#12:34:56'
 * @param  {Date}   weekDate optional, specified the return date of week, default value is now
 * @return {Date}            week date.
 */
exp.convertWeeklyTypeTime = function(timeStr, weekDate) {
  weekDate = weekDate || exp.now();

  let regExp = exp.weeklyTypeTimeRegexp();
  assert.ok(regExp.test(timeStr), 'invalid time string: ' + timeStr);

  let regExpRes = regExp.exec(timeStr);
  let weekDay = parseInt(regExpRes[1], 10);
  // weekDay = (7 - weekDay);
  let hour = parseInt(regExpRes[2], 10);
  let minute = parseInt(regExpRes[3], 10);
  let second = parseInt(regExpRes[4], 10);
  let milliseconds = 0;

  let res = exp.monday(weekDate);
  res.add({
    days: weekDay - res.getDay(),
    hours: hour - res.getHours(),
    minutes: minute - res.getMinutes(),
    seconds: second - res.getSeconds(),
    milliseconds: milliseconds - res.getMilliseconds(),
  });
  // console.log(timeStr, exp.format(res), res.isBefore(exp.now()));
  return res;
}

exp.dailyTypeTimeRegexp = function() {
  return /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
}

exp.convertDailyTypeTime = function(timeStr, date) {
  date = date || exp.now();
  let regExp = exp.dailyTypeTimeRegexp();
  assert.ok(regExp.test(timeStr), 'invalid time string: ' + timeStr);

  let regExpRes = regExp.exec(timeStr);
  let hour = parseInt(regExpRes[1], 10);
  let minute = parseInt(regExpRes[2], 10);
  let second = parseInt(regExpRes[3], 10);
  let milliseconds = 0;

  let res = new Date(date);
  res.add({
    hours: hour - res.getHours(),
    minutes: minute - res.getMinutes(),
    seconds: second - res.getSeconds(),
    milliseconds: milliseconds - res.getMilliseconds(),
  });
  // console.log(res);
  return res;
}

exp.registerTypeTimeRegexp = function() {
  return /^(\d+)#(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
}

exp.createRegisterTypeTime = function(timeStr, beginTime) {
  beginTime = beginTime || exp.now();
  let regExp = exp.registerTypeTimeRegexp();
  assert.ok(regExp.test(timeStr), 'invalid time string: ' + timeStr);

  let regExpRes = regExp.exec(timeStr);
  let days = parseInt(regExpRes[1], 10);
  let hour = parseInt(regExpRes[2], 10);
  let minute = parseInt(regExpRes[3], 10);
  let second = parseInt(regExpRes[4], 10);

  let res = new Date(beginTime);
  res.add({
    days: days,
    hours: hour,
    minutes: minute,
    seconds: second,
  });
  // console.log(res);
  return res;
}

exp.createDateOfOneYearByWeek = function(timeStr, beginTime) {
  beginTime = beginTime || exp.monday();

  let date = exp.convertWeeklyTypeTime(timeStr, beginTime);
  while (date.getTime() < beginTime.getTime()) {
    date.addSeconds(exp.SECONDS_OF_WEEK);
  };
  let res = [];
  for (let i = 0; i < exp.WEEKS_OF_YEAR; i++) {
    res.push(new Date(date).addSeconds(exp.SECONDS_OF_WEEK * i));
  };
  return res;
}

exp.createDateOfOneYearByDay = function(timeStr, beginTime) {
  beginTime = beginTime || exp.now();

  let date = exp.convertDailyTypeTime(timeStr, beginTime);
  while (date.isBefore(beginTime)) {
    date.addSeconds(exp.SECONDS_OF_DAY);
  };

  let res = [];
  for (let i = 0; i < exp.DAYS_OF_YEAR; i++) {
    res.push(new Date(date).addSeconds(exp.SECONDS_OF_DAY * i));
  };
  return res;
}

/*
 *   功能:实现DateAdd功能.
 *   @Param {string} interval 字符串表达式，表示要添加的时间间隔.
 *   @Param {number} 数值表达式，表示要添加的时间间隔的个数.
 *   @Param {date} 时间对象.
 *   返回:新的时间对象.
 *   Example:
 *    let now = new Date();
 *    let newDate = DateAdd( 'd', 5, now);
 */
exp.dateAdd = function(interval, number, date) {
  switch (interval) {
    case 'y':
      {
        date.setFullYear(date.getFullYear() + number);
        return date;
      }
    case 'q':
      {
        date.setMonth(date.getMonth() + number * 3);
        return date;
      }
    case 'm':
      {
        date.setMonth(date.getMonth() + number);
        return date;
      }
    case 'w':
      {
        date.setDate(date.getDate() + number * 7);
        return date;
      }
    case 'd':
      {
        date.setDate(date.getDate() + number);
        return date;
      }
    case 'h':
      {
        date.setHours(date.getHours() + number);
        return date;
      }
    case 'm':
      {
        date.setMinutes(date.getMinutes() + number);
        return date;
      }
    case 's':
      {
        date.setSeconds(date.getSeconds() + number);
        return date;
      }
    default:
      {
        date.setDate(date.getDate() + number);
        return date;
      }
  }
}

exp.convertTimeByType = function(type, timeStr, date) {
  let ActType = consts.ActType;
  switch (type) {
    case ActType.FOREVER:
      assert.ok(timeStr === -1 || timeStr === 1);
      return timeStr < 0 ? exp.longLongAgo() : exp.forever();
    case ActType.TIME_SPAN:
      return exp.convertTimeSpanTypeTime(timeStr, date);
    case ActType.DAILY:
      return exp.convertDailyTypeTime(timeStr, date);
    case ActType.WEEKLY:
      return exp.convertWeeklyTypeTime(timeStr, date);
    case ActType.REGISTER:
      return exp.convertRegisterTypeTime(timeStr, date);
    default:
      assert.ok('invalid time type: ', type);
  }
}

exp.WEEKS_OF_YEAR = 52;
exp.DAYS_OF_YEAR = 365;
exp.MONTHS_OF_YEAR = 12;
exp.DAYS_OF_WEEK = 7;
exp.HOURS_OF_DAY = 24;
exp.MINUTES_OF_HOUR = 60;
exp.SECONDS_OF_MINUTE = 60;
exp.MILLISECONDS_OF_SECOND = 1000;
exp.MILLISECONDS_OF_MINUTE = exp.SECONDS_OF_MINUTE * exp.MILLISECONDS_OF_SECOND;
exp.MILLISECONDS_OF_HOUR = exp.MILLISECONDS_OF_MINUTE * exp.MINUTES_OF_HOUR;
exp.MILLISECONDS_OF_DAY = exp.MILLISECONDS_OF_HOUR * exp.HOURS_OF_DAY;
exp.MILLISECONDS_OF_WEEK = exp.MILLISECONDS_OF_DAY * exp.DAYS_OF_WEEK;
exp.SECONDS_OF_HOUR = 3600;
exp.SECONDS_OF_DAY = exp.HOURS_OF_DAY * 60 * 60;
exp.SECONDS_OF_WEEK = exp.DAYS_OF_WEEK * exp.SECONDS_OF_DAY;
exp.THE_1ST_DAY_OF_MONTH = 1;
exp.FOUR_OCLOCK = FOUR_OCLOCK;