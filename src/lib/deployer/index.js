const deployer_map = {
    "NONE"    : './null.js',
    "GITHUB"  : "./github.js",
    "NETLIFY" : "./netlify.js"
};

module.exports = class Deployer {
    constructor(target) {

        deployer_key = target.toUpperCase();
        if (deployer_map[deployer_key]) {
            this.target = require(deployer_map[deployer_key]);
        } else {
            throw `Invalid deploy target '${target}'`;
        }
    }

    request_deploy(config) {
        return this.target.request_deploy(config);
    }
};
