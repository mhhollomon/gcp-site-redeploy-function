const req_prom  = require('request-promise-native');
const deployer  = require('deployer')
const {Storage} = require('@google-cloud/storage');
const config    = require('./redeploy.json');

//
// request_deploy
//
function request_deploy() {
    return new deployer(config.DEPLOYER).request_deploy(config);
}

function use_sendgrid(status) {
    const SendGrid  = require('@sendgrid/mail');
    const api_key = process.env.EMAIL_API_KEY;
    const date_string = new Date().toLocaleString();
    const msg = {
        "to"   : config.TO_ADDRESS,
        "from" : config.FROM_ADDRESS,
        "subject" : `Redeploy status - ${status}`,
        "text" : `Finished at ${date_string}. Other information will be in the function logs.`
    };

    SendGrid.setApiKey(process.env.EMAIL_API_KEY);
    return SendGrid.send(msg)
        .then(() => {
            console.log(`Mail sent to ${config.TO_ADDRESS}.`);
            return Promise.resolve(1);
        })
        .catch( (error) => {
            console.log(`Sending mail failed: ${error}`)
        });
}

//
// send_email
//
// Wrapper to choose the correct function based on the 
// the provider referenced in config.EMAIL_PROVIDER. The
// currently supported providers are:
// SENDGRID : SendGrid.com
// NONE : No email is sent.
//
// Always returns a Promise. The Promise will fail if the
// provider is unknown.
//
function send_email(status) {

    switch (config.EMAIL_PROVIDER.toUpperCase()) {
        case 'NONE' :
            return Promise.resolve("Null Email Provider");
        case 'SENDGRID' :
            return use_sendgrid(status);
        default :
            return Promise.reject(`Unknown email provider ${config.EMAIL_PROVIDER}`);
    }
}

//
// Reads the file from the bucket and returns the date
//
function get_redeploy_date() {
    const storage = new Storage();
    const bucket = storage.bucket(config.BUCKET_NAME);
    const remoteFile = bucket.file(config.DS_FILE_NAME);

    return new Promise(function(resolve, reject) {
        var redeploy_date = '';
        remoteFile.createReadStream()
            .on('error', function(err) {
                console.log(`Got an error: ${err}`);
                reject(err);
            })
            .on('data', function(file_data) {
                redeploy_date += file_data;
            })
            .on('end', function() {
                // Assume a nl character on the end.
                // Probably should test for it.
                redeploy_date = redeploy_date.slice(0,-1);
                console.log("redeploy_date now == " + redeploy_date);
                resolve(redeploy_date);
            })
    });

}

exports.redeploy = async (data, context) => {
    var webhook_status = 'Unkown';

    const redeploy_date = await get_redeploy_date();

    console.log(`Read data in main = '${redeploy_date}'`);

    if (redeploy_date != '') {
        // wrong timezone, but close enough for me
        var today_string =  new Date().toISOString().substring(0, 10);
        if (today_string >= redeploy_date) {
            await request_deploy()
                .then( () => {
                    webhook_status = "Success";
                })
                .catch( (error) => {
                    console.log(`Webhook ERROR: ${error}`);
                    webhook_status = 'ERROR';
                });
        } else {
            webhook_status = 'Nothing to do';
        }
    } else {
        webhook_status = 'No date read';
    }

    console.log(`webhook finished - ${webhook_status}`);

    await send_email(webhook_status).then(console.log).catch(console.log);

};

//
// Used only to test the deployment scripts
//
exports.redeploy_test = (data, context) => {};
