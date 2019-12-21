# homebridge-schellenberg
Homebridge Plugin to connect to the Schellenberg Smart Home system. This plugin is a work in progress, so I guarantee [absolutely nothing](https://g.redditmedia.com/FuqGGUPh2r8D5y9joV5UzJLme-Q5KVUq-SQYaJrVOvE.gif?fm=mp4&mp4-fragmented=false&s=438fcd921c022aae00a9814e6f436dac). 

At the moment only the shutters are supported, but I will be working on more of the devices when I have time and am able to buy the thermostat, the switch or the window handle.

## Config example
Inside of the sessionConfig you need to specify the username, password, the cSymbol which specifies the Device-Type of the Gateway and the Api Version you request. These settings have to fit the gateway because it won't answer to messages otherwise.

Inside of the smartSocketConfig you need to specifiy the ip, port (which should be 4300) and the certificate used for ssl (which in the example below is the one extracted from the schellenberg iOS App). Keep in mind, that the beginning and the end of the certificate have to be in seperate lines from the cert itslef, so seperate them with a \n.

```
{
            "platform": "SchellenbergPlatform",
            "sessionConfig":
            {
                "username": username",
                "password": "password",
                "cSymbol": "D19015",
                "cSymbolAddon": "i",
                "shcVersion": "2.14.5",
                "shApiVersion": "2.13"
            },
            "smartSocketConfig":
            {
                "host": "ip of the gateway",
                "port": "4300",
                "certificate": "-----BEGIN CERTIFICATE-----\nMIIDpTCCAo2gAwIBAgIICt0RIQj4rs4wDQYJKoZIhvcNAQENBQAwYDEWMBQGA1UE\nAwwNZW5leG9tYS1yb290MjETMBEGA1UECgwKZW5leG9tYSBBRzEWMBQGA1UEBwwN\nT2VybGluZ2hhdXNlbjEMMAoGA1UECAwDTlJXMQswCQYDVQQGEwJERTAeFw0xNjEw\nMjcwNzU4MjZaFw0zNjEwMjcwNzU4MjZaMGAxFjAUBgNVBAMMDWVuZXhvbWEtcm9v\ndDIxEzARBgNVBAoMCmVuZXhvbWEgQUcxFjAUBgNVBAcMDU9lcmxpbmdoYXVzZW4x\nDDAKBgNVBAgMA05SVzELMAkGA1UEBhMCREUwggEiMA0GCSqGSIb3DQEBAQUAA4IB\nDwAwggEKAoIBAQC2vOt1yNINfhjmbNvRgi3jqTOYvlpyN0Av1GTKpSPNOOPgAGk+\neHSmp0hYTv3nBlRVii9Nk01JGPqJ9lwChzqWiTsd4P16RIzd+zD844ali36ErgJF\ncexPWsQr0S3pCj9f42DGXaKj6oyh5E4DRkCBQVSpMq1N6+PvaE3OFQ22feFdogoK\nQ5UAyTFUbiUSegkYYA0BmFT/s8EuCR/brkzsnuGZayEuOzsr43mnM4K+vhoYcfQJ\nure+bxmX6IdCk9hmPWuTWiia0FU9D8ji76FYHvqcCbcmuF5OMPKZMfvI/ZUUpAdk\ndaE0EF/c98cmlUH7ENSgrCTm87r4OqfAc3nHAgMBAAGjYzBhMA8GA1UdEwEB/wQF\nMAMBAf8wHwYDVR0jBBgwFoAUtfMSXYZtNoCKmyteKTbltqhiYn8wHQYDVR0OBBYE\nFLXzEl2GbTaAipsrXik25baoYmJ/MA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0B\nAQ0FAAOCAQEAWulfbz+++2h5UenfIkEvY8p5Ye1Nsk7rkNUAROCrsleeoJgGDF/i\nmJSZ2yIhIpZISesW0T96pqzHJYzKucO4lct+K2nPrxXdF7vK9U61fp5tdCQqRwop\nevPKYAfdhyLERPV01xaFwPzO2xnXBcZHk25L7Yrhuwd2rjRPJ9ObVlfgBqQGvJie\nIyZ6XzsoAOHbEXdeodRg8LJSU5cWKgSqJ2PjVc+sVsixao0keNcKX0nwKRSRUvCd\naEnBwKdjQdoUYqfnfCKrMwZRHn/ILuZ1qMWrsVPUlfwDGJf7GybvqVxIJjrDjF7+\nSwrYYoRq7ApJQPkqU0Gt8UIGW7Hluh8QzQ==\n-----END CERTIFICATE-----"
            },
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
                },
                {
                    "deviceID": 17020,
                    "time": 19750
                },
                {
                    "deviceID": 8791,
                    "time": 19750
                }
            ]
```
