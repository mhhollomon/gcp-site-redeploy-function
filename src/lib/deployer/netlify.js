import got from 'got';

export function request_deploy(config) {
    console.log("Netlify Deployer called");
    var options = {
        method : 'POST',
        uri    : config.WEBHOOK_URL,
        json   : true,
        body   : {}
    };

    return new got(options);
}
