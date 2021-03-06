const req_prom  = require('request-promise-native');

exports.request_deploy = (config) => {
    console.log("Netlify Deployer called");
    var options = {
        method : 'POST',
        uri    : config.WEBHOOK_URL,
        json   : true,
        body   : {}
    };

    return new req_prom(options);
}
