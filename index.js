const request   = require('request');
const SendGrid  = require('@sendgrid/mail');
const {Storage} = require('@google-cloud/storage');
const config    = require('./redeploy.json');

function force_deploy() {
    return new Promise((resolve, reject) => { resolve(1); });
}

function send_email(status) {
    const date_string = new Date().toLocaleString();
    SendGrid.setApiKey(process.env.EMAIL_API_KEY);
    const msg = {
        "to"   : config.TO_ADDRESS,
        "from" : config.FROM_ADDRESS,
        "subject" : `Redeploy status - ${status}`,
        "text" : `Finished at ${date_string}. Other information will be in the function logs.`
    };

    SendGrid.send(msg)
        .then(() => {
            console.log(`Mail sent to ${config.TO_ADDRESS}.`);
        })
        .catch( (error) => {
            console.log(`Sending mail error: ${error}`)
        });
}

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
            .on('response', function(response) {
                // Server connected and responded with the specified status and headers.
            })
            .on('data', function(file_data) {
                redeploy_date += file_data;
            })
            .on('end', function() {
                console.log("Got the end");
                redeploy_date = redeploy_date.slice(0,-1);
                console.log("redeploy_date now == " + redeploy_date);
                resolve(redeploy_date);
            })
    });

}

exports.redeploy = async (data, context) => {
    var webhook_status = 'Unkown';

    /*
	request.post(config.WEBHOOK_URL, function (error, response, body) {
        if (error || ( response && response.statusCode != 200)) {
            webhook_status = 'Failure';
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        }
    });
    */


    const redeploy_date = await get_redeploy_date();

    console.log(`Read data in main = '${redeploy_date}'`);


    if (redeploy_date != '') {
        // wrong timezone, but close enough for me
        var today_string =  new Date().toISOString().substring(0, 10);
        if (today_string >= redeploy_date) {
            redeploy().then( () => {
                webhook_status = "Success";
            })
            .catch( (error) => {
                webhook_status = 'ERROR';
            });
        } else {
            webhook_status = 'Nothing to do';
        }
    } else {
        webhook_status = 'No date read';
    }

    console.log(`webhook finished - ${webhook_status}`);

    send_email(webhook_status);


};
