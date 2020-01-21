require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const axl = require('./axl')
const phoneServiceXml = require('./phoneServiceXml')
const jwt = require('jsonwebtoken')
const duoApi = require('@duosecurity/duo_api')
const duoClient = new duoApi.Client(
  process.env.DUO_IKEY,
  process.env.DUO_SKEY,
  process.env.DUO_HOST
)

app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))

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
            return res.send('Auth Not Approved')
          }

          if (!Array.isArray(user.phoneProfiles.profileName)) {
            let profile = user.phoneProfiles.profileName['$value']
            return loginEmProfile(res, device, profile, userid)
          }

          let emProfileList = user.phoneProfiles.profileName.map(
            profile => profile['$value']
          )

          const payload = { user: user.mailid }
          const options = { expiresIn: '5m' }
          const secret = process.env.JWT_SECRET
          const token = jwt.sign(payload, secret, options)

          res.cookie('token', token)
          res.set('Content-Type', 'text/xml')
          res.send(phoneServiceXml.emProfileMenu(emProfileList, userid))
        }
      )
    })
    .catch(err => {
      res.send('Auth Unsuccessful')
      console.log(err)
    })
})

app.get('/em-select', (req, res) => {
  let { profile, userid, device } = req.query

  try {
    const options = { expiresIn: '5m' }

    result = jwt.verify(req.cookies.token, process.env.JWT_SECRET, options)

    return loginEmProfile(res, device, profile, userid)
  } catch (err) {
    console.log(err)
    res.set('Content-Type', 'text/xml')
    return res.send(
      phoneServiceXml.statusPage('Invalid token', 'Please try again')
    )
  }
})

app.listen(process.env.PORT, process.env.IP, () =>
  console.log(`mfem listening on http://${process.env.IP}:${process.env.PORT}`)
)

let loginEmProfile = async (res, device, profile, userid) => {
  await axl
    .loginDevice(device, profile, userid)
    .then(response => {
      res.set('Content-Type', 'text/xml')
      return res.send(
        phoneServiceXml.statusPage(
          'Login Successful!',
          'Applying your EM Profile Now'
        )
      )
    })
    .catch(err => {
      console.log(err)
      res.set('Content-Type', 'text/xml')
      return res.send(
        phoneServiceXml.statusPage('Login Error', 'Please try again')
      )
    })
}
