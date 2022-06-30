const express = require("express"); //Line 1
const bodyParser = require("body-parser");
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3
const request = require("request");

app.use(express.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.raw());

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

function createSerialNumberParams(minSerial, maxSerial) {
  if (typeof minSerial === "string") {
    minSerial = parseInt(minSerial);
  }
  if (typeof maxSerial === "string") {
    maxSerial = parseInt(maxSerial);
  }
  console.log("minSerial", minSerial, "maxSerial", maxSerial);
  if (!minSerial && !maxSerial) {
    return "";
  }

  if (!maxSerial) {
    var tempMaxSerial = minSerial + 10;
    var paramString = "";

    while (minSerial <= tempMaxSerial) {
      paramString += "&serialNumber=" + minSerial;
      minSerial++;
    }

    return paramString;
  }
  if (!minSerial) {
    var tempMinSerial = maxSerial - 10 > 0 ? maxSerial - 10 : 1;
    var paramString = "";

    while (tempMinSerial <= maxSerial) {
      paramString += "&serialNumber=" + tempMinSerial;
      tempMinSerial++;
    }

    return paramString;
  }

  var paramString = "";
  while (minSerial <= maxSerial) {
    paramString += "&serialNumber=" + minSerial;
    minSerial++;
  }
  console.log("paramString", paramString);
  return paramString;
}

// create a GET route
app.post("/moments", (req, res) => {
  var baseUrl = "https://api.momentranks.com/v1/flow/listings";
  var contract = "&contractAddress=0xe4cf4bdc1751c65d&contractName=AllDay";
  //Line 9
  //   res.send({ express: "YOUR EXPRESS BACKEND IS CONNECTED TO REACT" }); //Line 10
  console.log(req.body);
  var body = req.body;

  var url =
    baseUrl +
    "?page=1&sort=LISTING_DATE_DESC&limit=48" +
    contract +
    "&tier=COMMON&tier=RARE" +
    createSerialNumberParams(body.filters.minSerial, body.filters.maxSerial);

  request(url, function (err, resp, body) {
    var body = JSON.parse(body);
    var moments = body.docs;

    if (!body.docs) {
      console.log("crap no moments");
      res.send(body);
    } else {
      var valuedMoments = moments.map(function (moment) {
        var valueDelta =
          moment.valuations.MRValue - moment.listings.cheapestListingPrice;
        var discountValue = valueDelta / moment.listings.cheapestListingPrice;

        moment.discountValue = parseFloat(discountValue * 100).toFixed(1);
        return moment;
      });

      var sortedValuedMoments = valuedMoments.sort(function (a, b) {
        return b.discountValue - a.discountValue;
      });
      res.send(sortedValuedMoments);
    }
  });
});

// create a GET route
app.post("/moments/jersey", async (req, res) => {
  var baseUrl = "https://api.momentranks.com/v1/flow/listings";
  var contract = "&contractAddress=0xe4cf4bdc1751c65d&contractName=AllDay";
  var body = req.body;

  let allMoments = [];
  var promiseArray = [];
  let page = 1;
  let isDone = false;

  while (page < 3) {
    promiseArray.push(
      new Promise((resolve, reject) => {
        var url =
          baseUrl +
          "?page=" +
          page +
          "&sort=LISTING_DATE_DESC&limit=48" +
          contract +
          "&tier=COMMON&tier=RARE";

        request(url, function (err, resp, body) {
          var body = JSON.parse(body);
          // console.log(body);
          var moments = body.docs;

          if (!body.docs) {
            console.log("crap no moments");
            res.send(body);
          } else {
            var valuedMoments = moments.map(function (moment) {
              var valueDelta =
                moment.valuations.MRValue -
                moment.listings.cheapestListingPrice;
              var discountValue =
                valueDelta / moment.listings.cheapestListingPrice;

              moment.discountValue = parseFloat(discountValue * 100).toFixed(1);
              return moment;
            });

            var sortedValuedMoments = valuedMoments.sort(function (a, b) {
              return b.discountValue - a.discountValue;
            });
            resolve(sortedValuedMoments);
          }
        });
      })
    );
    page++;
  }
  allMoments = await Promise.all(promiseArray);
  var flatMoments = allMoments.flat();
  var jerseyMoments = flatMoments.filter(function (moment) {
    console.log(moment.metadata.jerseyNumber, moment.metadata.editionId);
    return moment.metadata.jerseyNumber == moment.metadata.editionId;
  });
  console.log(jerseyMoments.length);

  res.send(flatMoments);
});
