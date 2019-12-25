const req_prom  = require('request-promise-native');

exports.request_deploy = (config) => {
    var options = {
        method : 'POST',
        uri    : config.WEBHOOK_URL,
        json   : true,
        headers : {
            Accept: 'application/vnd.github.everest-preview+json',
            Authorization: "token " + process.env.GITHUB_AUTH_KEY,
            "User-Agent": "request"
        },
        body   : {
            event_type: "request_redeploy"
        }
    };
    return new req_prom(options);
}
