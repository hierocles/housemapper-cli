var d3 = require('d3')
  , fs = require('fs')
  , govTrack = require('govtrack-node')
  , jsdom = require('jsdom')
  , parseString = require('xml2js').parseString
  , topojson = require('topojson')
  , congressVotes = [];

govTrack.findBill({ congress: "114", bill_type: "house_bill", number: "5389" }, function(error, result) {
  if (!error) {
    for(var i = 0; i < result.objects[0].major_actions.length; i++) {
      parseString(result.objects[0].major_actions[i][3], function(error, result) {
        if(result.hasOwnProperty('vote') && !error) {
          var rollNum = result.vote.$.roll;
          var sess = new Date(result.vote.$.datetime).getFullYear();
          if(rollNum > 0) {
            govTrack.findVote({congress: 114, chamber: "house", session: sess, number: rollNum}, function(error, result) {
              if (!error) {
                var voteID = result.objects[0].id;

                govTrack.findVoteVoter({vote: voteID, limit: 441}, function(error, result) {
                  for(var i = 0; i < result.objects.length; i++) {
                    var vote = [
                      result.objects[i].person_role.district,
                      result.objects[i].option.value,
                      result.objects[i].person.name
                    ];
                    congressVotes.push(vote);
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

function govTrackIdToFips(d) {
  var state = (d.id < 1000) ? (d.id.toString().charAt(0)) : (d.id.toString().substr(0,2));
  var cd = ((d.id % 100) > 0) ? (d.id % 100) : "atlarge";
  return [state, cd];
}

function makeMap() {

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
      .state-boundaries { \
        fill: none; \
        stroke: #fff; \
        stroke-width: 1.5px; \
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

      svg.append('defs')
        .append('style')
          .attr('type', 'text/css')
          .text(css)
        .append('path')
          .attr('id', 'land')
          .datum(topojson.feature(us, us.objects.land))
          .attr('d', path);

      svg.append('clipPath')
          .attr('id', 'clip-land')
        .append('use')
          .attr('xlink:href', '#land');

      svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);

  var g = svg.append('g');

      g.attr('clip-path', 'url(#clip-land)')
        .selectAll('path')
          .data(topojson.feature(congress, congress.objects.districts).features)
        .enter().append('path')
          // Vote color code here
          // Need to map
          .attr('d', path)
          .attr('class', 'district');

      g.append('path')
        .datum(topojson.mesh(congress, congress.objects.districts, function(a, b) { return a !== b && (a.id / 1000 | 0) === (b.id / 1000 | 0); }))
        .attr('class', 'district-boundaries')
        .attr('d', path);

      g.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'state-boundaries')
        .attr('d', path);

  console.log(d3.select(document.body).html());

}
