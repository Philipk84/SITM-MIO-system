package co.icesi.mio.bus;

import com.zeroc.Ice.Communicator;
import com.zeroc.Ice.ObjectPrx;
import com.zeroc.Ice.Util;
import mio.MioServicePrx;
import java.io.BufferedReader;
import java.io.FileReader;

public class BusSimulator {
    public static void main(String[] args) throws java.lang.Exception {
        try (Communicator communicator = Util.initialize(args)) {
            String proxyText = communicator.getProperties().getPropertyWithDefault(
                    "MioService.Proxy", "MioService:tcp -h 127.0.0.1 -p 10000");
            String csv = communicator.getProperties().getPropertyWithDefault("Bus.DatagramsCsv", "data/datagrams.csv");
            int delayMs = communicator.getProperties().getPropertyAsIntWithDefault("Bus.DelayMs", 1000);

            ObjectPrx base = communicator.stringToProxy(proxyText);
            MioServicePrx service = MioServicePrx.checkedCast(base);
            if (service == null) {
                throw new IllegalStateException("No se pudo conectar al MioService en: " + proxyText);
            }

            System.out.println("[BUS] Enviando datagramas desde: " + csv);
            try (BufferedReader reader = new BufferedReader(new FileReader(csv))) {
                String line;
                boolean first = true;
                while ((line = reader.readLine()) != null) {
                    if (first) { first = false; continue; }
                    if (line.trim().isEmpty()) continue;
                    service.receiveDatagram(line);
                    System.out.println("[BUS] Datagrama enviado: " + line);
                    Thread.sleep(delayMs);
                }
            }
            System.out.println("[BUS] Simulacion finalizada.");
        }
    }
}
