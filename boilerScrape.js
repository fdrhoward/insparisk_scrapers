const fetch = require("node-fetch");
const { random } = require("lodash");

function sleepSeconds(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const MIN_PAGE_FETCH_TIMEOUT = 0.75; // seconds
const MAX_PAGE_FETCH_TIMEOUT = 2; // seconds
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36";

async function getBoilers(binNum) {
  var boilerAPI = `https://a810-dobnow.nyc.gov/Publish/PublicPortalWrapper/WrapperService.svc/SearchBoilers/2%7C${binNum}`;

  //get all of the boilers from the bin number
  const boilers = await fetch(boilerAPI, {
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
        console.log(" GET BOILERS NOT WORKING");
        return null;
      }

      return response.json();
    })
    .then(data => {
      if (!data || !data["boilerDetails"]) {
        return [];
      }
      return data["boilerDetails"];
    });

  if (!boilers) return [];

  //filters out all of the non-active boilers
  const activeBoilers = boilers.filter(
    boiler => boiler.BoilerStatusLabel === "ACTIVE"
  );

  if (!activeBoilers || activeBoilers.length < 1) return [];

  //wait after making request
  await sleepSeconds(random(MIN_PAGE_FETCH_TIMEOUT, MAX_PAGE_FETCH_TIMEOUT));

  const boilerDetails = await getBoilerData(binNum);

  const boilerDetailsObj = getBoilerDetailsObj(boilerDetails);

  const finalBoilerData = activeBoilers.map(boiler => {
    if (boilerDetailsObj && boilerDetailsObj[boiler.DeviceId]) {
      boiler.FilingDetails = boilerDetailsObj[boiler.DeviceId];
    } else {
      boiler.FilingDetails = [];
    }

    return boiler;
  });

  return finalBoilerData;
}

async function getBoilerData(binNum) {
  // https://data.cityofnewyork.us/resource/52dp-yji6.json?bin_number=4099031

  var boilerAPI = `https://data.cityofnewyork.us/resource/52dp-yji6.json?bin_number=${binNum}`;

  const boilerDetails = await fetch(boilerAPI, {
    headers: {
      accept: "application/json, text/plain, */*",
      "user-agent": USER_AGENT,
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "if-modified-since": "Mon, 26 Jul 1997 05:00:00 GMT",
      pragma: "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    },

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

  return boilerDetails;
}

//returns an object
function getBoilerDetailsObj(boilerDetails) {
  var boilerDetailsObj = {};
  boilerDetails.map((detail, i) => {
    if (!boilerDetailsObj[detail.boiler_id]) {
      boilerDetailsObj[detail.boiler_id] = [];
    }

    boilerDetailsObj[detail.boiler_id].push(detail);
  });

  return boilerDetailsObj;
}

module.exports = {
  getBoilers: getBoilers
};
