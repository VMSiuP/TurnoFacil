'use strict';

// ===== Storage =====
let casos = JSON.parse(localStorage.getItem('tf_casos') || '[]');

function save() {
  localStorage.setItem('tf_casos', JSON.stringify(casos));
}

// ===== Tabs =====
function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  if (id === 'alertas') renderAlertas();
  if (id === 'historial') {
    cerrarDetalle();
    renderHistorial();
  }
}

// ===== Toast =====
let toastTimer;
function toast(msg, dur = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.display = 'none', dur);
}

// ===== Helpers =====
function get(id) { return document.getElementById(id).value.trim(); }
function set(id, val) { document.getElementById(id).value = val; }

function formatFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function horasRestantes(fechaDet, horaDet) {
  if (!fechaDet || !horaDet) return null;
  const det = new Date(fechaDet + 'T' + horaDet + ':00');
  const limite = new Date(det.getTime() + 48 * 3600 * 1000);
  return (limite - Date.now()) / 3600000;
}

function badgeStatus(h, esSinDet) {
  if (esSinDet) return { cls: 'badge-gray', txt: 'Sin detenido' };
  if (h === null) return { cls: 'badge-gray', txt: 'Sin detención' };
  if (h < 0)  return { cls: 'badge-red',   txt: 'Vencido' };
  if (h < 6)  return { cls: 'badge-red',   txt: '< 6h' };
  if (h < 12) return { cls: 'badge-amber', txt: '< 12h' };
  return { cls: 'badge-green', txt: 'En plazo' };
}

function estadoTexto(h) {
  if (h === null) return 'Sin detención registrada';
  if (h < 0) return 'VENCIDO';
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return `${hh}h ${mm}m restantes`;
}

// ===== Formulario =====
// ===== Sin detenido =====
let sinDetenido = false;

function toggleSinDetenido() {
  sinDetenido = !sinDetenido;
  const row = document.getElementById('toggle-sin-det');
  const fields = document.getElementById('det-fields');
  const aviso = document.getElementById('sin-det-aviso');
  const fd = document.getElementById('f-fecha-det');
  const hd = document.getElementById('f-hora-det');

  if (sinDetenido) {
    row.classList.add('checked');
    fields.classList.add('oculto');
    aviso.style.display = 'flex';
    fd.value = ''; hd.value = '';
    fd.disabled = true; hd.disabled = true;
  } else {
    row.classList.remove('checked');
    fields.classList.remove('oculto');
    aviso.style.display = 'none';
    fd.disabled = false; hd.disabled = false;
  }
}

document.getElementById('f-delito').addEventListener('change', function () {
  document.getElementById('f-delito-otro-wrap').style.display =
    this.value === 'Otro' ? 'block' : 'none';
});

document.getElementById('f-obs').addEventListener('input', function () {
  if (this.value.length > 400) this.value = this.value.slice(0, 400);
  document.getElementById('obs-counter').textContent = this.value.length + ' / 400';
});

function preFill() {
  const now = new Date();
  set('f-fecha-aviso', now.toISOString().slice(0, 10));
  set('f-hora-aviso', now.toTimeString().slice(0, 5));
}

function limpiarFormulario() {
  ['f-pol-nombre','f-pol-dni','f-pol-cel',
   'f-fecha-hecho','f-hora-hecho','f-fecha-det','f-hora-det','f-obs'].forEach(id => set(id, ''));
  set('f-comisaria', '');
  set('f-delito', '');
  document.getElementById('f-delito-otro-wrap').style.display = 'none';
  document.getElementById('obs-counter').textContent = '0 / 400';
  // Reset sin detenido
  if (sinDetenido) toggleSinDetenido();
  preFill();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function guardarCaso() {
  const fechaAviso  = get('f-fecha-aviso');
  const horaAviso   = get('f-hora-aviso');
  const polNombre   = get('f-pol-nombre');
  const polDni      = get('f-pol-dni');
  const polCelular  = get('f-pol-cel');
  const comisaria   = get('f-comisaria');
  const delSel      = get('f-delito');
  const delOtro     = get('f-delito-otro');
  const delito      = delSel === 'Otro' ? delOtro : delSel;
  const fechaHecho  = get('f-fecha-hecho');
  const horaHecho   = get('f-hora-hecho');
  const fechaDet    = get('f-fecha-det');
  const horaDet     = get('f-hora-det');
  const obs         = get('f-obs');

  if (!fechaAviso || !horaAviso) { toast('⚠ Ingresa fecha y hora del aviso'); return; }
  if (!polNombre)  { toast('⚠ Ingresa el nombre del efectivo policial'); return; }
  if (!comisaria)  { toast('⚠ Selecciona la comisaría'); return; }
  if (!delito)     { toast('⚠ Selecciona o especifica el delito'); return; }
  if (!sinDetenido && (!fechaDet || !horaDet)) { toast('⚠ Ingresa fecha y hora de la detención'); return; }

  const caso = {
    id: Date.now(),
    fechaAviso, horaAviso,
    polNombre, polDni, polCelular,
    comisaria, delito,
    fechaHecho, horaHecho,
    fechaDet: sinDetenido ? '' : fechaDet,
    horaDet:  sinDetenido ? '' : horaDet,
    sinDetenido,
    obs,
    creadoEn: new Date().toISOString()
  };

  casos.unshift(caso);
  save();
  updateBadge();
  limpiarFormulario();
  toast('✓ Caso guardado correctamente');
}

// ===== Badge de alertas =====
function updateBadge() {
  const urgentes = casos.filter(x => {
    if (x.sinDetenido) return false;
    const h = horasRestantes(x.fechaDet, x.horaDet);
    return h !== null && h >= 0 && h < 12;
  }).length;
  const b = document.getElementById('badge-alertas');
  if (urgentes > 0) {
    b.textContent = urgentes;
    b.classList.add('visible');
  } else {
    b.classList.remove('visible');
  }
}

// ===== Alertas 48h =====
function renderAlertas() {
  const conDet = casos.filter(x => !x.sinDetenido && x.fechaDet && x.horaDet);
  const el = document.getElementById('lista-alertas');

  if (!conDet.length) {
    el.innerHTML = '<div class="empty"><i class="ti ti-circle-check"></i>No hay casos con detención registrada</div>';
    return;
  }

  const sorted = [...conDet].sort((a, b) => {
    const ha = horasRestantes(a.fechaDet, a.horaDet) ?? 9999;
    const hb = horasRestantes(b.fechaDet, b.horaDet) ?? 9999;
    return ha - hb;
  });

  el.innerHTML = sorted.map(x => {
    const h = horasRestantes(x.fechaDet, x.horaDet);
    let itemCls = 'alerta-green', timeCls = 'tiempo-green';
    if (h < 0)       { itemCls = 'alerta-red';   timeCls = 'tiempo-red'; }
    else if (h < 6)  { itemCls = 'alerta-red';   timeCls = 'tiempo-red'; }
    else if (h < 12) { itemCls = 'alerta-amber';  timeCls = 'tiempo-amber'; }

    const det = new Date(x.fechaDet + 'T' + x.horaDet + ':00');
    const limite = new Date(det.getTime() + 48 * 3600 * 1000);
    const limiteStr = limite.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + limite.toTimeString().slice(0, 5);

    return `<div class="alerta-item ${itemCls}">
      <div style="flex:1">
        <div class="alerta-delito">${x.delito}</div>
        <div class="alerta-meta">
          ${x.polNombre} · ${x.comisaria}<br>
          Detención: ${formatFecha(x.fechaDet)} ${x.horaDet}<br>
          Vence: ${limiteStr}
        </div>
      </div>
      <div class="tiempo-badge ${timeCls}">${estadoTexto(h)}</div>
    </div>`;
  }).join('');
}

// ===== Historial =====
function renderHistorial() {
  const q = (document.getElementById('buscador').value || '').toLowerCase();
  const filtrados = casos.filter(x =>
    x.delito.toLowerCase().includes(q) ||
    x.comisaria.toLowerCase().includes(q) ||
    x.polNombre.toLowerCase().includes(q)
  );

  const el = document.getElementById('lista-historial');

  if (!filtrados.length) {
    el.innerHTML = '<div class="empty"><i class="ti ti-folder-open"></i>'
      + (q ? 'Sin resultados para "' + q + '"' : 'No hay casos registrados')
      + '</div>';
    return;
  }

  el.innerHTML = filtrados.map(x => {
    const h = horasRestantes(x.fechaDet, x.horaDet);
    const bs = badgeStatus(h, x.sinDetenido);
    return `<div class="caso-item" onclick="verCaso(${x.id})">
      <div style="flex:1;min-width:0">
        <div class="caso-delito">${x.delito}</div>
        <div class="caso-meta">
          ${x.comisaria} · ${formatFecha(x.fechaAviso)} ${x.horaAviso}<br>
          ${x.polNombre}
        </div>
      </div>
      <span class="badge ${bs.cls}">${bs.txt}</span>
    </div>`;
  }).join('');
}

// ===== Detalle caso =====
function verCaso(id) {
  const x = casos.find(c => c.id === id);
  if (!x) return;

  const h = horasRestantes(x.fechaDet, x.horaDet);
  const bs = badgeStatus(h, x.sinDetenido);

  const row = (label, val) => val
    ? `<div class="field-row"><span class="field-lbl">${label}</span><span>${val}</span></div>`
    : '';

  document.getElementById('lista-historial').style.display = 'none';
  document.getElementById('historial-header').style.display = 'none';

  const det = document.getElementById('detalle-caso');
  det.classList.add('open');
  det.innerHTML = `<div class="detalle-card">
    <button class="btn btn-sm" onclick="cerrarDetalle()" style="margin-bottom:12px">
      <i class="ti ti-arrow-left" aria-hidden="true"></i> Volver
    </button>
    <div class="detalle-title">
      ${x.delito}
      <span class="badge ${bs.cls}">${bs.txt}</span>
    </div>
    ${row('Fecha / hora aviso', formatFecha(x.fechaAviso) + ' ' + x.horaAviso)}
    ${row('Efectivo policial', x.polNombre)}
    ${row('DNI', x.polDni)}
    ${row('Celular', x.polCelular)}
    ${row('Comisaría', x.comisaria)}
    ${row('Fecha / hora hecho', x.fechaHecho ? formatFecha(x.fechaHecho) + ' ' + x.horaHecho : '')}
    ${x.sinDetenido
      ? row('Detención', 'Sin detenido')
      : row('Fecha / hora detención', x.fechaDet ? formatFecha(x.fechaDet) + ' ' + x.horaDet : '')}
    ${(!x.sinDetenido && x.fechaDet) ? row('Estado 48h', estadoTexto(h)) : ''}
    ${row('Observaciones', x.obs)}
    <div class="actions" style="margin-top:14px;flex-wrap:wrap">
      <button class="btn" onclick="compartirCaso(${x.id})">
        <i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Compartir
      </button>
      <button class="btn btn-danger" onclick="eliminarCaso(${x.id})">
        <i class="ti ti-trash" aria-hidden="true"></i> Eliminar
      </button>
    </div>
  </div>`;
}

function cerrarDetalle() {
  document.getElementById('detalle-caso').classList.remove('open');
  document.getElementById('detalle-caso').innerHTML = '';
  document.getElementById('lista-historial').style.display = '';
  document.getElementById('historial-header').style.display = '';
}

function eliminarCaso(id) {
  if (!confirm('¿Eliminar este caso del historial?')) return;
  casos = casos.filter(c => c.id !== id);
  save();
  updateBadge();
  cerrarDetalle();
  renderHistorial();
  toast('Caso eliminado');
}

// ===== Compartir por WhatsApp =====
function compartirCaso(id) {
  const x = casos.find(c => c.id === id);
  if (!x) return;
  const h = horasRestantes(x.fechaDet, x.horaDet);
  const lines = [
    '*TURNO FÁCIL — Caso registrado*',
    '',
    `📋 *Delito:* ${x.delito}`,
    `📅 *Aviso:* ${formatFecha(x.fechaAviso)} ${x.horaAviso}`,
    `👮 *Efectivo:* ${x.polNombre}`,
    x.polDni     ? `🪪 *DNI:* ${x.polDni}` : '',
    x.polCelular ? `📱 *Celular:* ${x.polCelular}` : '',
    `🏛 *Comisaría:* ${x.comisaria}`,
    x.fechaHecho ? `⏰ *Hecho:* ${formatFecha(x.fechaHecho)} ${x.horaHecho}` : '',
    x.sinDetenido ? `🔒 *Detención:* Sin detenido` : (x.fechaDet ? `🔒 *Detención:* ${formatFecha(x.fechaDet)} ${x.horaDet}` : ''),
    (!x.sinDetenido && x.fechaDet) ? `⏱ *Estado 48h:* ${estadoTexto(h)}` : '',
    x.obs        ? `📝 *Obs:* ${x.obs}` : '',
  ].filter(Boolean).join('\n');

  window.open('https://wa.me/?text=' + encodeURIComponent(lines), '_blank');
}

// ===== Exportar TXT =====
function exportarTXT() {
  if (!casos.length) { toast('No hay casos para exportar'); return; }

  const ahora = new Date().toLocaleString('es-PE');
  const lines = [`TURNO FÁCIL — Exportación de casos`, `Generado: ${ahora}`, ''];

  casos.forEach((x, i) => {
    const h = horasRestantes(x.fechaDet, x.horaDet);
    lines.push(`--- CASO ${i + 1} ---`);
    lines.push(`Delito: ${x.delito}`);
    lines.push(`Aviso: ${formatFecha(x.fechaAviso)} ${x.horaAviso}`);
    lines.push(`Efectivo: ${x.polNombre}`);
    if (x.polDni)     lines.push(`DNI: ${x.polDni}`);
    if (x.polCelular) lines.push(`Celular: ${x.polCelular}`);
    lines.push(`Comisaría: ${x.comisaria}`);
    if (x.fechaHecho) lines.push(`Hecho: ${formatFecha(x.fechaHecho)} ${x.horaHecho}`);
    if (x.sinDetenido) {
      lines.push('Detención: Sin detenido');
    } else {
      if (x.fechaDet) lines.push(`Detención: ${formatFecha(x.fechaDet)} ${x.horaDet}`);
      if (x.fechaDet) lines.push(`Estado 48h: ${estadoTexto(h)}`);
    }
    if (x.obs)        lines.push(`Observaciones: ${x.obs}`);
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'turno_facil_' + new Date().toISOString().slice(0, 10) + '.txt';
  a.click();
  toast('✓ Archivo exportado');
}

// ===== PWA Install =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.add('visible');
});

function instalarPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('visible');
  });
}

// ===== Service Worker =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ===== Init =====
preFill();
updateBadge();

// Actualizar badge y alertas cada minuto
setInterval(() => {
  updateBadge();
  if (document.getElementById('panel-alertas').classList.contains('active')) {
    renderAlertas();
  }
}, 60000);

// Easter egg
console.log('%cTurno Fácil — by Víctor Siu 🛡️', 'color:#8B0000;font-weight:bold;font-size:14px');
