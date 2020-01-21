const builder = require('xmlbuilder')

module.exports.loginMenu = () => {
  const menu = {
    CiscoIPPhoneInput: {
      Title: {
        '#text': 'Multi-Factor Extension Mobility'
      },
      Prompt: {
        '#text': 'Enter Username and PIN'
      },
      URL: {
        '#text': `http://${process.env.IP}:${process.env.PORT}/login?device=#DEVICENAME#`,
        '@method': 'POST'
      },
      InputItem: [
        {
          DisplayName: {
            '#text': 'User Name'
          },
          QueryStringParam: {
            '#text': 'userid'
          },
          DefaultValue: {
            '#text': ''
          },
          InputFlags: {
            '#text': 'A'
          }
        },
        {
          DisplayName: {
            '#text': 'Pin'
          },
          QueryStringParam: {
            '#text': 'pin'
          },
          DefaultValue: {
            '#text': ''
          },
          InputFlags: {
            '#text': 'NP'
          }
        }
      ]
    }
  }
  return builder.create(menu).end({ pretty: true })
}

module.exports.emProfileMenu = (profiles, userid, jwt) => {
  let emOptions = profiles.map(profile => {
    return {
      Name: {
        '#text': profile
      },
      URL: {
        '#text': encodeURI(
          `http://${process.env.IP}:${process.env.PORT}/em-select?jwt=${jwt}&profile=${profile}&userid=${userid}&device=#DEVICENAME#`
        )
      }
    }
  })

  const menu = {
    CiscoIPPhoneMenu: {
      Title: {
        '#text': 'Select EM Profile'
      },
      Prompt: {
        '#text': 'Please select a profile'
      },
      MenuItem: emOptions
    }
  }
  return builder.create(menu).end({ pretty: true })
}
