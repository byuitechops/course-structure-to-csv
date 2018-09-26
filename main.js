/*************************************************************************
 * Requires and Constants
 *************************************************************************/
const 
    path = require('path'),
    fs = require('fs'),
    d3 = require('d3-dsv'),
    canvas = require('canvas-api-wrapper'),
    d2l = require('./d2lFlattenToc.js'),
    // csvLocation = path.resolve(process.argv[2]);
    csvLocation = path.join(__dirname, 'example.csv');

const makeProductionCsvObject = (lms, courseCode, moduleName, activity, link) => {
    return {
        lms: lms,
        courseCode: courseCode,
        moduleName: moduleName,
        activity: activity,
        link: link
    };
};

const makeVerificationCsvObject = function (courseCode, lms, bsid, cid, bsCourseName, cCourseName, bsCode, cCode) {
    return {
        courseCode: courseCode,
        lms: lms,
        bsid: bsid,
        cid: cid,
        bsCourseName: bsCourseName,
        cCourseName: cCourseName,
        bsCode: bsCode,
        cCode: cCode
    };
};

const dontPublish = function (checkModuleName, checkActivityName) {
    if ( true ) return true;
    return false;
};

/*************************************************************************
 * getDataFromCanvas
 * @param {Object} csvParsed d3-dsv parsed csv
 *************************************************************************/
const getDataFromCanvas = async (csvParsed) => {
    var output = {production: [], verification: []};
    var filteredCourses = csvParsed.filter( (course) => {
        if (course.lms.toLowerCase().includes('canvas') || course.lms.toLowerCase().includes('both')) return course;
    });
    var mapCourses = filteredCourses.map(async (csvCourseData, courseIndex) => {
        var courseObject = canvas.getCourse(csvCourseData.canvasId);
        await courseObject.get();
        output.verification.push( makeVerificationCsvObject (csvCourseData.courseCode, csvCourseData.lms, csvCourseData.brightspaceId, csvCourseData.canvasId, null, courseObject.name, null, courseObject.course_code) );
        var courseModules = await courseObject.modules.getComplete();
        // cycle through each course module
        courseModules.forEach((courseModule, cmIndex) => {
            courseModule.moduleItems.forEach( (moduleItem, miIndex) => {
                output.production.push( makeProductionCsvObject('canvas', csvCourseData.courseCode, courseModule.name, moduleItem.title, moduleItem.html_url) );
            } );
        });
    });
    await Promise.all(mapCourses);
    return output;
};

/*************************************************************************
 * getDataFromBrightspace
 * @param {Object} csvParsed d3-dsv parsed csv
 *************************************************************************/
const getDataFromBrightspace = async (csvParsed) => {
    var output = {production: [], verification: []};
    await d2l.login();
    // console.dir(topics, {depth: null});
    var filteredCourses = csvParsed.filter( (course) => {
        if (course.lms.toLowerCase().includes('brightspace') || course.lms.toLowerCase().includes('both')) return course;
    } );
    var mapCourses = filteredCourses.map( async (csvCourseData) => {
        var topics = await d2l.getTopics(csvCourseData.brightspaceId);
        topics.forEach( (topic) => {
            topic.ancestryPath = topic.ancestryPath.replace('Ponder \\ Prove', 'Ponder / Prove'); // path.join in the d2lFlattenToc.js thinks that Ponder / Prove is a file path, so switches the / to \. This fixes it.
            output.production.push(makeProductionCsvObject('brightspace', csvCourseData.courseCode, topic.ancestryPath, topic.Title, topic.Url));
            // output.verification.push(makeVerificationCsvObject(csvCourseData.courseCode, csvCourseData.lms, csvCourseData.brightspaceId, csvCourseData.canvasId, /* bsCourseName */null, null, /* bsCourseCode */null, null));
        } );
    } );
    await Promise.all(mapCourses);
    return output;
};

/*************************************************************************
 * Write File, print the error if there's an error
 * @param {string} stringToWrite thing to be written to file
 * @param {string} newFileName chosen file name
 *************************************************************************/
const writeFile = (stringToWrite, newFileName) => {
    fs.writeFile(newFileName, stringToWrite, (err) => {
        if (err) console.error(err);
        else console.log(`Writing ${newFileName}...`);
    });
}; 

/*************************************************************************
 * Main
 *************************************************************************/
const main = async function () {
    // main vars
    var ms = new Date().getTime();
    var csvProductionName = `${ms}_production.csv`;
    var csvVerificationName = `${ms}_verification.csv`;
    var csvProduction = [];
    var csvVerification = [];
    // read and parse csv
    var csvParsed = d3.csvParse( fs.readFileSync(csvLocation, 'utf8').replace(/^\uFEFF/, '') );
    // get data from LMSes
    var dataFromCanvas = await getDataFromCanvas( csvParsed );
    var dataFromBrightspace = await getDataFromBrightspace( csvParsed );
    // combine production and verification info from canvas and brightspace into the same array
    csvProduction = dataFromCanvas.production.concat( dataFromBrightspace.production );
    csvVerification = dataFromCanvas.verification.concat( dataFromBrightspace.verification );
    // console.dir(csvProduction, {length: null});
    csvProduction = d3.csvFormat( csvProduction );
    csvVerification = d3.csvFormat( csvVerification );
    writeFile(csvProduction, csvProductionName);
    writeFile(csvVerification, csvVerificationName);
};

main();