const d2login = require('d2l-login');

let request, baseurl;

function flatten(modules, topics = []) {
    modules && modules.forEach(mod => {
        if (mod.Topics && mod.Topics.length !== 0) topics.push(mod.Topics);
        if (mod.Modules && mod.Modules.length !== 0) flatten(mod.Modules, topics);
    });
    return topics;
}

async function getTopics(cid) {
    var toc = await new Promise((res, rej) => {
        request.get(`${baseurl}/d2l/api/le/1.24/${cid}/content/toc`, (err, _, body) => {
            if (err) return rej(err);
            res(JSON.parse(body));
        });
    });
    var topics = [].concat(...flatten(toc.Modules));

    return topics;
}

async function login(subdomain = 'byui') {
    baseurl = `https://${subdomain}.brightspace.com`;
    request = await d2login.getRequest(subdomain);
}

module.exports = {
    login,
    getTopics
};