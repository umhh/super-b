// Error handler (must be first)
window.onerror = function(msg, src, line, col, err) {
  var detail = (err && err.message) ? err.message : msg;
  var el = document.getElementById('status-text');
  if (el) el.textContent = 'Err: ' + detail + ' Z.' + line;
  return true;
};

// UUIDs
var UUID = {
  v1: {
    service: '74b9c2d1-dc6d-42cf-a2e9-7398b8fc2e70',
    notify:  '6edadbe4-4f53-4a5a-96ed-02f93db93790'
  },
  v2: {
    service:  'cf9ccdf7-eee9-43ce-87a5-82b54af5324e',
    txrx:     'cf9ccdfa-eee9-43ce-87a5-82b54af5324e',
    notify2:  'e0fef452-9d2b-4005-a1e3-69fe1102b436'
  }
};

var CMD_V2_QUERY = new Uint8Array([0x21, 0x54, 0x00]);
var POLL_INTERVAL_MS = 30000;

// State
var bleDevice    = null;
var gattServer   = null;
var bmsVersion   = null;
var pollTimer    = null;
var v2Frame0     = null;
var v2Frame2     = null;
var isConnecting = false;

// BLE
function toggleConnect() {
  if (bleDevice && bleDevice.gatt.connected) {
    disconnect();
  } else {
    connect();
  }
}

function connect() {
  if (!navigator.bluetooth) {
    document.getElementById('banner').classList.remove('hidden');
    setStatus('Web Bluetooth nicht unterstuetzt');
    return;
  }
  if (isConnecting) return;
  isConnecting = true;
  setButtonState('connecting');
  setStatus('Suche Geraet...');

  navigator.bluetooth.requestDevice({
    filters: [
      { services: [UUID.v1.service] },
      { services: [UUID.v2.service] },
      { namePrefix: 'Epsilon' }
    ],
    optionalServices: [UUID.v1.service, UUID.v2.service]
  }).then(function(device) {
    bleDevice = device;
    bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
    setStatus('Verbinde...');
    return bleDevice.gatt.connect();
  }).then(function(server) {
    gattServer = server;
    return detectVersion(gattServer);
  }).then(function(version) {
    bmsVersion = version;
    if (!bmsVersion) { throw new Error('BMS-Service nicht gefunden.'); }
    setStatus('Verbunden - ' + bmsVersion.toUpperCase());
    setButtonState('connected');
    document.getElementById('version-val').textContent = bmsVersion.toUpperCase();
    document.getElementById('device-name').textContent = bleDevice.name || 'Epsilon';
    if (bmsVersion === 'v1') {
      return setupV1(gattServer);
    } else {
      return setupV2(gattServer);
    }
  })['catch'](function(err) {
    setStatus('Fehler: ' + err.name + ' - ' + err.message);
    setButtonState('disconnected');
    bleDevice = null;
    isConnecting = false;
  }).then(function() {
    isConnecting = false;
  });
}

function detectVersion(server) {
  return server.getPrimaryService(UUID.v2.service)
    .then(function() { return 'v2'; })
    ['catch'](function() {
      return server.getPrimaryService(UUID.v1.service)
        .then(function() { return 'v1'; })
        ['catch'](function() { return null; });
    });
}

function disconnect() {
  clearInterval(pollTimer);
  pollTimer = null;
  if (bleDevice && bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
  }
}

function onDisconnected() {
  clearInterval(pollTimer);
  pollTimer = null;
  gattServer = null;
  setButtonState('disconnected');
  setStatus('Verbindung getrennt');
}

// V1
function setupV1(server) {
  var svcRef;
  return server.getPrimaryService(UUID.v1.service)
    .then(function(svc) {
      svcRef = svc;
      return svcRef.getCharacteristic(UUID.v1.notify);
    })
    .then(function(chr) {
      chr.addEventListener('characteristicvaluechanged', function(e) {
        handleV1Frame(e.target.value);
      });
      return chr.startNotifications();
    })
    .then(function() {
      setStatus('Verbunden - V1 - Warte auf Daten...');
    });
}

function handleV1Frame(view) {
  if (view.byteLength !== 20) { return; }
  var status  = view.getUint8(1);
  var soc     = view.getUint8(2);
  var soh     = view.getUint8(3);
  var runtime = view.getUint32(4, false);
  var current = view.getFloat32(8, false);
  var voltage = view.getFloat32(12, false);
  updateUI({
    soc:      soc,
    soh:      soh,
    voltage:  voltage,
    current:  current,
    power:    voltage * current,
    runtime:  current >= 0 ? 0xFFFFFFFF : runtime,
    charging: current >= 0,
    problem:  !(status & 0x01),
    balancer: !!(status & 0x80),
    cycles:   null
  });
}

// V2
function setupV2(server) {
  var svcRef, chrTxRxRef;
  return server.getPrimaryService(UUID.v2.service)
    .then(function(svc) {
      svcRef = svc;
      return svcRef.getCharacteristic(UUID.v2.txrx);
    })
    .then(function(chr) {
      chrTxRxRef = chr;
      return svcRef.getCharacteristic(UUID.v2.notify2);
    })
    .then(function(chrN2) {
      chrTxRxRef.addEventListener('characteristicvaluechanged', handleV2Frame);
      chrN2.addEventListener('characteristicvaluechanged', handleV2Frame);
      return chrTxRxRef.startNotifications();
    })
    .then(function() {
      return svcRef.getCharacteristic(UUID.v2.notify2);
    })
    .then(function(chrN2) {
      return chrN2.startNotifications();
    })
    .then(function() {
      return sendV2Query(chrTxRxRef);
    })
    .then(function() {
      pollTimer = setInterval(function() {
        if (!bleDevice || !bleDevice.gatt.connected) { return; }
        gattServer.getPrimaryService(UUID.v2.service)
          .then(function(s) {
            return s.getCharacteristic(UUID.v2.txrx);
          })
          .then(function(chr) {
            return sendV2Query(chr);
          })
          ['catch'](function(err) {
            console.warn('[V2] Poll:', err);
          });
      }, POLL_INTERVAL_MS);
    });
}

function sendV2Query(chr) {
  return chr.writeValueWithResponse(CMD_V2_QUERY)
    ['catch'](function() {
      return chr.writeValueWithoutResponse(CMD_V2_QUERY)
        ['catch'](function(err) {
          console.warn('[V2] Write:', err);
        });
    });
}

function handleV2Frame(event) {
  var view = event.target.value;
  if (view.byteLength !== 24) { return; }
  var frameIdx = view.getUint8(0);
  if (frameIdx === 0x00) {
    v2Frame0 = view;
  } else if (frameIdx === 0x02) {
    v2Frame2 = view;
  } else {
    return;
  }
  if (v2Frame0 && v2Frame2) { parseV2Frames(); }
}

function parseV2Frames() {
  var soc       = v2Frame0.getUint8(1);
  var cycles    = v2Frame0.getUint8(18);
  var soh       = v2Frame0.getUint8(19);
  var runtime   = v2Frame0.getUint32(20, false);
  var currentMA = v2Frame2.getInt32(6, false);
  var voltageMV = v2Frame2.getUint16(10, false);
  var current   = currentMA / 1000.0;
  var voltage   = voltageMV / 1000.0;
  v2Frame0 = null;
  v2Frame2 = null;
  updateUI({
    soc:      soc,
    soh:      soh,
    voltage:  voltage,
    current:  current,
    power:    voltage * current,
    runtime:  runtime,
    charging: current >= 0,
    problem:  false,
    balancer: false,
    cycles:   cycles
  });
}

// UI
var SOC_CIRCUMFERENCE = 2 * Math.PI * 66;

function updateUI(d) {
  document.getElementById('placeholder').style.display  = 'none';
  document.getElementById('data-section').style.display = '';

  var soc    = Math.max(0, Math.min(100, d.soc));
  var offset = SOC_CIRCUMFERENCE * (1 - soc / 100);
  var arc    = document.getElementById('soc-arc');
  arc.style.strokeDashoffset = offset;
  arc.style.stroke = socColor(soc);
  document.getElementById('soc-val').textContent = soc + '%';
  document.getElementById('soc-val').style.color = socColor(soc);

  document.getElementById('voltage-summary').textContent = fmt(d.voltage, 2);
  document.getElementById('current-summary').textContent = fmt(Math.abs(d.current), 1);
  document.getElementById('power-summary').textContent   = fmt(Math.abs(d.power), 0);

  var sohEl = document.getElementById('soh-val');
  sohEl.innerHTML = d.soh + '<span class="card-unit">%</span>';
  sohEl.className = 'card-value ' + (d.soh >= 80 ? 'val-green' : d.soh >= 60 ? 'val-yellow' : 'val-red');

  var rtEl  = document.getElementById('runtime-val');
  var rtSub = document.getElementById('runtime-sub');
  if (d.runtime === 0xFFFFFFFF || d.runtime === 4294967295 || d.charging) {
    rtEl.textContent  = '\u2014';
    rtSub.textContent = 'beim Laden';
  } else {
    rtEl.textContent  = formatRuntime(d.runtime);
    rtSub.textContent = 'Restlaufzeit';
  }

  var cyclesCard = document.getElementById('cycles-card');
  if (d.cycles !== null) {
    document.getElementById('cycles-val').textContent = d.cycles;
    cyclesCard.style.display = '';
  } else {
    cyclesCard.style.display = 'none';
  }

  setBadge('badge-charging',
    d.charging ? 'Laedt' : 'Entlaedt',
    d.charging ? 'badge-green' : 'badge-blue');

  setBadge('badge-problem',
    d.problem ? 'Problem!' : 'Kein Fehler',
    d.problem ? 'badge-red' : 'badge-green');

  setBadge('badge-balancer',
    d.balancer ? 'Balancer aktiv' : 'Balancer inaktiv',
    d.balancer ? 'badge-yellow' : 'badge-muted');

  var now = new Date();
  document.getElementById('last-update').textContent =
    'Zuletzt: ' + now.toLocaleTimeString('de-DE');
}

function setBadge(id, text, cls) {
  var el = document.getElementById(id);
  el.className = 'badge ' + cls;
  el.innerHTML = '<div class="badge-dot"></div> ' + text;
}

function socColor(soc) {
  if (soc >= 60) { return 'var(--green)'; }
  if (soc >= 25) { return 'var(--yellow)'; }
  return 'var(--red)';
}

function fmt(val, decimals) {
  return isNaN(val) ? '\u2014' : val.toFixed(decimals);
}

function formatRuntime(seconds) {
  if (!seconds || seconds <= 0) { return '\u2014'; }
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  if (h > 0) { return h + 'h ' + m + 'm'; }
  return m + 'm';
}

function setButtonState(state) {
  var btn = document.getElementById('btn-connect');
  btn.classList.remove('connected', 'connecting');
  btn.disabled = false;
  if (state === 'connected') {
    btn.classList.add('connected');
    btn.textContent = 'Trennen';
  } else if (state === 'connecting') {
    btn.classList.add('connecting');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
  } else {
    btn.textContent = 'Verbinden';
  }
}

function setStatus(text) {
  document.getElementById('status-text').textContent = text;
}

// Init
document.getElementById('btn-connect').addEventListener('click', toggleConnect);
setStatus('Bereit \u00b7 BLE: ' + (navigator.bluetooth ? 'ja' : 'nein'));