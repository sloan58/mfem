<p align="center">
  <b>Mutli-Factor Extension Mobility</b><br>
</p>
<hr>

A proof of concept app using Node.js and Express to add Cisco Duo MFA in front of Cisco UCM Extension Mobility Login

## Getting Started

- Clone this repo to your system and run `yarn install` or `npm install`

- Copy the `.env.example` to `.env` and fill in the details

```
IP=<App IP Address>
PORT=<Listening port>
DUO_IKEY=<Duo API Integration Key>
DUO_SKEY=<Duo API Secret Key>
DUO_HOST=<Duo API Endpoint>
UCM_IP=<UCM IP address>
UCM_USER=<UCM AXL Username>
UCM_PASS=<UCM AXL Password>
UCM_VERSION=<UCM API Schema Version>
JWT_SECRET=<String for signing JWT's>
```

Once your dependencies are installed and your environment is setup, you can run the app with:

`npm run prod`

or

`npm run dev` (nodemon)

Once the app is up and running, you'll need to create a new service in Cisco UCM. I have mine setup as below:

![mfem](https://user-images.githubusercontent.com/6303820/73004837-fbcbfe80-3dd5-11ea-8b88-ec5dfd762368.png)

### Workflow

#### UCM Authentication

MFEM will first present users with a login screen where they can enter their UCM username (userid) and their PIN, like the Extension Mobility login screen.

Those credentials will be used by an AXL integration to authenticate the user credentials. If authentication succeeds, we grab the end user `mailid` to perform a Duo push notification to the user.

#### Duo MFA

Once UCM Authentication has passed, a Duo push is sent to the user (based on `mailid`). If the user approves the push notification then MFEM will attempt to login an Extension Mobility profile.

#### EM Login

If the end user is only assigned to one EM profile then this is easy, MFEM uses AXL once again to perform an EM login request using the only profile that is assigned to the end user. However, if the user has multiple profiles then MFEM will provide an XML `CiscoIPPhoneMenu` response menu for them to select the desired profile to login - but this presents a security challenge.

Once the end user has passed UCM authentication and they have approved the Duo push notification, we need to track them somehow and also protect the MFEM API so that rogue login requests cannot be sent by unauthorized users.

To handle this challenge, the XML service response that provides a list of EM profiles is sent using an HTTP header that includes a signed JWT in order to track the response to ensure it's coming from an authenticated user.

Once the reponse is received with the selected EM profile, AXL is used to login the EM profile to the devcie.

Tip: Don't forget to enable Extension Mobility on the device profiles so that you can logout afterward!

### Prerequisites

- Cisco Unified Communication Manager with an account that has an AXL API role
- Duo Auth API application with an integration key, secret key and API hostname (endpoint)

## Authors

- [Marty Sloan](https://github.com/sloan58)
