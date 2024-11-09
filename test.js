const { exec } = require('child_process');
const fs = require('fs');

const findDevices = (networkInterface) => {
    return new Promise((resolve, reject) => {
        exec(`sudo arp-scan -l -I ${networkInterface}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Fehler beim Ausführen von arp-scan: ${stderr}`);
                return;
            }
            const devices = [];
            const lines = stdout.split('\n');
            const promises = lines.map(line => {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const ip = parts[0];
                    return resolveHostname(ip).then(hostname => {
                        devices.push({ ip, host: hostname });
                    });
                }
            });
            Promise.all(promises).then(() => resolve(devices));
        });
    });
};

const resolveHostname = (ip) => {
    return new Promise((resolve, reject) => {
        exec(`nslookup ${ip}`, (error, stdout, stderr) => {
            if (error) {
                resolve(ip); // Falls kein Hostname gefunden wird, die IP zurückgeben
                return;
            }
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('name =')) {
                    const parts = line.split('name =');
                    if (parts.length > 1) {
                        resolve(parts[1].trim());
                        return;
                    }
                }
            }
            resolve(ip); // Falls kein Hostname gefunden wird, die IP zurückgeben
        });
    });
};

const networkInterface = 'en0'; // Beispiel für ein typisches Netzwerkinterface auf einem Mac
findDevices(networkInterface).then(devices => {
    console.log('Gefundene Geräte im Netzwerk:');
    devices.forEach(device => console.log(`IP: ${device.ip}, Host: ${device.host}`));

    // Ergebnisse in einer JSON-Datei speichern
    fs.writeFileSync('network_devices_found.json', JSON.stringify(devices, null, 2));
    console.log('Ergebnisse wurden in network_devices_found.json gespeichert.');
}).catch(error => {
    console.error(error);
});