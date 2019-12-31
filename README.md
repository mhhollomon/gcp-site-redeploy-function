# gcp-site-redeploy-function

System to redeploy a hugo web site when a future dated post is ready.

[Hugo](https://gohugo.io/) allows the user specify that a piece of content
(e.g. a post) is not to be added as a part of the site until some date in the
future. But Hugo is static generator. So, when that date arrives, something
must regenerate the site and deploy the update to the hosting solution.

For [my blog](https://www.codevamping.com), that "something" was me.

This software is an attempt to automate the task.

## Features

- **Only deploys when required** Minimizes resources.
- **Deploys to Firebase** (Netlify coming soon).
- **Pushes still deploy immediately** No interference with
  "hot-off-the-presses" updates.
- **Supports Hugo extended**
- **Email with status**

Last, but not least ...

- **Needs a Snappy Name** Time and effort have gone into building.

## Architecture

![Flow Diagram](/docs/flow.png)

1. User pushes content to master branch
2. Github action fires and does two things:
    1. Build the site and deploy.
    2. Update a timestamp in a Google Cloud Storage bucket based on the
       earliest outstanding future-dated post.

_time passes_

1. A GCP Scheduler job publishes to a topic
2. A Cloud Function activates on that topic and
    1. Reads the timestamp from the bucket
    2. If the current date is _after_ the timestamp
        - call back into github to start the actions
    3. Send email about what it did (or did not do).

The Scheduler Job is configured by default to run once a day. The system only
keeps track of posts to the day. In its current state, it cannot redeploy
things more than once a day.

## Installing

Lots more documentation to come ...

### Things you'll need

#### GitHub Repository

Sure, that might be be obvious, but you need a GitHub repository with the site
already set up. It is very helpful if you already have successfully deployed
your site using the repository. That way you things set up correctly for both
hugo and Firebase.

#### Firebase Project

You need to have some place to target in the deploy. Again, it would be very
helpful to already have done at least one deploy to the project to make sure
everything is set up correctly.

#### Google Cloud Platform Project

This will contain Function and Scheduler. Google has a free tier for many of
these services (like it does for Firebase).

Note: The Firebase Project and GCP Project can be the same project.

#### SendGrid Account

If you want to use the email facility, you will need a
[SendGrid](https://sendgrid.com/) Account. They do have a free plan for very
light volumes.

#### Firebase and GCP CLI installed.

You will need to install the CLIs for the two Google products. Instructions are
here:

- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli)
- [Cloud SDK/CLI](https://cloud.google.com/sdk/install)


### Step 1. Create a Firebase API Key and Add to GitHub as a Secret

Generate a Firebase authentication token with the CLI command:

```txt
firebase login:ci
```

You will need to interact with the oauth login screen.

Afterwards, take the token and add it as a secret to GitHub. The secret must be
named **FIREBASE_TOKEN**.

### Step 2. Create a GitHub Personal Access Token

Click on your picture in the upper right hand corner of the GitHub screen and
choose _Settings_.

In the settings screen choose _Developer Settings_

From there, choose _Personal access tokens_ and follow the prompts.

Be sure to follow the advice on the screen and save the token carefully. You
can't see again.

You may want to consider using a machine user rather than your personal user
id. That will allow the scope of the token to be only the one repo.

### Step 3. Create an SendGrid Email API Key

If you are using the SendGrid integration, then create an API Key if you don't
already have one.

### Step 4. Set Environment Variables for the Install Scripts

**These now need to be in secrets. Updated instructions to follow**
Set the following environment variables in your current shell. If you are not
using the email integration the `EMAIL_API_KEY` does not need to be set.

```bash
export GITHUB_AUTH_KEY="<key from step 2>"
export EMAIL_API_KEY="<key from step 3 >" 
export PROJECT_ID="<name of your GCP Project>"
```

### Step 5. Create `redeploy.json` from `redeploy.json.example`

Edit `redeploy.json.example` and copy to `redeploy.json`

PROJECT_ID
: The Google Cloud Platform Project Name or ID to deploy to.

BUCKET_NAME
: The name of the Cloud Storage bucket into which the timestamp file is
written.

DS_FILE_NAME
: The path and name of the timestamp file to write.


#### Deployer block

NAME
: What system will do the deploys. For Firebase the deploy will actually be
done in GitHub. Values are NONE, GITHUB, NETLIFY.

WEBHOOK_URL
: The URL used to activate the redeploy. For a Firebase deploy, this will
actually be a pointer into GitHub and will have the form
  `https://api.github.com/repos/${user}/${repo}/dispatches`.

SECRET_NAME
: The Name of the secret that will be consulted for the auth key for the
deployer.

#### Email Block
PROVIDER
: What Email Provider to use. Values are: NONE, SENDGRID.

FROM_ADDRESS
: If using the email integration, this is the address for the "from" line in
the envelope.

TO_ADDESS
: If using the email integration, this is the addess to which to send the
status email. This can be an array of address.


### Step 6. Create GCP objects

Create the Cloud Function by running the command

```txt
deploy-cmd.sh function
```

Create the Scheduler Job by running the command
```txt
deploy-cmd.sh trigger
```

### Step 7. Set up permissions

In order for the GitHub action to write to the Storage Bucket, it must be given
permission to do so.

Edit the BUCKET_NAME line in `service_account.sh`. This must match the bucket
name you used in step 5.

Run the edited `service_account.sh`.

This script will
- create the bucket
- create a service account for GitHub
- add the service account to the bucket with permissions to create,write
  objects.
- add the service account for the function to the bucket.
- create a key pair for the new service account.
- print instructions on what to do with the data.

Be sure to add the secrets as instructed.

### Step 8. Copy the workflows to the site repository

```bash
cp -R workflow/.github ${PATH_TO_REPO}
${EDITOR} ${PATH_TO_REPO}/.github/workflows//schedule-redeploy.yml
```

Change the BUCKET_URI to match the BUCKET_NAME used above.

If the BUCKET_NAME is `mybucket`, then the BUCKET_URI will be `gs://mybucket`.

Commit and push the workflows to your repository.

### Step 9. Enjoy

Write some nice new content.
