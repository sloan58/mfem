<p align="center">
  <b>Mutli-Factor Extension Mobility</b><br>
</p>
<hr>

A proof of concept app using Node.js and Express to add Cisco Duo MFA in front of Cisco UCM Extension Mobility Login


## Use Case Description

Multi-Factor Extension Mobility (MFEM) is a proof of concept application that positions Cisco's Duo Multi-Factor
authentication service in front of Extension Mobility login for Cisco Unified Communications Manager (UCM) endpoints.

Traditionally, only UCM PIN-based authentication is used to login to Cisco IP Phone's using Extension Mobility.  This
application adds a layer that also prompts the user via Multi-Factor auth prior to logging in the virual profile.


## Installation

First, clone this repo to your system and then run:
- `npm install`

That's it!

## Configuration

There are several environment variables that need to be set in order to run the application.  
Copy the `.env.example` file to `.env` and then start to fill in the details.  You might need to go and create some of 
the accounts and come back to this file afterward.

```
IP=<Web app IP Address>
PORT=<Web app listening port>
DUO_IKEY=<Duo API Integration Key>
DUO_SKEY=<Duo API Secret Key>
DUO_HOST=<Duo API Endpoint>
UCM_IP=<UCM IP address>
UCM_USER=<UCM AXL Username>
UCM_PASS=<UCM AXL Password>
UCM_VERSION=<UCM API Schema Version>
JWT_SECRET=<String for signing JWTs - this can be any random string for testing>
```

Once your dependencies are installed and all the environment variables are setup, you can run the app with:

- `npm run prod`

or

- `npm run dev` (this will use nodemon)

Once you start the app, you should get a notice in the console that your API is ready:

![image](https://user-images.githubusercontent.com/6303820/74481357-91f8bf00-4e80-11ea-9243-08ee526bea60.png)


### Creating the UCM service

Once the app is up and running, you'll need to create the UCM Phone Service that will point to MFEM.  Below is an example
 configuration that I used during development.  Use the same IP and port that you specified
 in your MFEM `.env` file.

![mfem](https://user-images.githubusercontent.com/6303820/73004837-fbcbfe80-3dd5-11ea-8b88-ec5dfd762368.png)

After creating the Phone Service, you can apply it to the IP phones that you'd like to test with.

Adding the service to the IP Phone:

![image](https://user-images.githubusercontent.com/6303820/74666360-58210480-516f-11ea-94ff-fec10f47c9c0.png)

![image](https://user-images.githubusercontent.com/6303820/74666405-6cfd9800-516f-11ea-9d34-ff17b599cc81.png)

Also make sure to enable the Extension Mobility feature at the device level:

![image](https://user-images.githubusercontent.com/6303820/74668220-bd2a2980-5172-11ea-839f-a2a00c52ac2f.png)


### Creating a Cisco Duo API account

Cisco's Duo service has a free tier (yeah!) so you can head to the link below and sign up if you don't already have an account.

[Duo Sign Up Page](https://duo.com/pricing/duo-free)

Once you're signed up for an account, follow the first steps in this quick video that explain how to create a Web SDK application
in Duo to obtain the keys you need to use the API

[Duo Web SDK Setup](https://duo.com/resources/videos/set-up-two-factor-authentication-with-duo-s-web-sdk)

## MFEM Authentication Explained

### User IP Phone Login

First, select the MFEM service (or use whatever service name you gave):

![image](https://user-images.githubusercontent.com/6303820/74666569-bd74f580-516f-11ea-8421-6163a6143992.png)


MFEM will first present users with a login screen where they can enter their UCM username (userid) and their PIN, like the Extension Mobility login screen.

![image](https://user-images.githubusercontent.com/6303820/74666701-f6ad6580-516f-11ea-9f80-0e20a655c8da.png)


Those credentials will be used to query the AXL API and authenticate the user credentials. If authentication succeeds, we grab the end user `mailid` to perform a Duo push notification.

#### Duo MFA

Once UCM PIN Authentication has passed, a Duo push is sent to the user (based on their `mailid` attribute) using their
default MFA device.  If the user approves the push notification then MFEM will attempt to login an Extension Mobility profile.

Please see below for further details.

#### EM Login

If the end user is only assigned to one EM profile in UCM then the login process is quite easy to figure out.  

MFEM will use the AXL API to perform an EM login request (doDeviceLogin) using the single profile that's assigned to the end user.  The user will receive a success message on the IP Phone:

![image](https://user-images.githubusercontent.com/6303820/74668408-2447de00-5173-11ea-8953-33e97d33e34a.png)
 

However, if the user has multiple profiles then MFEM will provide an XML `CiscoIPPhoneMenu` response menu for them to select the desired profile to login - but this presents a security challenge.

Once the end user has passed UCM authentication and they have approved the Duo push notification, we need to track them somehow and also protect the MFEM API so that rogue login requests cannot be sent by unauthorized users.

To handle this challenge, MFEM will respond and provide a list of EM profiles for the user to select from.
 That response will be sent using an HTTP header that includes a signed JWT in order to track the selection and ensure it's coming from an authenticated user.
 
 Outgoing headers to the IP Phone:
 
 ![image](https://user-images.githubusercontent.com/6303820/74668790-f1521a00-5173-11ea-8864-9583f7023e29.png)

EM Selection Menu:

![image](https://user-images.githubusercontent.com/6303820/74668867-16468d00-5174-11ea-9e4b-5184a2658b3d.png)

Once the selection is received with the desired EM profile, AXL is used to login the selected EM profile to the proper device.

![image](https://user-images.githubusercontent.com/6303820/74668907-2bbbb700-5174-11ea-9819-de167bbb05e0.png)

##### Tip: Don't forget to enable Extension Mobility on the device profiles so that you can logout afterward!

## Usage
While this is a proof of concept, it is a functioning POC and could be used to provide an added layer of security to Cisco UCM
EM login.  Fault tolerance would need to be implemented in case the primary MFEM API become unavailable.
### Prerequisites

- Cisco Unified Communication Manager with an account that has an AXL API role
- Duo Auth API application with an integration key, secret key and API hostname (endpoint)

## Author(s)

This project was written and maintained by the following individuals:

- [Marty Sloan](https://github.com/sloan58)
