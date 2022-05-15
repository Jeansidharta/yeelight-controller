import net from "net";

const LAMP_ID_JEAN = { id: 361773898, ip: '' };
const LAMP_ID_TV = { id: 392094406, ip: '192.168.0.243' };
const LAMP_ID_MIDDLE = { id: 392100665, ip: '' };
const LAMP_ID_WINDOW = { id: 360880487, ip: '' };
const LAMP_ID_RAFA = { id: 392100092, ip: '' };
const LAMP_ID_STRIP_JEAN = { id: 433772850, ip: '192.168.0.193' };

async function testLamp(lamp: typeof LAMP_ID_JEAN) {
  const connection = net.connect({ port: 55443, host: lamp.ip });

  connection.on("connect", () => {
    console.log("Connected");
    connection.write(
      JSON.stringify({
        id: lamp.id,
        method: "set_bright",
        params: [70, "sudden", 100],
      }) + '\r\n'
    );
  });

  connection.on("data", (chunk) => {
    console.log("Received data:", chunk.toString('utf8'));
  });
}

function main () {
	testLamp(LAMP_ID_TV);
}

main();
