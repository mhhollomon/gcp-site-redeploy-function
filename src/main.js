// used in the lib so we need to declare it here.
import got from 'got';

import * as deployer from './lib/deployer.js';
import {Storage} from '@google-cloud/storage';
import {SecretManager} from './lib/gcp_secret_manager.js';


import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./redeploy.json'));

//
// request_deploy
//
function request_deploy(deployer_config) {
    return new deployer(deployer_config).request_deploy();
}

function use_sendgrid(econfig, status) {
    const SendGrid = import('@sendgrid/mail');
    const api_key = econfig.AUTH_KEY;
    const date_string = new Date().toLocaleString();
    const msg = {
        "to"   : econfig.TO_ADDRESS,
        "from" : econfig.FROM_ADDRESS,
        "subject" : `Redeploy status - ${status}`,
        "text" : `Finished at ${date_string}. Other information will be in the function logs.`
    };

    SendGrid.setApiKey(api_key);
    return SendGrid.send(msg)
        .then(() => {
            return Promise.resolve(`Mail sent to ${econfig.TO_ADDRESS}.`);
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
function send_email(econfig, status) {

    switch (econfig.PROVIDER.toUpperCase()) {
        case 'NONE' :
            return Promise.resolve("Null Email Provider");
        case 'SENDGRID' :
            return use_sendgrid(econfig, status);
        default :
            return Promise.reject(`Unknown email provider ${econfig.PROVIDER}`);
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
                redeploy_date = redeploy_date.slice(0,10);
                console.log("redeploy_date now == " + redeploy_date);
                resolve(redeploy_date);
            })
    });

}

export async function redeploy (data, context) {
    var webhook_status = 'Unkown';

    const redeploy_date = await get_redeploy_date();
    const secret_manager = new SecretManager(config.PROJECT_ID);

    const deployer_config = config.DEPLOYER;

    if ("SECRET_NAME" in deployer_config) {
        deployer_config.AUTH_KEY = await secret_manager.get_secret_data(deployer_config.SECRET_NAME);
        console.log(`secret "${deployer_config.SECRET_NAME}" = ${deployer_config.AUTH_KEY.slice(-5)}`);
    }

    console.log(`Read data in main = '${redeploy_date}'`);

    if (redeploy_date != '') {
        // wrong timezone, but close enough for me
        var today_string =  new Date().toISOString().substring(0, 10);
        if (today_string >= redeploy_date) {
            await request_deploy(deployer_config)
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
    const email_config = config.EMAIL;

    if ("SECRET_NAME" in email_config) {
        email_config.AUTH_KEY = await secret_manager.get_secret_data(email_config.SECRET_NAME);
        console.log(`secret "${email_config.SECRET_NAME}" = ${email_config.AUTH_KEY.slice(-5)}`);
    }

    await send_email(email_config, webhook_status).then(console.log).catch(console.log);

};

//
// Used only to test the deployment scripts
//
export async function redeploy_test(data, context) { await redeploy(data, context); };