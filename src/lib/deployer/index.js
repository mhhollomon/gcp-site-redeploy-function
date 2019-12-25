
module.exports = class Deployer {
    constructor(target) {

        switch (target.toUpperCase()) {
            case 'NONE' :
                this.target = require('./null_deployer.js');
                break;
            case 'GITHUB' :
                this.target = require('./github.js');
                break;
            case 'NETLIFY' :
                this.target = require('./netlify.js');
                break;
            default :
                throw `Invalid deploy target '${target}'`;
        }
    }

    request_deploy(config) {
        return this.target.request_deploy(config);
    }
};
