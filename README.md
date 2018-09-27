# homebridge-schellenberg
Homebridge Plugin to connect to the Schellenberg Smart Home system. This plugin is a work in progress, so I guarantee [absolutely nothing](https://g.redditmedia.com/FuqGGUPh2r8D5y9joV5UzJLme-Q5KVUq-SQYaJrVOvE.gif?fm=mp4&mp4-fragmented=false&s=438fcd921c022aae00a9814e6f436dac). 

At the moment only the shutters are supported, but I will be working on more of the devices when I have time and am able to buy the thermostat, the switch or the window handle.

## How to use
### 1. Extract certificate
The gateway can only be adressed via a TLS connection on which JSON messages are passed to each other. The Gateway-Server uses a self signed certificate. To communicate via the 
nodejs TLS socket we need the rootCA which signed the server certificate. The extractCert.java file can be used to extract the certificate from a Java SSLSocket. I am not shure if it is a good idea to upload the certificate to this git, so I won't. Also I am not shure if all of the root certificates are the same, since i only own one gateway to test with.
### 2. sessionID
The gateway normally uses a username and password to determine user rights. However this login data are used to create a session key which seems to be usable until the gateway is reset. The getSessionKey.java can be used to get one of the session keys. If you don't know how to compile the Java files, you are doomed (unless you are able to use DuckDuckGo or Google etc.). The session key will be used in the config later.
### 2. Config
The config.json file needs some work. The always needed keys are 'sessionID', 'host' and 'port'. Optionally you can use the 'rollingTimes' key to set custom up/down times to show the running status in the Home App and to be able to set the shutters to 50% (for example). The standard time used when no explicit time is stated is 30sec from 0% to 100%.
```json
{
	"bridge": {
		...
	},
	"platforms": [
		{
			"platform" : "SchellenbergPlatform",
			"sessionId" : "session key goes here",
			"host" : "ip goes here",
			"languageTranslationVersion" : 270,
			"compatibilityConfigurationVersion" : 340,
			"port" : 4300,
			"rollingTimes": [
				{
					"deviceID": 14071,
					"time": 19750
				},
				{
					"deviceID": 10153,
					"time": 15600
				},
				{
					"deviceID": 14050,
					"time": 19750
				},
				{
					"deviceID": 15162,
					"time": 29000
				}
			]
		}
	],
	"accessories": []
}
```
Example Config
