const moment = require('moment');
const rp = require('request-promise');
const fs = require('fs');
const promisify = require('util').promisify;

const MOMENT_DATE_FORMAT = 'YYYY-MM-DD'

async function scrape(dateStart, dateEnd) {

  const start = dateStart.format(MOMENT_DATE_FORMAT);
  const end = dateEnd.format(MOMENT_DATE_FORMAT);
  let now = start;
  const results = [];
  let count = 0;

  while (moment(now).isBetween(start, end, 'days', '[]')) {
    if ((count % 7) == 0) {
      await wait(1000 * getRandomInt(2, 6));
    }
    console.log('NOW => ', now);

    try {
      const options = {
        uri: 'https://dhdr.mybluemix.net/dhdr2/v2/MedicationDispense?patient.identifier=ca-on-patient-hcn|2090669835&whenhandedover=eq' + now,
        json: true // Automatically parses the JSON string in the response
      };
      let result = await rp(options);
  
      if (result && result.total && result.total > 0) {
        try {
          await addResultObjects(result.entry, results);
        } catch (error) {
          console.error(error);
        }
      }
    } catch (error) {
      console.error(JSON.stringify(error));
      process.exit(1);
    }
    
    now = nextDate(now);
    count++;
  }

  log('Number of results => ' + results.length);
  
  let writeFileResult;

  try {
    writeFileResult = await writeToFile(results); 
  } catch (error) {
    console.error(error);
  }

  log(writeFileResult);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function addResultObjects(array, results) {
  for (const item of array) {
    if (item && item.resource) {
      results.push(item.resource);
    }
  }

  return 'done';
}

async function writeToFile(data) {
  const writeFile = promisify(fs.writeFile);
  let result;

  try {
    result = await writeFile('data.json', JSON.stringify(data), 'utf8');
  } catch (error) {
    console.error('Error writing file => ', JSON.stringify(error));
  }

  return 'Done Writing File';
  // return fs.writeFile('data.json', JSON.stringify(data), 'utf8', function (err) {
  //   if (err) {
  //     console.error(err);
  //   }

  //   return 'done writing file';
  // });
}

function nextDate(strDate) {
  return moment(strDate).add(1, 'day').format(MOMENT_DATE_FORMAT);
}

function log(str) {
  console.log(str);
}

const startDate = moment('2001-01-01');
const endDate = moment('2018-04-23');

scrape(startDate, endDate);