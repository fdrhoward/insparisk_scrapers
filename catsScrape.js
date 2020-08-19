const fetch = require("node-fetch");

const { random } = require("lodash");

function sleepSeconds(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const MIN_PAGE_FETCH_TIMEOUT = 0.75; // seconds
const MAX_PAGE_FETCH_TIMEOUT = 2; // seconds
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36";

async function getCatsData(address) {
  const data = await fetch(address, {
    proxy:
      "http://scraperapi:4d34d0f09c6eed2415534ef48df89e67@proxy-server.scraperapi.com:8001",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "if-modified-since": "Mon, 26 Jul 1997 05:00:00 GMT",
      pragma: "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": USER_AGENT
    },
    referrer: "https://a810-dobnow.nyc.gov/publish/Index.html",
    referrerPolicy: "no-referrer-when-downgrade",
    body: null,
    method: "GET",
    mode: "cors"
  })
    .then(response => {
      if (!response || response.status !== 200) {
        return null;
      }
      return response.json();
    })
    .then(data => {
      if (!data) {
        return [];
      }

      return data;
    });

  //filters out all of the non-active cats
  const activeCats = data.filter(cat => cat.status.trim() !== "CANCELLED");

  return activeCats;
}

module.exports = {
  getCatsData: getCatsData
};
