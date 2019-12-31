const req_prom  = require('request-promise-native');
const tok       = require('auth_token');


exports.SecretManager = class SecretManager {
    constructor(project_id) {
        this.project_id_ = project_id;
    }

    async get_secret_data(secret_name) {
        const secret_uri = `https://secretmanager.googleapis.com/v1beta1/projects/${this.project_id_}/secrets/${secret_name}/versions/latest:access`;
        const token = await tok.get_token();
        
        return req_prom.get(secret_uri, {
            headers : {
                'Authorization': `Bearer ${token}`,
                'X-Goog-User-Project' : this.project_id_
            },
            json: true
        })
        .then ((data) => { 
            return Promise.resolve(Buffer.from(data.payload.data, 'base64').toString());
        });
    }

}
