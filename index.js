const { getAddressData } = require("./addressScrape");
const { getBoilers } = require("./boilerScrape");
const { getElevators } = require("./elevatorScrape");
const { getCatsData } = require("./catsScrape");

async function getAllData() {
  var addressAPIAddress = `https://a810-dobnow.nyc.gov/Publish/PublicPortalWrapper/WrapperService.svc/getPublicPortalPropertyDetailsGet/1%7C${house_no}%7C${street_name}%7C${borough_no}`;

  const addressData = await getAddressData(
    addressAPIAddress,
    "PropertyDetails"
  );

  if (!addressData) {
    return {
      error: "No address Data"
    };
  }

  const { BIN } = addressData;

  if (!BIN) {
    return {
      addressData,
      boilerData: [],
      catsData: [],
      elevatorData: {}
    };
  }

  const { StreetName, HouseNo, Borough } = addressData;

  const boroughs = {
    1: "MANHATTAN",
    2: "BRONX",
    3: "BROOKLYN",
    4: "QUEENS",
    5: "STATEN ISLAND"
  };

  const borough = boroughs[Borough] || "MANHATTAN";

  var catsAPI = `https://data.cityofnewyork.us/resource/f4rp-2kvy.json?house=${HouseNo}&street=${StreetName}&borough=${borough}`;

  let [boilerData, elevatorData, catsData] = await Promise.all([
    getBoilers(BIN),
    getElevators(BIN),
    getCatsData(catsAPI)
  ]);

  const allData = {
    addressData,
    boilerData,
    elevatorData,
    catsData
  };

  return allData;
}

module.exports = {
  getAllData: getAllData
};
