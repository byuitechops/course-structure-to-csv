const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');

const fileLocation = process.argv[2];
const outputLocation = process.argv[3];


var output = d3.csvParse(fs.readFileSync(path.resolve(fileLocation), 'utf8')).map( (obj) => {
    Object.keys(obj).forEach( (key) => {
        if (key.toLowerCase().includes('url')) obj[key] = 'https://byui.brightspace.com' + obj[key];
    });
    return obj;
} );

fs.writeFileSync(outputLocation, d3.csvFormat(output));

