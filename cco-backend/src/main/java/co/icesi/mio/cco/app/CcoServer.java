package co.icesi.mio.cco.app;

import co.icesi.mio.cco.domain.Datagram;
import co.icesi.mio.cco.repository.CsvStopRepository;
import co.icesi.mio.cco.repository.InMemoryHistoricalRepository;
import co.icesi.mio.cco.repository.InMemoryOperationalRepository;
import co.icesi.mio.cco.service.MetricsEngine;
import co.icesi.mio.cco.service.MioFacade;
import com.zeroc.Ice.Communicator;
import com.zeroc.Ice.ObjectAdapter;
import com.zeroc.Ice.Util;
import java.io.BufferedReader;
import java.io.FileReader;

public class CcoServer {
    public static void main(String[] args) {
        int status = 0;
        try (Communicator communicator = Util.initialize(args)) {
            String stopsCsv = communicator.getProperties().getPropertyWithDefault("Mio.StopsCsv", "data/stops.csv");
            String initialDatagramsCsv = communicator.getProperties().getPropertyWithDefault("Mio.InitialDatagramsCsv", "data/datagrams.csv");

            InMemoryOperationalRepository operationalRepository = new InMemoryOperationalRepository();
            InMemoryHistoricalRepository historicalRepository = new InMemoryHistoricalRepository();
            CsvStopRepository stopRepository = new CsvStopRepository(stopsCsv);
            MetricsEngine metricsEngine = new MetricsEngine();

            loadInitialDatagrams(initialDatagramsCsv, operationalRepository, historicalRepository);

            MioFacade facade = new MioFacade(operationalRepository, historicalRepository, stopRepository, metricsEngine);
            ObjectAdapter adapter = communicator.createObjectAdapter("CcoAdapter");
            adapter.add(facade, Util.stringToIdentity("MioService"));
            adapter.activate();

            System.out.println("[CCO] Servidor CCO iniciado por ICE en CcoAdapter.");
            System.out.println("[CCO] Paradas cargadas desde: " + stopsCsv);
            System.out.println("[CCO] Historico inicial cargado desde: " + initialDatagramsCsv);
            System.out.println("[CCO] Esperando datagramas de buses...");
            communicator.waitForShutdown();
        } catch (java.lang.Exception e) {
            status = 1;
            e.printStackTrace();
        }
        System.exit(status);
    }

    private static void loadInitialDatagrams(String csvPath,
                                             InMemoryOperationalRepository operationalRepository,
                                             InMemoryHistoricalRepository historicalRepository) throws java.lang.Exception {
        try (BufferedReader reader = new BufferedReader(new FileReader(csvPath))) {
            String line;
            boolean first = true;
            int count = 0;
            while ((line = reader.readLine()) != null) {
                if (first) { first = false; continue; }
                if (line.trim().isEmpty()) continue;
                Datagram datagram = Datagram.parse(line);
                operationalRepository.saveCurrent(datagram);
                historicalRepository.save(datagram);
                count++;
            }
            System.out.println("[CCO] Datagramas iniciales cargados: " + count);
        }
    }
}
