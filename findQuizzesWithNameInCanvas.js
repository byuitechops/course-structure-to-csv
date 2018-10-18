const canvas = require('canvas-api-wrapper');
const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');



/*************************************************************************
 * Get List of Online Master Courses
 *************************************************************************/
const getMasterCourses = async function (account, titleFilter = []) {
    var getOptions = {
        // search_term: titleFilter,
    };
    return await canvas.get(`/api/v1/accounts/${account}/courses`, getOptions);
};

/*************************************************************************
 * Get List of Quizzes from a Course. Get a list of module items and make sure one has a matching name.
 *************************************************************************/
const getQuizzesFromCourse = async function (courseId) {
    const course = canvas.getCourse(courseId);
    // console.dir(await course.quizzes.get(), {depth:1});
    return await course.quizzes.get();
};

/*************************************************************************
 * Filter List of Quizzes to just the ones we are trying to find
 *************************************************************************/
const filterQuizList = function (quizzes = [], regexFilter) {
    // TODO Change this to return an object with .length, .path, .name, and .url properties
    var quizMatches = quizzes.filter( (quiz) => regexFilter.test(quiz.title));
    console.dir(quizMatches.length, {depth:1});
    if (quizMatches !== undefined && quizMatches.length > 0) {
        return {
            number: quizMatches.length,
            // path: quizMatches[0].path,
            name: quizMatches[0].title,
            url: quizMatches[0].html_url,
        };
    } else {
        return {
            number: 0,
            // path: null,
            name: null,
            url: null,
        };
    }
};

/*************************************************************************
 * create csv output object
 *************************************************************************/
const createCsvObject = function (currentObject, lms, cc, cid, cn, quizMatchLength, quizPath, quizName, quizUrl) {
    let c = createCsvObject.counter++; // Static Function Member
    currentObject.lms = 'lms';
    currentObject.courseCode = cc;
    currentObject.courseId = cid;
    currentObject.courseName = cn;
    currentObject[`quizMatchLength_${c}`] = quizMatchLength;
    // currentObject[`quizPath_${c}`] = quizPath;
    currentObject[`quizName_${c}`] = quizName;
    currentObject[`quizUrl_${c}`] = quizUrl;
};
createCsvObject.counter = 0;

/*************************************************************************
 * map courses to json objects with wanted information
 *************************************************************************/
const mapCoursesToObj = function (courses, quizTitleFilters) {
    var csvJson = courses.map(async (course) => {
        let currentObj = {};
        let quizzes = await getQuizzesFromCourse(course.id);
        quizTitleFilters.forEach((quizTitleFilter) => {
            let quizObj = filterQuizList(quizzes, quizTitleFilter);
            createCsvObject(currentObj, 'canvas', course.course_code, course.id, course.name, quizObj.number, quizObj.path, quizObj.name, quizObj.url);
        });
        createCsvObject.counter = 0;
        return currentObj;
    });
    return Promise.all(csvJson);
};

/*************************************************************************
 * writeFile
 *************************************************************************/
const writeFile = function (stringToWrite, outputLocation) {
    fs.writeFileSync(outputLocation, stringToWrite);
    console.log('File Written');
};

/*************************************************************************
 * Main
 *************************************************************************/
const main = async function (account, courseTitleFilters = [], quizTitleFilters = []) {
    // quizTitleFilters = [/(mid-semester\s*instructor\s*feedback|student\s*feedback)/i, /(instructor\s*evaluation|student\s*evaluation|end-of-Semester\s*Instructor\s*Feedback)/i];
    // quizTitleFilters = [/instructor\s*feedback|student\s*feedback)/i, /(instructor\s*evaluation|student\s*evaluation|Instructor\s*Feedback)/i];
    quizTitleFilters = [/End-of-Semester Instructor Feedback/i];
    var courses = await getMasterCourses(account, courseTitleFilters); // Just courese Ids are needed from this list
    var csvJson = await mapCoursesToObj(courses/* .slice(0,10) */, quizTitleFilters);
    writeFile(d3.csvFormat(csvJson), path.resolve('./thingy.csv'));
};

main(42, [], []);