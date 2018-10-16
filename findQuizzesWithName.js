/*eslint-env es6 */
/*************************************************************************
 * Requires and Constants
 *************************************************************************/
const
    path = require('path'),
    fs = require('fs'),
    d3 = require('d3-dsv'),
    d2l = require('./d2lFlattenToc.js'),
    flatten = require('flat'),
    // csvLocation = path.resolve(process.argv[2]);
    csvLocation = path.join(__dirname, '(reference).csv');

/*************************************************************************
 * getDataFromBrightspace
 * @param {Object} csvParsed d3-dsv parsed csv
 *************************************************************************/
const getDataFromBrightspace = async (csvParsed) => {
    function getDataFromD2LCourseItem(list) {
        var item = list[0],
            keysToKeep = ['ancestryPath', 'Title', 'Url'],
            objOut = {
                Length: list.length
            };


        objOut = keysToKeep.reduce((obj, key) => {
            obj[key] = item === undefined ? '' : item[key];
            return obj;
        }, objOut);


        return objOut;
    }

    var outputs = [];
    await d2l.login();
    // console.dir(topics, {depth: null});
    // csvParsed.filter( (csvData) => !(csvData.code.toLowerCase().includes('archive') || csvData.name.toLowerCase().includes('archive')) );
    var mapCourses = csvParsed.map(async (csvData) => {
        var topics = await d2l.getTopics(csvData.id);
        if (!Array.isArray(topics)) return {
            lms: 'brightspace',
            courseCode: csvData.code,
            courseId: csvData.id,
            courseName: csvData.name,
            error: `error: ${JSON.stringify(topics)}`
        };
        var quizzesToFind = [{
            title: 'InstructorFB',
            regEx: /instructor\s*feedback/i
        }, {
            title: 'InstructorEval',
            regEx: /instructor\s*evaluation/i
        }]
            .map(quiz => {
                quiz.listFound = topics.filter((item) => {
                    return quiz.regEx.test(item.Title);
                });
                return quiz;
            });

        var outputObject = {
            lms: 'brightspace',
            courseCode: csvData.code,
            courseId: csvData.id,
            courseName: csvData.name,
        };

        quizzesToFind.reduce((out, quizToFind) =>{
            out[quizToFind.title] = getDataFromD2LCourseItem(quizToFind.listFound);
            return out;
        },outputObject);

        // outputObject = topics.reduce((outObj, topic, i) => {
        //     outObj['modulePath' + i] = topic.ancestryPath;
        //     outObj['activity' + i] = topic.Title;
        //     outObj['link' + i] = topic.Url;
        //     outObj['exists' + i] = true;
        //     return outObj;
        // }, outputObject);

        // var na = 'N/A';
        // topics.forEach((topic) => {
        //     topic.ancestryPath = topic.ancestryPath.replace('Ponder \\ Prove', 'Ponder / Prove'); // path.join in the d2lFlattenToc.js thinks that Ponder / Prove is a file path, so switches the / to \. This fixes it.
        //     if (topic.Title.toLowerCase().includes(hasQuiz[0].toLowerCase())) {
        //         outputObject.modulePath1 = topic.ancestryPath;
        //         outputObject.activity1 = topic.Title;
        //         outputObject.link1 = topic.Url;
        //         outputObject.exists1 = true;
        //     } else {
        //         outputObject.modulePath1 = na;
        //         outputObject.activity1 = na;
        //         outputObject.link1 = na;
        //         outputObject.exists1 = false;
        //     }
        //     if (topic.Title.toLowerCase().includes(hasQuiz[1].toLowerCase())) {
        //         outputObject.modulePath2 = topic.ancestryPath;
        //         outputObject.activity2 = topic.Title;
        //         outputObject.link2 = topic.Url;
        //         outputObject.exists2 = true;
        //     } else {
        //         outputObject.modulePath2 = na;
        //         outputObject.activity2 = na;
        //         outputObject.link2 = na;
        //         outputObject.exists2 = false;
        //     }
        // });
        return outputObject;
    });
    return await Promise.all(mapCourses);
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
    var csvProductionName = `${ms}-quiz-report.csv`;
    // read and parse csv
    var csvParsed = d3.csvParse(fs.readFileSync(csvLocation, 'utf8').replace(/^\uFEFF/, ''))
        .filter(course => course.code.includes('Online.Reference.'))
        .filter(course => !/archive/i.test(course.code + course.name));
        // .slice(0, 10); // Only sample/test 10 things
    // get data from LMSes
    var dataFromBrightspace = await getDataFromBrightspace(csvParsed);
    // console.dir(csvProduction, {length: null});
    var dataOut = dataFromBrightspace.map(row => flatten(row));
    console.dir(dataOut), {
        length: null
    };
    var csvProduction = d3.csvFormat(dataOut);
    writeFile(csvProduction, csvProductionName);
    console.log('done');
};

main();