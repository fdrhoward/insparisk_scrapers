const fetch = require("node-fetch");

const { random } = require("lodash");

function sleepSeconds(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const MIN_PAGE_FETCH_TIMEOUT = 0.75; // seconds
const MAX_PAGE_FETCH_TIMEOUT = 4; // seconds

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36";

async function getElevators(binNum) {
  const binElevators = await getAllBinElevators(binNum);

  //array og elevator Guids
  var elevatorDeviceGuids = binElevators.map(elevator => {
    return elevator.DeviceGuid;
  });

  //removes duplicates
  elevatorDeviceGuids = [...new Set(elevatorDeviceGuids)];

  elevatorFilings = await getAllElevatorDetails(elevatorDeviceGuids);

  var ELV3Guids = elevatorFilings.map(elevator => {
    return elevator.ELV3Guid;
  });

  ELV3Guids = [...new Set(ELV3Guids)];

  const filingDetails = [];
  //no longer getting filing details
  // const filingDetails = await getAllFilingDetails(ELV3Guids);

  const AllElevatorData = {
    elevators: binElevators,
    elevatorFilings,
    filingDetails
  };

  return AllElevatorData;
}

async function getAllBinElevators(bin) {
  var binElevators = [];

  const elevatorData = await getBinElevators(bin);

  //add bin num to the elevators
  var elevatorsWithBinArr = elevatorData.map(elevator => {
    var e = Object.assign({}, elevator);
    e.bin = bin;
    return e;
  });

  return elevatorsWithBinArr;
}

async function getBinElevators(bin) {
  //post request
  const data = await fetch(
    "https://a810-dobnow.nyc.gov/Publish/PublicPortalWrapper/WrapperService.svc/GetPublicPortalELV3Devices",
    {
      proxy:
        "http://scraperapi:4d34d0f09c6eed2415534ef48df89e67@proxy-server.scraperapi.com:8001",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json;charset=UTF-8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
      },
      referrer: "https://a810-dobnow.nyc.gov/publish/Index.html",
      referrerPolicy: "no-referrer-when-downgrade",
      body: `{"SearchBy":"2","Bin":"${bin}"}`,
      method: "POST",
      mode: "cors"
    }
  )
    .then(response => {
      if (!response || response.status !== 200) {
        return [];
      }

      return response.json();
    })
    .then(data => {
      if (!data || !data.devices) {
        return [];
      }

      return data.devices;
    });

  return data;
}

async function getAllElevatorDetails(deviceGuids) {
  var allElevatorDetails = [];

  for (var i = 0; i < deviceGuids.length; i++) {
    const elevatorDetails = await getElevatorDetails(deviceGuids[i]);

    await sleepSeconds(random(MIN_PAGE_FETCH_TIMEOUT, MAX_PAGE_FETCH_TIMEOUT));

    var addedGuid = elevatorDetails.map(elevator => {
      var e = Object.assign({}, elevator);
      e.DeviceGuid = deviceGuids[i];

      return e;
    });

    allElevatorDetails = [...allElevatorDetails, ...addedGuid];
  }

  return allElevatorDetails;
}

async function getElevatorDetails(elevatorId) {
  //post request
  const data = await fetch(
    "https://a810-dobnow.nyc.gov/Publish/PublicPortalWrapper/WrapperService.svc/GetPublicPortalElevatorSafetyFillings",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json;charset=UTF-8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
      },
      referrer: "https://a810-dobnow.nyc.gov/publish/Index.html",
      referrerPolicy: "no-referrer-when-downgrade",
      body: `{"DeviceID":"${elevatorId}"}`,
      method: "POST",
      mode: "cors"
    }
  )
    .then(response => {
      if (!response || response.status !== 200) {
        return {};
      }

      return response.json();
    })
    .then(data => {
      if (!data || !data.ListSafetyDetails) {
        return [];
      }

      return data.ListSafetyDetails;
    });

  return data;
}
async function getAllFilingDetails(ELV3Guids) {
  var allFilingDetails = [];

  for (var i = 0; i < ELV3Guids.length; i++) {
    const filingDetails = await getFilingDetails(ELV3Guids[i]);

    const {
      Elv3List,
      LocationInformation,
      OwnerInformation,
      PerformingAgencyDirectorInformation,
      PerformingAgencyInspectorInformation,
      WitnessingAgencyDirectorInformation,
      WitnessingAgencyInspectorInformation
    } = filingDetails;

    const DeviceInformation = Elv3List[0];

    // var newOwnerInformation = renameKeys(OwnerInformation, "owner_info");
    var newPerformingAgencyDirectorInformation = renameKeys(
      PerformingAgencyDirectorInformation,
      "director_info"
    );

    var newPerformingAgencyInspectorInformation = renameKeys(
      PerformingAgencyInspectorInformation,
      "inspector_info"
    );

    var newWitnessingAgencyDirectorInformation = renameKeys(
      WitnessingAgencyDirectorInformation,
      "witness_director_info"
    );

    var newWitnessingAgencyInspectorInformation = renameKeys(
      WitnessingAgencyInspectorInformation,
      "witness_inspector_info"
    );

    // console.log(DeviceInformation);
    const mergedObject = mergeObjectsTogether([
      { ELV3Guid: ELV3Guids[i] },
      DeviceInformation,
      LocationInformation,
      OwnerInformation,
      newPerformingAgencyDirectorInformation,
      newPerformingAgencyInspectorInformation,
      newWitnessingAgencyDirectorInformation,
      newWitnessingAgencyInspectorInformation
    ]);

    await sleepSeconds(random(MIN_PAGE_FETCH_TIMEOUT, MAX_PAGE_FETCH_TIMEOUT));

    allFilingDetails = [...allFilingDetails, ...[mergedObject]];
  }

  return allFilingDetails;
}

// getFilingDetails();
async function getFilingDetails(ELV3Guid) {
  const data = await fetch(
    `https://a810-dobnow.nyc.gov/Publish/PublicPortalWrapper/WrapperService.svc/GetPublicPortalELV3Details/${ELV3Guid}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "if-modified-since": "Mon, 26 Jul 1997 05:00:00 GMT",
        pragma: "no-cache",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
      },
      referrer: "https://a810-dobnow.nyc.gov/publish/Index.html",
      referrerPolicy: "no-referrer-when-downgrade",
      body: null,
      method: "GET",
      mode: "cors"
    }
  )
    .then(response => {
      if (!response || response.status !== 200) {
        return {};
      }

      return response.json();
    })
    .then(data => {
      if (!data) {
        return null;
      }

      return data;
    });

  return data;
}

function renameKeys(obj, newKeys) {
  const keyValues = Object.keys(obj).map(key => {
    const newKey = newKeys + "_" + key;
    return { [newKey]: obj[key] };
  });
  return Object.assign({}, ...keyValues);
}

function mergeObjectsTogether(arrOfObj) {
  var newObj = {};

  for (var i = 0; i < arrOfObj.length; i++) {
    var obj = arrOfObj[i];

    newObj = { ...newObj, ...obj };
  }

  return newObj;
  // console.log("NEW OBJ: ", newObj);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = {
  getElevators
};
