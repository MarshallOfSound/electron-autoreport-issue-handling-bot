const _ = require('lodash');
const assert = require('assert');
const fs = require('fs');
const GitHubAPI = require('./GitHub');
const path = require('path');

const configPath = path.resolve(`${__dirname}/../config.json`);

assert.equal(fs.existsSync(configPath), true, 'Expected a "config.json" file to be present but there wasn\'t one...'); // eslint-disable-line

const config = JSON.parse(fs.readFileSync(configPath));

const github = new GitHubAPI(config.GITHUB_TOKEN, config.CLIENT_ID, config.CLIENT_SECRET);

const performScan = () => {
  console.log(`Running scan at ${new Date()}`);
  const duplicateMap = {};

  github.getIssues()
    .then((issues) => {
      console.log(`Scanning Issues: ${issues.length}`);
      _.forEach(issues, (issue) => {
        if (/^Uncaught Exception: /g.test(issue.title) && !_.some(issue.labels, (label) => label.name === config.AUTOMATIC_LABEL)) { // eslint-disable-line
          github.setIssueLabels(issue.number, issue.labels.concat(config.AUTOMATIC_LABEL));
        }

        issue.labels = issue.labels.concat(config.AUTOMATIC_LABEL); // eslint-disable-line

        const parseAttempt = /```js\r\n(.+?)\r\n/g.exec(issue.body);
        if (!parseAttempt || parseAttempt.length < 2) return;
        const dupString = `${issue.title}:::${parseAttempt[1].substr(parseAttempt[1].length - 50, 50)}` // eslint-disable-line

        if (duplicateMap[dupString] && issue.state !== 'closed') { // eslint-disable-line
          if (!_.some(issue.labels, (label) => label.name === config.DUPLICATE_LABEL)) {
            github.setIssueLabels(issue.number, issue.labels.concat(config.DUPLICATE_LABEL));
          }
          github.closeIssue(issue.number, `Closing this automatically reported issue as a duplicate of #${duplicateMap[dupString]}`); // eslint-disable-line
        }
        if (!duplicateMap[dupString]) {
          duplicateMap[dupString] = issue.number;
        }
      });
    })
    .catch((err) => console.log(err));
};

performScan();
setInterval(performScan, 60 * 1000 * 15);
