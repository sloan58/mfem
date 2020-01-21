const soap = require('strong-soap').soap
require('dotenv').config()
const path = require('path')
const _ = require('lodash')
const clientConfig = {
  auth:
    'Basic ' +
    Buffer.from(`${process.env.UCM_USER}:${process.env.UCM_PASS}`).toString(
      'base64'
    ),
  url: path.join(__dirname, `schema/${process.env.UCM_VERSION}/AXLAPI.wsdl`)
}

module.exports.authenticateUcm = (userid, pin) => {
  return new Promise((resolve, reject) => {
    soap.createClient(clientConfig.url, (err, client) => {
      if (err) {
        console.log(err)
        return reject()
      }
      client.setEndpoint(`https://${process.env.UCM_IP}:8443/axl/`)
      client.addHttpHeader('Authorization', clientConfig.auth)
      client.addHttpHeader('Content-Type', 'text/xml; charset=utf-8')
      client.addHttpHeader(
        'SOAPAction',
        `CUCM:DB ver=${process.env.UCM_VERSION}`
      )

      client.setSecurity(
        new soap.ClientSSLSecurity(undefined, undefined, undefined, {
          rejectUnauthorized: false
        })
      )

      client.doAuthenticateUser(
        {
          userid: userid,
          pin: pin
        },
        (err, result) => {
          if (err) {
            let message
            let statusCode = _.get(err, 'response.statusCode', false)
            let faultString = _.get(
              err,
              'root.Envelope.Body.Fault.faultstring',
              false
            )

            if (!statusCode) {
              message = `Could not connect - Please check the IP address and try again.`
            } else if (statusCode == '401') {
              message = `Unauthorized - Please check the AXL account information and try again.\n`
            } else if (faultString) {
              message = faultString
            } else {
              message = `An unknown error occurred - The remote system said: ${err.response.statusMessage}`
            }
            return reject(message)
          }

          if (!result.return.userAuthenticated) {
            return reject('Invalid Username or PIN')
          }

          // Get the user details for login
          client.getUser({ userid: userid }, (err, result) => {
            if (err) {
              let message
              let statusCode = _.get(err, 'response.statusCode', false)
              let faultString = _.get(
                err,
                'root.Envelope.Body.Fault.faultstring',
                false
              )

              if (!statusCode) {
                message = `Could not connect - Please check the IP address and try again.`
              } else if (statusCode == '401') {
                message = `Unauthorized - Please check the AXL account information and try again.\n`
              } else if (faultString) {
                message = faultString
              } else {
                message = `An unknown error occurred - The remote system said: ${err.response.statusMessage}`
              }
              return reject(message)
            }

            resolve(result.return.user)
          })
        }
      )
    })
  })
}

module.exports.loginDevice = (device, profile, userid) => {
  return new Promise((resolve, reject) => {
    soap.createClient(clientConfig.url, (err, client) => {
      client.setEndpoint(`https://${process.env.UCM_IP}:8443/axl/`)
      client.addHttpHeader('Authorization', clientConfig.auth)
      client.addHttpHeader('Content-Type', 'text/xml; charset=utf-8')
      client.addHttpHeader(
        'SOAPAction',
        `CUCM:DB ver=${process.env.UCM_VERSION}`
      )
      client.setSecurity(
        new soap.ClientSSLSecurity(undefined, undefined, undefined, {
          rejectUnauthorized: false
        })
      )

      client.doDeviceLogin(
        {
          deviceName: device,
          loginDuration: '60',
          profileName: profile,
          userId: userid
        },
        (err, result) => {
          if (err) {
            let message
            let statusCode = _.get(err, 'response.statusCode', false)
            let faultString = _.get(
              err,
              'root.Envelope.Body.Fault.faultstring',
              false
            )

            if (!statusCode) {
              message = `Could not connect - Please check the IP address and try again.`
            } else if (statusCode == '401') {
              message = `Unauthorized - Please check the AXL account information and try again.\n`
            } else if (faultString) {
              message = faultString
            } else {
              message = `An unknown error occurred - The remote system said: ${err.response.statusMessage}`
            }
            return reject(message)
          }
          resolve()
        }
      )
    })
  })
}
