const request = require('request');
const sgMail  = require('@sendgrid/mail');
const config  = require('./redeploy.json');

exports.redeploy = (data, context) => {
    var webhook_status = 'Success';

	request.post(config.WEBHOOK_URL, function (error, response, body) {
        if (error || ( response && response.statusCode != 200)) {
            webhook_status = 'Failure';
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        }
    });

    console.log('webhook finished');

    const date_string = new Date().toLocaleString();
    sgMail.setApiKey(process.env.EMAIL_API_KEY);
    const msg = {
        "to"   : config.TO_ADDRESS,
        "from" : config.FROM_ADDRESS,
        "subject" : `Redeploy status - ${webhook_status}`,
        "text" : `Finished at ${date_string}. Other information will be in the function logs`
    };
    sgMail.send(msg);

    console.log(`Mail sent to ${config.TO_ADDRESS}.`);
};
