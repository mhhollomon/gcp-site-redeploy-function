const deployer_map = {
    "NONE"    : 'null.js',
    "GITHUB"  : "github.js",
    "NETLIFY" : "netlify.js"
};

export class Deployer {
    constructor(target_config) {

        const deployer_key = target_config["NAME"].toUpperCase();
        if (deployer_map[deployer_key]) {
            this.loader_ = import('./deployer/' + deployer_map[deployer_key])
            .then((x) => { this.target_ = x; this.loader_ = undefined; });
        } else {
            throw `Invalid deploy target '${target}'`;
        }

        // at some point, may want to make the sub modules
        // have constructors so that they can validate the config
        // here.

        this.config_ = { ...target_config };
    }

    async request_deploy() {
        if (! this.target_) {
            await this.loader_;
        }
        return this.target_.request_deploy(this.config_);
    }
};
