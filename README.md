# Proyecto MIO - R4 y R7

## Patrón de diseño usado

Se usa el patrón Facade.

La clase `MioFacade` publica una única interfaz ICE llamada `MioService`. La web no conoce directamente a `GestorPosiciones`, `GestorRutas`, `MotorMetricas`, `RepositorioOperativo` ni `RepositorioHistorico`; solo consume la fachada.

Esto permite separar la interfaz web de la lógica del CCO y facilita desplegar cada elemento en dispositivos separados.

## Estructura

```text
mio-reformulado-r4-r7/
├── common/
│   └── src/main/slice/Mio.ice
├── cco-backend/
│   └── Backend Java ICE del CCO
├── bus-simulator/
│   └── Simulador Java del computador embebido del bus
├── web-node/
│   └── Web NodeJS + Google Maps + cliente ICE
├── data/
│   ├── datagrams.csv
│   └── stops.csv
├── cco.cfg
├── bus.cfg
└── gradlew / gradlew.bat
```

## Requisitos

- Se usa JDK 11.
- ZeroC Ice instalado.
- `slice2java --version` debe funcionar.
- `slice2js --version` debe funcionar.
- NodeJS instalado.
- API Key de Google Maps con Maps JavaScript API y Directions API habilitadas.

## Compilar Java

Desde la raíz:

```powershell
.\gradlew clean build
```
Desde `web-node`:

```powershell
cd web-node
npm install
npm run slice
```

## Ejecutar con java y node

### 1. Servidor CCO

En una terminal, desde la raíz:

```powershell
java -jar cco-backend\build\libs\cco-backend-1.0.0.jar --Ice.Config=cco.cfg
```

### 2. Plataforma web NodeJS

En otra terminal:

```powershell
cd web-node
$env:GOOGLE_MAPS_API_KEY="API_KEY_DE_GOOGLE_MAPS"
$env:ICE_PROXY="MioService:tcp -h 127.0.0.1 -p 10000"
$env:PORT="8080"
npm start
```

Abrir:

```text
http://localhost:8080
```

### 3. Simulador de bus

En otra terminal, desde la raíz:

```powershell
java -jar bus-simulator\build\libs\bus-simulator-1.0.0.jar --Ice.Config=bus.cfg
```

## Despliegue en dispositivos separados

### Servidor CCO

En `cco.cfg`:

```properties
CcoAdapter.Endpoints=tcp -h 0.0.0.0 -p 10000
Mio.StopsCsv=data/stops.csv
Mio.InitialDatagramsCsv=data/datagrams.csv
```

### Plataforma Web NodeJS

Variable de entorno:

```powershell
$env:ICE_PROXY="MioService:tcp -h IP_DEL_SERVIDOR_CCO -p 10000"
```

### Bus / Computadora embebida

En `bus.cfg`:

```properties
MioService.Proxy=MioService:tcp -h IP_DEL_SERVIDOR_CCO -p 10000
Bus.DatagramsCsv=data/datagrams.csv
Bus.DelayMs=1000
```

## R4 implementado

- El bus envía datagramas por ICE.
- El CCO recibe los datagramas.
- El CCO actualiza las posiciones operativas actuales.
- La web NodeJS consulta el CCO por ICE.
- El navegador recibe las posiciones por SSE.
- Google Maps muestra buses y paradas en Cali.
- Cada ruta se muestra con un color diferente.
- Cada ruta tiene una etiqueta visible con su nombre, por ejemplo: Ruta E21, Ruta T31 y Ruta P10.
- Las paradas usan el mismo color de su ruta.
- Los buses usan el mismo color de la ruta a la que pertenecen.
- Las rutas se dibujan con Google Directions para que sigan las calles, no líneas rectas entre paradas.
- Si Google Directions no responde, el sistema usa una polilínea local de respaldo.
- El endpoint `/api/routes/:routeId/trace` expone los datagramas históricos de una ruta para mejorar el trazado operativo.

## R7 implementado

- El CCO carga datos históricos desde `data/datagrams.csv`.
- El motor de métricas agrupa por ruta, bus y mes.
- Calcula distancia GPS con Haversine.
- Calcula velocidad promedio mensual por ruta.
- La web muestra la tabla de velocidades.

## Mejoras incluidas en esta versión

Esta versión agrega más datagramas de prueba para que el movimiento del bus sea más realista y no salte únicamente de parada en parada. También se agregaron más rutas de ejemplo en el archivo `data/stops.csv`:

```text
E21
T31
P10
```

La interfaz web carga todas las rutas disponibles desde las paradas, arma una leyenda de colores y dibuja las rutas usando `DirectionsService`.

## Formato de datagrama

```text
busId,routeId,lat,lng,timestamp
```

Ejemplo:

```text
B001,E21,3.374512,-76.533845,2025-01-10 08:00:00
```
