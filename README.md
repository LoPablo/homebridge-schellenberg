# homebridge-schellenberg
My parents had the idea to replace our manual rolling shutters with automatic ones while working on our second living room.
While we already had a Philips Hue system which was perfectly compatible with Apple HomeKit, I tired to convince my dad to buy
either KNX or Z-Wave enabled rolling shutters, so it would be relatively easy to integrate them with HomeKit and, what was important to
my parents, be able to control the Shutters with Siri.

While my time was consumed by trying to get my Bachelors Degree in the regular time, my dad decided to by a rolling Shutters 
from a German company named 'Schellenberg' without asking me.

After the first motors were installed my dad asked me weather it would be easy to integrate the System with Siri and like this my journey and this project began.

The choice between the different tools to make a device/system HomeKit enabled fell on Homebridge, because it seemed quite easy to write a plugin in JavaScript and my parents already
had an instance running on a pi, because Philips decided to only expose original Hue lights to HomeKit and well the Ikea Tradfri bulbs are way cheaper than the ones from Philips.

## Speaking to the devices
Schellenberg Shutters can be used as a standalone solution. You can either only bye the motors and a remote control to control the individual motors or additionally bye the 'SmartHome Gateway'.

### Direct commuication
So in a Thread which i am no longer able to find (it was about the Schellenberg Window Handle) someone found out that Schellenberg's system was using a
rolling code or similar while communicating between the devices. So speaking to a device directly seamed to be no option. 

### Wiring a remote
Second thought was to disassemble the remotes and just wire the buttons to the gpio of the pi. Well yeah that would be a really janky solution, so I only
kept this idea as a last resort.

### Using the Gateway and it's protocol
Because the other ideas were either too janky or there was no way I would be able to find out a way to speak to one of the
devices in a reasonable time period, I convinced my dad to buy the gateway and tried to reverse engineer the API / it's protocol.

## Reverse engineering the protocol
### First attempts
I already tried to figure out the apis of some apps, for example of one of the apps for the company I work for just for the lulz. So I tried what I did with the apps before.
Installed the Schellenberg Smart Home App on an Android device and captured what the app (as a client) sent to the server (in this case the gateway). Turns out it uses a ssl/tls
connection which was not being captured by the app i used to capture the traffic. Tried to find some other ways to sniff the connection, like ARP-Spoofing etc. but all of them didn't work either (unfortunately the android device was
the on of my brother so I wasn't able to root it or something similar).

### Decompiling the first
The next thing I tried was to get the App to tell me it's secret by decompiling it. Turns out it was a Cordava App, so it consists mostly of JavaScript Code. And well way too much of that.
 
![Too many code lines to look at](https://i.imgur.com/QlrBL2m.png)

The Code also mostly consists of variables and functions only named 'a' or 'zu','p', 'tz' etc. and there was no way i was able to look at all of that and find the right lines. Well at least I found an easter egg
which helped me out later.

### Recompiling
Next step was changing the Manifest of the app to allow remote debugging it with Chrome which is possible because the Cordava App is literally a HTML page shown in a Chrome window with JavaScript able to use Android/iOS/WindowsPhone system functions.

This wasn't successfully either because it only led me to more JavaScript with Angular which wasn't helpful at all. So last way out: Google.

### Let's search 
more to come



