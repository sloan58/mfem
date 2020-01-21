require('dotenv').config()
const express = require('express')
const phoneServiceXml = require('./phoneServiceXml')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
const axl = require('./axl')
const duoApi = require('@duosecurity/duo_api')
const duoClient = new duoApi.Client(
  process.env.DUO_IKEY,
  process.env.DUO_SKEY,
  process.env.DUO_HOST
)

app.get('/', (req, res) => {
  res.set('Content-Type', 'text/xml')
  res.send(phoneServiceXml.loginMenu())
})

app.post('/login', (req, res) => {
  let { userid, pin } = req.body
  let { device } = req.query
  axl
    .authenticateUcm(userid, pin)
    .then(user => {
      duoClient.jsonApiCall(
        'POST',
        '/auth/v2/auth',
        {
          username: user.mailid,
          factor: 'push',
          device: 'auto',
          type: 'Multi-Factor Extension Mobility',
          display_username: 'Multi-Factor EM Service'
        },
        mfaResponse => {
          if (mfaResponse.stat !== 'OK') {
            console.log(`MFA Fail: ${res.message}`)
            return res.send('Auth Unsuccessful')
          }
          if (mfaResponse.response.result !== 'allow') {
            console.log(`MFA Fail: ${mfaResponse.response.result}`)
            return res.send('Auth Unsuccessful')
          }
          if (!Array.isArray(user.phoneProfiles.profileName)) {
            let emProfile = user.phoneProfiles.profileName['$value']
            axl
              .loginDevice(device, emProfile, userid)
              .then(response => {
                res.send('Login Successful')
                console.log(response)
              })
              .catch(err => {
                res.send(err)
                console.log(err)
              })
          }

          let emProfileList = user.phoneProfiles.profileName.map(
            profile => profile['$value']
          )

          res.set('Content-Type', 'text/xml')
          res.send(phoneServiceXml.emProfileMenu(emProfileList, userid, 'jwt'))
        }
      )
    })
    .catch(err => {
      res.send('Auth Unsuccessful')
      console.log(err)
    })
})

app.get('/em-select', (req, res) => {
  let { jwt, profile, userid, device } = req.query
  axl
    .loginDevice(device, profile, userid)
    .then(response => {
      res.send('Login Successful')
      console.log(response)
    })
    .catch(err => {
      res.send(err)
      console.log(err)
    })
})

app.listen(process.env.PORT, process.env.IP, () =>
  console.log(`mfem listening on http://${process.env.IP}:${process.env.PORT}`)
)
