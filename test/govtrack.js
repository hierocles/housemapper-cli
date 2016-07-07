var d3 = require('d3')
  , fs = require('pn/fs')
  , govTrack = require('govtrack-node')
  , jsdom = require('jsdom')
  , parseString = require('xml2js').parseString
  , svg2png = require('svg2png')
  , topojson = require('topojson')
  , congressVotes = {}
  , stateToFips = {
      "AK": "2",
      "AL": "1",
      "AR": "5",
      "AZ": "4",
      "CA": "6",
      "CO": "8",
      "CT": "9",
      "DE": "10",
      "FL": "12",
      "GA": "13",
      "HI": "15",
      "IA": "19",
      "ID": "16",
      "IL": "17",
      "IN": "18",
      "KS": "20",
      "KY": "21",
      "LA": "22",
      "MA": "25",
      "MD": "24",
      "ME": "23",
      "MI": "26",
      "MN": "27",
      "MO": "29",
      "MS": "28",
      "MT": "30",
      "NC": "37",
      "ND": "38",
      "NE": "31",
      "NH": "33",
      "NJ": "34",
      "NM": "35",
      "NV": "32",
      "NY": "36",
      "OH": "39",
      "OK": "40",
      "OR": "41",
      "PA": "42",
      "RI": "44",
      "SC": "45",
      "SD": "46",
      "TN": "47",
      "TX": "48",
      "UT": "49",
      "VA": "51",
      "VI": "78",
      "VT": "50",
      "WA": "53",
      "WI": "55",
      "WV": "54",
      "WY": "56"
    };

function run(congNum, billNum) {
  /* Needed parameters:
      - congress #
      - bill #
  */
  govTrack.findBill({ congress: congNum, bill_type: 'house_bill', number: billNum}, function(error, result) {
    if (!error) {
      for(var i = 0; i < result.objects[0].major_actions.length; i++) {
        parseString(result.objects[0].major_actions[i][3], function(error, result) {
          if(result.hasOwnProperty('vote') && !error) {
            var rollNum = result.vote.$.roll;
            var sess = new Date(result.vote.$.datetime).getFullYear();
            if(rollNum > 0) {
              govTrack.findVote({congress: congNum, chamber: 'house', session: sess, number: rollNum}, function(error, result) {
                if (!error) {
                  var voteID = result.objects[0].id;

                  govTrack.findVoteVoter({vote: voteID, limit: 441}, function(error, result) {
                    for(var i = 0; i < result.objects.length; i++) {
                      var fips = stateToFips[result.objects[i].person_role.state].toString() + result.objects[i].person_role.district.toString();
                      congressVotes[fips] = {
                        "vote": result.objects[i].option.value,
                        "party": result.objects[i].person_role.party
                      };
                    }

                    makeMap();

                  });

                }
              });

            }
          }
        });
      }
    }
  });
}

function getColor(d) {
  d.id = d.id || 0;
  var state = d.id < 1000 ? d.id.toString().charAt(0) : d.id.toString().substr(0,2);
  var cd = ((d.id % 100) > 0 ? (d.id % 100) : 0).toString();
  var fips = state + cd;
  if(typeof congressVotes[fips] !== 'undefined') {
    if(congressVotes[fips].vote == ('Aye' || 'Yea')) {
      if(congressVotes[fips].party == 'Republican') {
        return 'district-rep-yes';
      }
      else if(congressVotes[fips].party == 'Democrat') {
        return 'district-dem-yes';
      }
      else {
        return 'district-yes';
      }
    }
    else if(congressVotes[fips].vote == ('No' || 'Nay')) {
      if(congressVotes[fips].party == 'Republican') {
        return 'district-rep-no';
      }
      else if(congressVotes[fips].party == 'Democrat') {
        return 'district-dem-no';
      }
      else {
        return 'district-no';
      }
    }
    else {
      return 'district';
    }
  }
  else {
    // If Congressional seat is vacant, there will be no congressVotes entry
    return 'district';
  }
}

function makeMap(fileName) {

  var document = jsdom.jsdom();

  var us = JSON.parse(fs.readFileSync('us.json', 'utf8'));
  var congress = JSON.parse(fs.readFileSync('us-cong-114.json', 'utf8'));

  var css = "<![CDATA[ \
      .background { \
        fill: none; \
      } \
      .district { \
        fill: #ccc; \
      } \
      .district-dem-yes { \
        fill: #394DE5; \
      } \
      .district-dem-no { \
        fill: #7585FF; \
      } \
      .district-rep-yes { \
        fill: #EA513C; \
      } \
      .district-rep-no { \
        fill: #EA998F; \
      } \
      .district-yes { \
        fill: #03BC82; \
      } \
      .district-no { \
        fill: #3BE2AD; \
      } \
      .state-boundaries { \
        fill: none; \
        stroke: #fff; \
        stroke-width: 1px; \
      } \
      .district-boundaries { \
        fill: none; \
        stroke: #fff; \
        stroke-width: 0.5px; \
        stroke-linecap: round; \
        stroke-linejoin: round; \
      }\
  ]]>";

  var width = 960,
      height = 500;

  var projection = d3.geo.albersUsa()
      .scale(1000)
      .translate([width/2, height/2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select(document.body).append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('width', width)
      .attr('height', height);

      svg.append("rect")
          .attr("class", "background")
          .attr("width", width)
          .attr("height", height);

  var defs = svg.append('defs');

      defs.append('path')
        .attr('id', 'land')
        .datum(topojson.feature(us, us.objects.land))
        .attr('d', path);

      defs.append('style')
          .attr('type', 'text/css')
          .text(css);

      defs.append('clipPath')
          .attr('id', 'clip-land')
        .append('use')
          .attr('xlink:href', '#land');

  var g = svg.append('g');

      g.attr('clip-path', 'url(#clip-land)')
        .selectAll('path')
          .data(topojson.feature(congress, congress.objects.districts).features)
        .enter().append('path')
          .attr('d', path)
          .attr('class', function(d) { return getColor(d); });

      g.append('path')
        .datum(topojson.mesh(congress, congress.objects.districts, function(a, b) { return a !== b && (a.id / 1000 | 0) === (b.id / 1000 | 0); }))
        .attr('class', 'district-boundaries')
        .attr('d', path);

      g.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'state-boundaries')
        .attr('d', path);

  var output = d3.select(document.body).html().replace(/clippath/g, 'clipPath');

  fs.writeFileSync(fileName, output);

}
