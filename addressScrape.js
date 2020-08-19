const fetch = require("node-fetch");

async function getAddressData(address, key) {
  const data = await fetch(address, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1"
    },
    referrer: "https://a810-dobnow.nyc.gov/publish/",
    referrerPolicy: "no-referrer-when-downgrade",
    body: null,
    origin: "107.192.82.17",
    method: "GET",
    mode: "cors"
  })
    .then(response => {
      if (!response) {
        return null;
      }

      if (response.status !== 200) {
        return null;
      }

      return response.json();
    })
    .then(data => {
      if (!data || !data) {
        return {};
      }

      return data;
    });

  if (!data) return null;

  if (!key) {
    return data;
  }

  return data[key] || null;
}

module.exports = {
  getAddressData: getAddressData
};
