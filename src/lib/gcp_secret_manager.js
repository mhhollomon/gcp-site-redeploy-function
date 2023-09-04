import {SecretManagerServiceClient} from '@google-cloud/secret-manager';

export class SecretManager {
    constructor(project_id) {
        this.project_id_ = project_id;
    }

    async get_secret_data(secret_name) {
        const fullname = 'projects/' + this.project_id_ + '/secrets/' + secret_name + '/versions/latest'
        console.log("Getting secret " + secret_name)
        const client = new SecretManagerServiceClient();
        const [accessResponse] = await client.accessSecretVersion({
            name: fullname
          });

        return  accessResponse.payload.data.toString('utf8');
    }

}
