const canvas = require('canvas-api-wrapper');
const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');



/*************************************************************************
 * Get List of Online Master Courses
 *************************************************************************/
const getMasterCourses = function (account, subaccount, titleFilter = []) {
    var coursesArr = [];
    return coursesArr;
};

/*************************************************************************
 * Get List of Quizzes from a Course
 *************************************************************************/
const getQuizzesFromCourse = function (courseId) {
    var quizzes = [];
    return quizzes;
};

/*************************************************************************
 * Filter List of Quizzes to just the ones we are trying to find
 *************************************************************************/
const filterQuizList = function (quizzes = [], regexFilter) {
    // TODO Change this to return an object with .length, .path, .name, and .url properties
    return quizzes.filter( (quiz) => regexFilter.test(/* quiz.title */));
};

/*************************************************************************
 * create csv output object
 *************************************************************************/
const createCsvObject = function (currentObject, lms, cc, cid, cn, quizMatchLength, quizPath, quizName, quizUrl) {
    let c = createCsvObject.counter++; // Static Function Member
    currentObject.lms = 'lms',
    currentObject.courseCode = cc,
    currentObject.courseId = cid,
    currentObject.courseName = cn,
    currentObject[`quizMatchLength${c}`] = quizMatchLength,
    currentObject[`quizPath${c}`] = quizPath,
    currentObject[`quizName${c}`] = quizName,
    currentObject[`quizUrl${c}`] = quizUrl;
};
createCsvObject.counter = 0;

/*************************************************************************
 * map courses to json objects with wanted information
 *************************************************************************/
const mapCoursesToObj = function (courses, quizTitleFilters) {
    return courses.map((course) => {
        var currentObj = {};
        let quizzes = getQuizzesFromCourse(course.id);
        quizTitleFilters.forEach((quizTitleFilter) => {
            var quizObj = filterQuizList(quizzes, quizTitleFilter);
            createCsvObject(currentObj, 'canvas', course.code, course.id, course.name, quizObj.length, quizObj.path, quizObj.name, quizObj.url);
        });
        return currentObj;
    });
};

/*************************************************************************
 * writeFile
 *************************************************************************/
const writeFile = function (stringToWrite, outputLocation) {
    fs.writeFileSync(stringToWrite, outputLocation);
};

/*************************************************************************
 * Main
 *************************************************************************/
const main = function (account, subaccount, titles = []) {
    var quizTitleFilters = [/()/i, /()/i];
    var courses = getMasterCourses(/* account, subaccount, titles */); // Just courese Ids are needed from this list
    var csvJson = mapCoursesToObj(courses, quizTitleFilters);
    writeFile(d3.csvFormat(csvJson), path.resolve('./thingy.csv'));
};

