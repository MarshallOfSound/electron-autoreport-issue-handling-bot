'use strict';

const _ = require('lodash');
const fetch = require('node-fetch');

const USER_NAME = 'MarshallOfSound';
const REPO_NAME = 'Google-Play-Music-Desktop-Player-UNOFFICIAL-';

class GitHub {
  constructor(token, clientID, clientSecret) {
    this.token = token;

    this.base_path = 'https://api.github.com/';
    this.clientID = clientID;
    this.clientSecret = clientSecret;
  }

  _fetchAllPaginated(url, initial, currentPage) {
    console.log(`Fetching page: ${currentPage}`);
    return new Promise((resolve) => {
      fetch(`${url}?per_page=100&page=${currentPage}&sort=created&direction=asc&state=all&client_id=${this.clientID}&client_secret=${this.clientSecret}`, {
        headers: {
          Authorization: `token ${this.token}`,
        },
      })
        .then((resp) => resp.json())
        .then((data) => {
          if (data.length === 0) {
            resolve(initial.concat(data));
          } else {
            this._fetchAllPaginated(url, initial.concat(data), currentPage + 1)
              .then(resolve);
          }
        });
    });
  }

  getIssues() {
    return new Promise((resolve, reject) => {
      this._fetchAllPaginated(`${this.base_path}repos/${USER_NAME}/${REPO_NAME}/issues`, [], 1)
        .then((issues) => {
          resolve(_.filter(issues, (issue) => !issue.pull_request));
        })
        .catch(reject);
    });
  }

  setIssueLabels(issueNumber, issueLabels) {
    fetch(`${this.base_path}repos/${USER_NAME}/${REPO_NAME}/issues/${issueNumber}?client_id=${this.clientID}&client_secret=${this.clientSecret}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `token ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labels: issueLabels,
      }),
    })
    .catch((err) => console.error(err));
  }

  _comment(issueNumber, message) {
    return new Promise((resolve) => {
      fetch(`${this.base_path}repos/${USER_NAME}/${REPO_NAME}/issues/${issueNumber}/comments?client_id=${this.clientID}&client_secret=${this.clientSecret}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `token ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: message,
        }),
      })
      .catch((err) => console.error(err))
      .then((resp) => resp.json())
      .then(resolve);
    });
  }

  closeIssue(issueNumber, message) {
    console.log(`Closing #${issueNumber}`);
    this._comment(issueNumber, message)
      .catch((err) => console.error(err))
      .then(() => {
        fetch(`${this.base_path}repos/${USER_NAME}/${REPO_NAME}/issues/${issueNumber}?client_id=${this.clientID}&client_secret=${this.clientSecret}`, {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            Authorization: `token ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: 'closed',
          }),
        })
        .catch((err) => console.error(err));
      });
  }
}

module.exports = GitHub;
