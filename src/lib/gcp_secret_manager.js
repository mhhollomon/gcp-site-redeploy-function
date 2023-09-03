import got from 'got';
import {get_token} from './auth_token.js';


export class SecretManager {
    constructor(project_id) {
        this.project_id_ = project_id;
    }

    async get_secret_data(secret_name) {
        const secret_uri = `https://secretmanager.googleapis.com/v1/projects/${this.project_id_}/secrets/${secret_name}/versions/latest:access`;
        const token = await get_token();
        
        const data = await got(secret_uri, {
            headers : {
                'Authorization': `Bearer ${token}`,
                'X-Goog-User-Project' : this.project_id_
            }
        }).json();
        
        return Buffer.from(data.payload.data, 'base64').toString();
    }

}
