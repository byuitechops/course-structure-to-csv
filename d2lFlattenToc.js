const d2login = require('d2l-login');
const path = require('path');

let request, baseurl;

function flatten(modules, topics = [], ancestryPath) {
    modules && modules.forEach(mod => {
        var newAncentryPath = path.join(ancestryPath ? ancestryPath : '', mod.Title);
        if (mod.Topics && mod.Topics.length !== 0) {
            mod.Topics.forEach( (topic) => {
                topic.ancestryPath = newAncentryPath;
            } );
            topics.push(mod.Topics);
        }
        if (mod.Modules && mod.Modules.length !== 0) {
            flatten(mod.Modules, topics, newAncentryPath);
        }
    });
    return topics;
}

async function getTopics(cid) {
    try {
        var toc = await new Promise((res, rej) => {
            request.get(`${baseurl}/d2l/api/le/1.24/${cid}/content/toc`, (err, resp, body) => {
                if (err || resp.statusCode !== 200) return rej(err);
                // console.dir(JSON.parse(body), {depth: -1});
                res(JSON.parse(body));
            });
        });
        toc.Modules.parentModuleTitle = toc.Title;
        var topics = [].concat(...flatten(toc.Modules));
        
        return topics;
    } catch (e) {
        // console.dir(toc, {depth:null});

    }
}

async function login(subdomain = 'byui') {
    baseurl = `https://${subdomain}.brightspace.com`;
    request = await d2login.getRequest(subdomain);
}

module.exports = {
    login,
    getTopics
};