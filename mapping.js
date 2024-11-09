const { exec } = require('child_process');
const os = require('os');

// Funktion zum Scannen des Netzwerks mit arp-scan
async function scanNetwork(networkInterface) {
    return new Promise((resolve, reject) => {
        exec(`sudo arp-scan -l -I ${networkInterface}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Fehler beim Ausführen von arp-scan: ${stderr}`);
                return;
            }
            const devices = [];
            const lines = stdout.split('\n');
            lines.forEach(line => {
                const parts = line.split('\t');
                if (parts.length >= 3) {
                    devices.push({ ip: parts[0], mac: parts[1], name: parts[2] });
                }
            });
            resolve(devices);
        });
    });
}

// Funktion zum Auslesen des Netzwerkinterfaces
function getNetworkInterface() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return name;
            }
        }
    }
    throw new Error('Kein geeignetes Netzwerkinterface gefunden');
}

// Hauptfunktion
async function main() {
    try {
        const networkInterface = getNetworkInterface();
        console.log(`Verwendetes Netzwerkinterface: ${networkInterface}`);

        const devices = await scanNetwork(networkInterface);
        console.log('Gefundene Geräte im Netzwerk:');
        devices.forEach(device => console.log(`IP: ${device.ip}, MAC: ${device.mac}, Name: ${device.name}`));
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Programm starten
main();