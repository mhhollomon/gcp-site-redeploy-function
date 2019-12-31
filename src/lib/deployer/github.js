const req_prom  = require('request-promise-native');

//
// Config must have two keys:
//      WEBHOOK_URL - the URL to Post to
//      AUTH_KEY    - token to use for authorization
//
exports.request_deploy = (config) => {
    console.log("GitHub Deployer called");

    var options = {
        method : 'POST',
        uri    : config.WEBHOOK_URL,
        json   : true,
        headers : {
            Accept: 'application/vnd.github.everest-preview+json',
            Authorization: "token " + config.AUTH_KEY,
            "User-Agent": "request"
        },
        body   : {
            event_type: "request_redeploy"
        }
    };
    return new req_prom(options);
}
