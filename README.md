# housemapper-cli
> Generating House of Representatives vote maps from the command line


**Housemapper** is a  command line tool for generating beautiful maps of House of Representatives votes from the GovTrack public API. It's powered by [Node.js](https://nodejs.org/) and [D3.js](https://d3js.org/).


## Installation

In order to use ``housemapper`` anywhere in the command line, you must install it globally with [npm](https://www.npmjs.com/):

```sh
npm install -g housemapper
```


## Usage

```sh
Usage: housemapper -c [num] -b [num] -f [string] -w [num] -h [num]

Options:
  -c      Congress number (only 114 is supported currently)           [required]
  -b      House bill number                                           [required]
  -f      Custom file name ending in .svg (default: output.svg)
  -w      Custom canvas width in pixels (default: 960)
  -h      Custom canvas height in pixels (default: 500)
  -s      Custom CSS stylesheet
  --help  Show help

Examples:
  housemapper -c 114 -b 4038 -f map.svg  Generate a map of votes on H.R. 4038
                                         and save to map.svg in current working directory
```

### Custom styling

The default stylesheet is located at ``<install path>/bin/styles/default.css``, and can be customized to suit your needs or used a template. You can create a new stylesheet within the ``bin/styles`` directory and push it through the command-line by using the ``-s`` option. Stylesheets in other directories are not currently supported.

## Release History

* 0.0.1
    * Work in progress

## Meta

Dylan Henrich – [@dylanhenrich](https://twitter.com/dylanhenrich) – dylan@dylanist.com

Distributed under the MIT license. See ``LICENSE`` for more information.
