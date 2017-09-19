var express = require('express')
var fs = require('fs')
var app = express()
var expression = /([0-9]{1,3}\.){3}.([0-9]{1,3})/;

var rdpTemplate = "screen mode id:i:2\nuse multimon:i:0\ndesktopwidth:i:800\ndesktopheight:i:600\nsession bpp:i:32\nwinposstr:s:0,3,0,0,800,600\ncompression:i:1\nkeyboardhook:i:2\naudiocapturemode:i:0\nvideoplaybackmode:i:1\nconnection type:i:7\nnetworkautodetect:i:1\nbandwidthautodetect:i:1\ndisplayconnectionbar:i:1\nusername:s:USERNAME\nenableworkspacereconnect:i:0\ndisable wallpaper:i:0\nallow font smoothing:i:0\nallow desktop composition:i:0\ndisable full window drag:i:1\ndisable menu anims:i:1\ndisable themes:i:0\ndisable cursor setting:i:0\nbitmapcachepersistenable:i:1\nfull address:s:IPADDRESS\naudiomode:i:0\nredirectprinters:i:1\nredirectcomports:i:0\nredirectsmartcards:i:1\nredirectclipboard:i:1\nredirectposdevices:i:0\nautoreconnection enabled:i:1\nauthentication level:i:2\nprompt for credentials:i:0\nnegotiate security layer:i:1\nremoteapplicationmode:i:0\nalternate shell:s:\nshell working directory:s:\ngatewayhostname:s:\ngatewayusagemethod:i:4\ngatewaycredentialssource:i:4\ngatewayprofileusagemethod:i:0\npromptcredentialonce:i:0\ngatewaybrokeringtype:i:0\nuse redirection server name:i:0\nrdgiskdcproxy:i:0\nkdcproxyname:s:\n";

app.get('/dl/:cname/:ip', function(req, res)
{
	res.setHeader('Content-disposition', 'attachment; filename=' + req.params.cname +'.rdp');
	res.setHeader('Content-type', 'text/plain');
	res.charset = 'UTF-8';
	res.write(rdpTemplate.replace(/IPADDRESS/g, req.params.ip).replace(/USERNAME/g, 'Baptiste'));
	res.end();
});

app.get('/', function (req, res) {
    fs.readFile('/etc/openvpn/openvpn-status.log', 'utf8', function (err,data) {
        if (err) {
            res.send(err);
        }

		var allLines = data.split('\n');
		var routingTable = [];
		var connectedClient = [];
		for (var i=0; i < allLines.length; i++)
		{
			if (expression.test(allLines[i]))
			{
				var split = allLines[i].split(',');
				
				if(split.length == 4) // Routing Table
				{
					routingTable.push({
						vAddress : split[0],
						cName : split[1],
						rAddress : split[2],
						lRef : split[3]
					});
				}
				else if (split.length == 5) //Client List
				{
					connectedClient.push({
						cName : split[0],
						rAddress : split[1],
						bReceived : split[2],
						bSent : split[3],
						connectedSince : split[4]
					});
				}
				else
				{
					console.log("Bad number of arguments. File is not OK\n, line : " + allLines[i]);
				}
			}
		}
		var ret = '<html><head><meta http-equiv="refresh" content="2"/></head><body>';
		ret += "<center><table border=1 style='width : 80%'><tr><th>Client Name</th><th>Real Address</th><th>Bytes Received</th><th>Bytes Sent</th><th>Connected Since</th></tr>"
		for (var i=0; i < connectedClient.length; i++)
		{
			ret += "<tr>";
			ret += "<td>" + connectedClient[i].cName + "</td>";
			ret += "<td>" + connectedClient[i].rAddress + "</td>";
			ret += "<td>" + connectedClient[i].bReceived + "</td>";
			ret += "<td>" + connectedClient[i].bSent + "</td>";
			ret += "<td>" + connectedClient[i].connectedSince + "</td>";
			ret += "</tr>";
		}
		ret += "</table>";
		ret += "<br>";
		ret += "<br>";
		ret += "<table border=1 style='width : 80%'><tr><th>Virtual Address</th><th>Common Name</th><th>Real Address</th><th>Last reference</th><th>Connect via RDP</th></tr>"
		for (var i=0; i < routingTable.length; i++)
		{
			ret += "<tr>";
			ret += "<td>" + routingTable[i].vAddress + "</td>";
			ret += "<td>" + routingTable[i].cName + "</td>";
			ret += "<td>" + routingTable[i].rAddress + "</td>";
			ret += "<td>" + routingTable[i].lRef + "</td>";
			ret += "<td><a href='/dl/" + routingTable[i].cName +"/" + routingTable[i].vAddress + "'><button>RDP</button></a></td>";
			ret += "</tr>";
		}
		ret += "</table></center></body></html>";
        res.send(ret);
    });
})

app.listen(4242)



