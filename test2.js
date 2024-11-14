const { exec } = require('child_process');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

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
                        devices.push({ id: ip, label: hostname || ip });
                    });
                }
            });
            Promise.all(promises).then(() => {
                // Beispielhafte Verbindungen zwischen den Geräten hinzufügen
                const edges = [
                    { from: '192.168.178.1', to: '192.168.178.23' },
                    { from: '192.168.178.1', to: '192.168.178.64' },
                    { from: '192.168.178.1', to: '192.168.178.25' },
                    { from: '192.168.178.1', to: '192.168.178.102' },
                    { from: '192.168.178.1', to: '192.168.178.21' },
                    { from: '192.168.178.1', to: '192.168.178.27' },
                    { from: '192.168.178.1', to: '192.168.178.66' },
                    { from: '192.168.178.1', to: '192.168.178.54' },
                    { from: '192.168.178.1', to: '192.168.178.201' },
                    // Weitere Verbindungen hier hinzufügen
                ];
                const networkData = { nodes: devices, edges: edges };
                fs.writeFileSync('network_topology.json', JSON.stringify(networkData, null, 2));
                resolve(networkData);
            });
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

app.get('/network', (req, res) => {
    fs.readFile('network_topology.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Fehler beim Lesen der JSON-Datei');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);

    const networkInterface = 'en0'; // Beispiel für ein typisches Netzwerkinterface auf einem Mac
    findDevices(networkInterface).then(networkData => {
        console.log('Gefundene Geräte im Netzwerk:');
        networkData.nodes.forEach(device => console.log(`IP: ${device.id}, Host: ${device.label}`));
        console.log('Ergebnisse wurden in network_topology.json gespeichert.');
    }).catch(error => {
        console.error('Fehler beim Scannen des Netzwerks:', error);
    });
});