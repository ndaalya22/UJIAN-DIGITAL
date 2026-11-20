// ════════════════ BANK SOAL ════════════════
const JENIS = { PG: 'Pilihan Ganda', PGK: 'PG Kompleks', BS: 'Benar/Salah' };
let SO = { rows: [], mapel: '', jenis: '', q: '' };
async function pgSoal() {
  const res = await call('soalList', {}); if (!res) return;
  SO.rows = res.data; SO.mapel = S.mapel.length === 1 ? S.mapel[0].ID : ''; SO.jenis = ''; SO.q = '';
  $('pageContent').innerHTML = pageHead('Bank Soal & Manajemen Butir', 'Soal dibuat lewat form, gambar, atau impor Excel/Word',
    '<button class="btn btn-soft" onclick="formImpor()"><i class="bi bi-file-earmark-arrow-up"></i> Impor Excel / Word</button><button class="btn btn-primary" onclick="formSoal()"><i class="bi bi-plus-lg"></i> Buat Soal Baru</button>') +
    '<div class="card-x mb-3"><div class="row g-2"><div class="col-md-4"><select class="form-select" id="soMapel" onchange="SO.mapel=this.value;tabelSoal()" aria-label="Mata pelajaran"><option value="">Semua mata pelajaran</option>' + S.mapel.map(m => '<option value="' + m.ID + '" ' + (m.ID === SO.mapel ? 'selected' : '') + '>' + esc(m.Nama) + '</option>').join('') + '</select></div>' +
    '<div class="col-md-3"><select class="form-select" onchange="SO.jenis=this.value;tabelSoal()" aria-label="Jenis"><option value="">Semua jenis</option>' + Object.keys(JENIS).map(j => '<option value="' + j + '">' + JENIS[j] + '</option>').join('') + '</select></div>' +
    '<div class="col-md-5"><input class="form-control" placeholder="Cari teks soal..." oninput="SO.q=this.value;tabelSoal()" aria-label="Cari"></div></div><div class="row g-2 mt-1" id="soKpi"></div></div>' +
    '<div class="card-x"><div class="tscroll" id="soTabel"></div></div>';
  tabelSoal();
}
function tabelSoal() {
  const q = SO.q.toLowerCase();
  const base = SO.rows.filter(r => !SO.mapel || r.MapelID === SO.mapel);
  const cnt = j => base.filter(r => r.Jenis === j).length, tgt = { PG: S.cfg.jumlahPG, PGK: S.cfg.jumlahPGK, BS: S.cfg.jumlahBS };
  $('soKpi').innerHTML = Object.keys(JENIS).map(j => '<div class="col-md-4"><div class="step"><span class="n" style="font-size:.8rem">' + j + '</span><div><div class="small text-muted">' + JENIS[j] + '</div><b>' + cnt(j) + ' / ' + tgt[j] + ' soal</b> ' + (SO.mapel ? (cnt(j) >= Number(tgt[j]) ? '<span class="badge-x ok">Lengkap</span>' : '<span class="badge-x warn">Kurang</span>') : '') + '</div></div></div>').join('');
  const rows = base.filter(r => (!SO.jenis || r.Jenis === SO.jenis) && (!q || r.Teks.toLowerCase().includes(q)));
  $('soTabel').innerHTML = '<table class="table-x"><thead><tr><th>No</th><th>Pratinjau Soal</th><th>Jenis</th><th>Mapel</th><th>Gambar</th><th>Kunci</th><th>Bobot</th><th class="text-end">Aksi</th></tr></thead><tbody>' +
    (rows.slice(0, 200).map((r, i) => '<tr><td>' + (i + 1) + '</td><td style="max-width:340px">' + esc(r.Teks.slice(0, 110)) + (r.Teks.length > 110 ? '…' : '') + '</td><td><span class="badge-x ' + (r.Jenis === 'BS' ? 'warn' : '') + '">' + JENIS[r.Jenis] + '</span></td><td>' + esc(namaMapel(r.MapelID)) + '</td><td>' + ((r.GambarID ? '<img class="thumb" src="' + gambarUrl(r.GambarID, 120) + '" onclick="pratinjauGambar(\'' + r.GambarID + '\')" alt="Gambar soal">' : '') + (r.VideoURL ? ' <i class="bi bi-play-btn-fill text-primary fs-5" title="Ada video"></i>' : '') || '<span class="text-muted">-</span>') + '</td><td><span class="badge-x">' + esc(r.Kunci) + '</span></td><td>' + esc(r.Bobot) + '</td><td class="text-end text-nowrap"><button class="btn btn-soft btn-sm" onclick="formSoal(\'' + r.ID + '\')" aria-label="Ubah"><i class="bi bi-pencil"></i></button> <button class="btn btn-soft btn-sm text-danger" onclick="hapusSoal(\'' + r.ID + '\')" aria-label="Hapus"><i class="bi bi-trash"></i></button></td></tr>').join('') || '<tr><td colspan="8" class="text-center text-muted py-4">Belum ada soal.</td></tr>') + '</tbody></table>' + (rows.length > 200 ? '<div class="small text-muted p-2">Menampilkan 200 dari ' + rows.length + ' soal — gunakan filter untuk mempersempit.</div>' : '');
}
function hapusSoal(id) { konfirmasi('Hapus soal?', 'Soal akan dihapus dari bank soal.', 'Hapus', async () => { const r = await call('soalHapus', { id: id }); if (r) { toast('Berhasil', r.message, 'success'); pgSoal(); } }, true); }

// ── Editor soal ──
let ED = null;
function formSoal(id) {
  const r = id ? SO.rows.find(x => x.ID === id) : null;
  let pil = []; if (r) { try { pil = JSON.parse(r.Pilihan || '[]'); } catch (e) {} }
  ED = { id: id || '', MapelID: r ? r.MapelID : (SO.mapel || (S.mapel[0] || {}).ID || ''), Jenis: r ? r.Jenis : 'PG', Teks: r ? r.Teks : '', GambarID: r ? r.GambarID : '', VideoURL: r ? (r.VideoURL || '') : '', Bobot: r ? r.Bobot : '1', pil: pil, kunci: r ? String(r.Kunci).split(',') : [], file: null };
  if (!r) ED.pil = ['', '', '', '']; if (ED.Jenis === 'BS' && !r) { ED.pil = []; ED.kunci = ['B']; }
  modal(id ? 'Ubah Soal' : 'Buat Soal Baru', '<form id="frmSoal" onsubmit="return false"><div class="row g-3"><div class="col-md-6"><label class="form-label">Mata Pelajaran *</label><select class="form-select" id="edMapel" required>' + S.mapel.map(m => '<option value="' + m.ID + '" ' + (m.ID === ED.MapelID ? 'selected' : '') + '>' + esc(m.Nama) + '</option>').join('') + '</select></div>' +
    '<div class="col-md-6"><label class="form-label">Jenis Soal *</label><select class="form-select" id="edJenis" onchange="edGanti(this.value)">' + Object.keys(JENIS).map(j => '<option value="' + j + '" ' + (j === ED.Jenis ? 'selected' : '') + '>' + JENIS[j] + '</option>').join('') + '</select></div>' +
    '<div class="col-12"><label class="form-label">Teks Soal *</label><textarea class="form-control" id="edTeks" required>' + esc(ED.Teks) + '</textarea></div>' +
    '<div class="col-12"><label class="form-label">Gambar (opsional, maks 2 MB)</label><input type="file" accept="image/*" class="form-control" id="edFile" onchange="edFile(this)"><div id="edGbr" class="mt-2"></div></div>' +
    '<div class="col-12"><label class="form-label">Video (opsional, tautan YouTube atau Google Drive)</label><input class="form-control" id="edVideo" value="' + esc(ED.VideoURL) + '" placeholder="https://www.youtube.com/watch?v=..."></div>' +
    '<div class="col-12" id="edOps"></div><div class="col-md-4"><label class="form-label">Bobot *</label><input type="number" min="0.5" step="0.5" class="form-control" id="edBobot" value="' + esc(ED.Bobot) + '" required></div></div></form>',
    '<button class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnSoal">Simpan Soal</button>', 'lg');
  edGbr(); edOps(); $('btnSoal').onclick = simpanSoal;
}
function edGanti(j) { ED.Jenis = j; ED.kunci = j === 'BS' ? ['B'] : []; ED.pil = j === 'BS' ? [] : ['', '', '', '']; edOps(); }
function edFile(inp) { const f = inp.files[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { toast('Peringatan', 'Ukuran gambar maksimal 2 MB.', 'warning'); inp.value = ''; return; } ED.file = f; const rd = new FileReader(); rd.onload = () => { $('edGbr').innerHTML = '<img src="' + rd.result + '" style="max-height:140px;border-radius:12px" alt="Pratinjau">'; }; rd.readAsDataURL(f); }
function edGbr() { $('edGbr').innerHTML = ED.GambarID ? '<img src="' + gambarUrl(ED.GambarID, 400) + '" style="max-height:140px;border-radius:12px" alt="Gambar soal"> <button type="button" class="btn btn-soft btn-sm ms-2" onclick="ED.GambarID=\'\';edGbr()">Hapus gambar</button>' : ''; }
const HUR = ['A', 'B', 'C', 'D', 'E'];
function edOps() {
  const j = ED.Jenis; let h = '';
  if (j === 'PG' || j === 'PGK') {
    h = '<label class="form-label">Pilihan Jawaban & Kunci * <span class="text-muted fw-normal">(' + (j === 'PG' ? 'pilih satu jawaban benar' : 'centang semua jawaban benar') + ')</span></label>' +
      ED.pil.map((p, i) => '<div class="d-flex align-items-center gap-2 mb-2"><span class="avatar m-0">' + HUR[i] + '</span><input class="form-control" value="' + esc(p) + '" oninput="ED.pil[' + i + ']=this.value" placeholder="Pilihan ' + HUR[i] + '"><input type="' + (j === 'PG' ? 'radio' : 'checkbox') + '" name="kk" class="form-check-input flex-none" style="width:26px;height:26px" ' + (ED.kunci.includes(HUR[i]) ? 'checked' : '') + ' onchange="edKunci(\'' + HUR[i] + '\',this.checked)" aria-label="Kunci ' + HUR[i] + '"></div>').join('') +
      '<div class="d-flex gap-2"><button type="button" class="btn btn-soft btn-sm" ' + (ED.pil.length >= 5 ? 'disabled' : '') + ' onclick="ED.pil.push(\'\');edOps()">+ Pilihan</button><button type="button" class="btn btn-soft btn-sm" ' + (ED.pil.length <= 2 ? 'disabled' : '') + ' onclick="ED.kunci=ED.kunci.filter(k=>k!==HUR[ED.pil.length-1]);ED.pil.pop();edOps()">− Pilihan</button></div>';
  } else if (!ED.pil.length) {
    h = '<label class="form-label">Kunci * <span class="text-muted fw-normal">(teks soal menjadi pernyataan)</span></label><div class="d-flex gap-2 align-items-center"><select class="form-select" style="max-width:200px" onchange="ED.kunci=[this.value]"><option value="B" ' + (ED.kunci[0] === 'B' ? 'selected' : '') + '>BENAR</option><option value="S" ' + (ED.kunci[0] === 'S' ? 'selected' : '') + '>SALAH</option></select><button type="button" class="btn btn-soft btn-sm" onclick="ED.pil=[\'\',\'\'];ED.kunci=[\'B\',\'B\'];edOps()">Gunakan beberapa pernyataan</button></div>';
  } else {
    h = '<label class="form-label">Daftar Pernyataan & Kunci * <span class="text-muted fw-normal">(teks soal menjadi petunjuk)</span></label>' + ED.pil.map((p, i) => '<div class="d-flex align-items-center gap-2 mb-2"><span class="avatar m-0">' + (i + 1) + '</span><input class="form-control" value="' + esc(p) + '" oninput="ED.pil[' + i + ']=this.value" placeholder="Pernyataan ' + (i + 1) + '"><select class="form-select" style="max-width:130px" onchange="ED.kunci[' + i + ']=this.value"><option value="B" ' + (ED.kunci[i] === 'B' ? 'selected' : '') + '>Benar</option><option value="S" ' + (ED.kunci[i] === 'S' ? 'selected' : '') + '>Salah</option></select></div>').join('') +
      '<div class="d-flex gap-2"><button type="button" class="btn btn-soft btn-sm" ' + (ED.pil.length >= 5 ? 'disabled' : '') + ' onclick="ED.pil.push(\'\');ED.kunci.push(\'B\');edOps()">+ Pernyataan</button><button type="button" class="btn btn-soft btn-sm" ' + (ED.pil.length <= 2 ? 'disabled' : '') + ' onclick="ED.pil.pop();ED.kunci.pop();edOps()">− Pernyataan</button><button type="button" class="btn btn-soft btn-sm" onclick="ED.pil=[];ED.kunci=[\'B\'];edOps()">Pakai satu pernyataan</button></div>';
  }
  $('edOps').innerHTML = h;
}
function edKunci(h, on) { if (ED.Jenis === 'PG') ED.kunci = [h]; else ED.kunci = on ? Array.from(new Set(ED.kunci.concat(h))).sort() : ED.kunci.filter(k => k !== h); }
async function simpanSoal() {
  const f = $('frmSoal'); if (!f.checkValidity()) { f.reportValidity(); return; }
  const btn = $('btnSoal'); setBtn(btn, true, 'Menyimpan...');
  try {
    if (ED.file) {
      const b64 = await new Promise((ok, no) => { const rd = new FileReader(); rd.onload = () => ok(rd.result.split(',')[1]); rd.onerror = no; rd.readAsDataURL(ED.file); });
      const g = await api('soalGambar', { base64: b64, nama: ED.file.name, mime: ED.file.type });
      if (!g.success) { toast('Gagal', g.message, 'danger'); return; } ED.GambarID = g.data.id;
    }
    const data = { ID: ED.id, MapelID: $('edMapel').value, Jenis: ED.Jenis, Teks: $('edTeks').value, GambarID: ED.GambarID, VideoURL: $('edVideo').value, Pilihan: ED.pil, Kunci: (ED.Jenis === 'BS' && !ED.pil.length ? ED.kunci.slice(0, 1) : ED.kunci).join(','), Bobot: $('edBobot').value };
    const res = await api('soalSimpan', { data: data });
    if (!res.success) { toast('Gagal', res.message, 'danger'); return; }
    toast('Berhasil', res.message, 'success'); closeModal(); pgSoal();
  } catch (e) { toast('Error', e.message, 'danger'); } finally { setBtn(btn, false); }
}

// ── Impor Excel / Word ──
let IMP = { rows: [], hasil: [] };
function unduhTemplate() {
  const aoa = [['mapel', 'jenis', 'soal', 'a', 'b', 'c', 'd', 'e', 'kunci', 'bobot', 'video'],
    [(S.mapel[0] || {}).Nama || 'Matematika', 'PG', 'Hasil dari 125 + 75 adalah ...', '190', '200', '210', '220', '', 'B', 1],
    [(S.mapel[0] || {}).Nama || 'Matematika', 'PGK', 'Pilih semua bilangan genap.', '12', '15', '20', '27', '', 'A,C', 1],
    [(S.mapel[0] || {}).Nama || 'Matematika', 'BS', 'Tentukan benar/salah tiap pernyataan.', 'Persegi punya 4 sisi sama', 'Segitiga punya 4 sudut', '', '', '', 'B,S', 1],
    [(S.mapel[0] || {}).Nama || 'Matematika', 'BS', '5 + 5 = 10', '', '', '', '', '', 'B', 1]];
  const ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Soal');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Petunjuk'], ['jenis: PG / PGK / BS'], ['kunci PG: satu huruf (B). PGK: huruf dipisah koma (A,C).'], ['BS: kunci B atau S per pernyataan, dipisah koma; kolom a–e = pernyataan. Jika kosong, kolom soal = pernyataan.'], ['Untuk Word (.docx): salin tabel ini ke dokumen Word (satu tabel, baris pertama = judul kolom).'], ['Gambar ditambahkan lewat form Edit Soal setelah impor.']]), 'Petunjuk');
  XLSX.writeFile(wb, 'template_soal_ujian.xlsx');
}
function formImpor() {
  IMP = { rows: [], hasil: [] };
  modal('Impor Soal dari Excel / Word', '<div class="row g-2 mb-3"><div class="col-md-4"><div class="step"><span class="n">1</span><div><b>Unduh template</b><div class="small text-muted">Format baku</div></div></div></div><div class="col-md-4"><div class="step"><span class="n">2</span><div><b>Unggah berkas</b><div class="small text-muted">.xlsx / .csv / .docx</div></div></div></div><div class="col-md-4"><div class="step"><span class="n">3</span><div><b>Validasi & simpan</b><div class="small text-muted">Cek tiap baris</div></div></div></div></div>' +
    '<button class="btn btn-soft mb-3" onclick="unduhTemplate()"><i class="bi bi-download"></i> Unduh Template Excel</button>' +
    '<label class="dropzone d-block" id="dz" for="impFile"><i class="bi bi-cloud-arrow-up fs-1 text-primary"></i><div class="fw-bold">Tarik & lepas berkas, atau klik untuk memilih</div><div class="small text-muted">Maks 5 MB · maks 500 baris</div><input type="file" id="impFile" class="hidden" accept=".xlsx,.xls,.csv,.docx" onchange="impBaca(this.files[0])"></label><div id="impHasil" class="mt-3"></div>', '<button class="btn btn-soft" data-bs-dismiss="modal">Tutup</button><button class="btn btn-primary hidden" id="btnImpSimpan">Simpan</button>', 'xl');
  const dz = $('dz'); ['dragover', 'dragenter'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag'); })); ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag'); })); dz.addEventListener('drop', ev => impBaca(ev.dataTransfer.files[0]));
}
function aoaKeRows(aoa) {
  if (!aoa.length) throw new Error('Berkas kosong.');
  const head = aoa[0].map(h => String(h).trim().toLowerCase());
  ['mapel', 'jenis', 'soal', 'kunci'].forEach(k => { if (head.indexOf(k) < 0) throw new Error('Kolom "' + k + '" tidak ditemukan. Gunakan template resmi.'); });
  return aoa.slice(1).map((r, i) => ({ r: r, i: i })).filter(x => x.r.some(c => String(c).trim() !== '')).map(x => { const o = { _baris: x.i + 2 }; head.forEach((h, j) => o[h] = x.r[j] === undefined ? '' : String(x.r[j]).trim()); return o; });
}
async function impBaca(file) {
  if (!file) return; const box = $('impHasil');
  if (file.size > 5 * 1024 * 1024) { box.innerHTML = '<div class="alert-x">Ukuran berkas melebihi 5 MB.</div>'; return; }
  box.innerHTML = '<span class="spinner-inline"></span> Membaca berkas...';
  try {
    const buf = await file.arrayBuffer(), ext = file.name.split('.').pop().toLowerCase(); let aoa;
    if (ext === 'docx') {
      const r = await mammoth.convertToHtml({ arrayBuffer: buf }), doc = new DOMParser().parseFromString(r.value, 'text/html'), tr = [...doc.querySelectorAll('table tr')];
      if (!tr.length) throw new Error('Tabel tidak ditemukan di dokumen Word.'); aoa = tr.map(t => [...t.children].map(c => c.textContent.trim()));
    } else { const wb = XLSX.read(buf, { type: 'array' }); aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }); }
    IMP.rows = aoaKeRows(aoa); if (!IMP.rows.length) throw new Error('Tidak ada baris soal.'); if (IMP.rows.length > 500) throw new Error('Maksimal 500 baris per impor.');
    const res = await api('soalValidasi', { rows: IMP.rows }); if (!res.success) throw new Error(res.message);
    IMP.hasil = res.data; const ok = IMP.hasil.filter(h => h.valid).length, bad = IMP.hasil.length - ok;
    box.innerHTML = '<div class="d-flex gap-2 mb-2"><span class="badge-x ok">' + ok + ' valid</span><span class="badge-x bad">' + bad + ' perlu revisi</span></div><div class="tscroll" style="max-height:320px;overflow-y:auto"><table class="table-x"><thead><tr><th>Baris</th><th>Jenis</th><th>Ringkasan</th><th>Kunci</th><th>Status</th></tr></thead><tbody>' + IMP.hasil.map(h => '<tr class="' + (h.valid ? '' : 'row-bad') + '"><td>' + h.baris + '</td><td>' + esc(h.jenis) + '</td><td>' + esc(h.ringkas) + '</td><td>' + esc(h.kunci || '-') + '</td><td>' + (h.valid ? '<span class="badge-x ok">Valid</span>' : '<span class="text-danger small">' + esc(h.alasan) + '</span>') + '</td></tr>').join('') + '</tbody></table></div>' + (bad ? '<div class="small text-muted mt-2">Baris tidak valid akan dilewati. Perbaiki di berkas lalu unggah ulang bila perlu.</div>' : '');
    const b = $('btnImpSimpan'); b.classList.toggle('hidden', !ok); b.innerHTML = 'Simpan ' + ok + ' Soal Valid';
    b.onclick = async () => { const r = await call('soalImpor', { rows: IMP.rows }, b); if (r) { toast('Berhasil', r.message, 'success'); closeModal(); pgSoal(); } };
  } catch (e) { box.innerHTML = '<div class="alert-x">' + esc(e.message) + '</div>'; }
}

// ════════════════ HASIL NILAI ════════════════
let HS = { ujian: [], rows: [], uj: null, ringkas: null };
async function pgHasil() {
  const res = await call('crudList', { entitas: 'ujian' }); if (!res) return;
  HS.ujian = res.data.sort((a, b) => String(b.Mulai).localeCompare(String(a.Mulai)));
  $('pageContent').innerHTML = pageHead('Hasil Nilai', 'Lembar nilai individual, ekspor, dan cetak PDF A4') +
    '<div class="card-x mb-3"><label class="form-label">Pilih ujian</label><select class="form-select" id="hsUjian" onchange="muatHasil(this.value)"><option value="">— pilih ujian —</option>' + HS.ujian.map(u => '<option value="' + u.ID + '">' + esc(namaMapel(u.MapelID)) + ' · Kelas ' + esc(u.Kelas) + ' · TW ' + esc(u.Triwulan) + ' · ' + esc(u.TahunAjaran) + '</option>').join('') + '</select></div><div id="hsIsi"></div>';
  if (HS.ujian.length) { $('hsUjian').value = HS.ujian[0].ID; muatHasil(HS.ujian[0].ID); }
}
async function muatHasil(id) {
  if (!id) { $('hsIsi').innerHTML = ''; return; }
  loadingBox('hsIsi'); const res = await call('hasilList', { ujianId: id }); if (!res) { $('hsIsi').innerHTML = ''; return; }
  HS.uj = HS.ujian.find(u => u.ID === id); HS.rows = res.data.rows; HS.ringkas = res.data.ringkas; const r = HS.ringkas, admin = S.user.peran === 'admin';
  const pill = v => v === '' ? '<span class="text-muted">-</span>' : '<span class="nilai-pill ' + (Number(v) >= r.kkm ? '' : Number(v) >= r.kkm - 15 ? 'warn' : 'bad') + '">' + num(v) + '</span>';
  $('hsIsi').innerHTML = '<div class="d-flex flex-wrap gap-2 mb-3"><button class="btn btn-soft" onclick="eksporHasil()"><i class="bi bi-file-earmark-excel"></i> Ekspor Spreadsheet (.xlsx)</button><button class="btn btn-primary" id="btnPdf" onclick="cetakPdf()"><i class="bi bi-printer"></i> Cetak PDF Resmi A4</button></div>' +
    '<div class="row g-3 mb-3"><div class="col-6 col-lg-3">' + statCard('bi-graph-up', 'Rata-rata Kelas', num(r.rata), r.sudah + ' dari ' + r.total + ' siswa') + '</div><div class="col-6 col-lg-3">' + statCard('bi-trophy', 'Nilai Tertinggi', num(r.tertinggi, 0)) + '</div><div class="col-6 col-lg-3">' + statCard('bi-check2-circle', 'Tuntas KKM (≥' + r.kkm + ')', r.sudah ? Math.round(r.tuntas / r.sudah * 100) + '%' : '-', r.tuntas + ' dari ' + r.sudah + ' siswa') + '</div><div class="col-6 col-lg-3">' + statCard('bi-envelope-check', 'Belum Mengerjakan', r.total - r.sudah, 'siswa') + '</div></div>' +
    '<div class="card-x"><h6>Lembar Nilai Individual Peserta Didik</h6><div class="tscroll"><table class="table-x"><thead><tr><th>No</th><th>Nama</th><th>NISN</th><th>Skor PG</th><th>Skor PGK</th><th>Skor B/S</th><th>Nilai Akhir</th><th>Email Ortu</th><th class="text-end">Aksi</th></tr></thead><tbody>' +
    HS.rows.map(x => '<tr><td>' + x.No + '</td><td><span class="avatar">' + inisial(x.Nama) + '</span>' + esc(x.Nama) + '</td><td>' + esc(x.NISN) + '</td><td>' + num(x.SkorPG) + '</td><td>' + num(x.SkorPGK) + '</td><td>' + num(x.SkorBS) + '</td><td>' + pill(x.NilaiAkhir) + '</td><td><span class="badge-x ' + (x.StatusEmail === 'Terkirim' ? 'ok' : x.StatusEmail === 'Gagal' ? 'bad' : 'warn') + '">' + esc(x.StatusEmail) + '</span></td><td class="text-end text-nowrap">' + (x.Sudah ? (admin ? '<button class="btn btn-soft btn-sm" onclick="koreksi(\'' + x.NilaiID + '\',\'' + esc(x.Nama) + '\',\'' + x.NilaiAkhir + '\')">Koreksi</button> ' : '') + '<button class="btn btn-soft btn-sm" onclick="emailUlang(\'' + x.NilaiID + '\')" title="Kirim ulang email"><i class="bi bi-envelope-arrow-up"></i></button>' : '') + '</td></tr>').join('') + '</tbody></table></div></div>';
}
function eksporHasil() {
  const u = HS.uj, aoa = [['No', 'Nama', 'NISN', 'Skor PG', 'Skor PGK', 'Skor B/S', 'Nilai Akhir', 'Status Email']].concat(HS.rows.map(x => [x.No, x.Nama, x.NISN, x.SkorPG, x.SkorPGK, x.SkorBS, x.NilaiAkhir, x.StatusEmail]));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Nilai'); XLSX.writeFile(wb, 'Nilai_' + namaMapel(u.MapelID) + '_' + u.Kelas + '_TW' + u.Triwulan + '.xlsx');
}
async function cetakPdf() {
  const res = await call('hasilPdf', { ujianId: HS.uj.ID }, $('btnPdf')); if (!res) return;
  pratinjau('Pratinjau PDF · ' + res.data.nama, '<iframe src="https://drive.google.com/file/d/' + res.data.id + '/preview" style="width:100%;height:70vh;border:0" title="Pratinjau PDF"></iframe>', 'https://drive.google.com/uc?export=download&id=' + res.data.id);
}
function koreksi(nilaiId, nama, lama) {
  modal('Koreksi Nilai', '<p>Siswa: <b>' + esc(nama) + '</b></p><label class="form-label">Nilai akhir baru (0–100)</label><input type="number" min="0" max="100" step="0.01" class="form-control" id="nilBaru" value="' + esc(lama) + '">', '<button class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnKor">Simpan</button>');
  $('btnKor').onclick = async () => { const r = await call('hasilKoreksi', { nilaiId: nilaiId, nilai: $('nilBaru').value }, $('btnKor')); if (r) { toast('Berhasil', r.message, 'success'); closeModal(); muatHasil(HS.uj.ID); } };
}
async function emailUlang(id) { const r = await call('emailUlang', { nilaiId: id }); if (r) { toast('Berhasil', r.message, 'success'); muatHasil(HS.uj.ID); } }

// ════════════════ ASISTEN AI (admin): multi-penyedia, generate massal, grafik/gambar/video ════════════════
let AI = { provider: '', providers: [], imgProvider: 'gemini', mapelId: '', hist: [], drafts: [], busy: false, job: null, tab: 'chat', visual: true };
const PROV_HINT = { claude: 'Tidak bisa membuat gambar (grafik tetap bisa).', gemini: 'Bisa membuat teks dan gambar.', openai: 'Bisa membuat teks dan gambar.', deepseek: 'Teks saja.', groq: 'Teks saja, cepat.', openrouter: 'Isi nama model sesuai daftar OpenRouter.', custom: 'Isi alamat API (https://…/v1) dan nama model.' };

// ── Pengaturan penyedia AI (halaman Pengaturan) ──
async function kartuAi() {
  const st = await call('aiStatus'); if (!st) return;
  const P = st.data.providers, d = document.createElement('div'); d.className = 'card-x mt-3';
  d.innerHTML = '<h6><i class="bi bi-stars"></i> Asisten AI Pembuat Soal</h6><p class="small text-muted">Isi kunci API untuk penyedia yang ingin dipakai. Kunci disimpan di server (Script Properties) dan tidak pernah tampil di browser. Nama model bisa diubah mengikuti model terbaru dari penyedia.</p>' +
    P.map(p => '<div class="border rounded-3 p-3 mb-2" style="border-color:var(--border)!important"><div class="d-flex justify-content-between flex-wrap gap-1 mb-2"><b>' + esc(p.nama) + '</b><span class="badge-x ' + (p.ada ? 'ok' : 'warn') + '">' + (p.ada ? 'kunci terpasang' : 'belum diisi') + '</span></div><div class="small text-muted mb-2">' + esc(PROV_HINT[p.id] || '') + '</div><div class="row g-2">' +
      '<div class="col-md-5"><input type="password" class="form-control" id="k_' + p.id + '" autocomplete="off" placeholder="' + (p.ada ? 'Isi hanya untuk mengganti kunci' : 'Tempel kunci API') + '" aria-label="Kunci ' + esc(p.nama) + '"></div>' +
      '<div class="col-md-3"><input class="form-control" id="m_' + p.id + '" value="' + esc(p.model) + '" placeholder="Nama model" aria-label="Model"></div>' +
      (p.tipe === 'compat' ? '<div class="col-md-4"><input class="form-control" id="u_' + p.id + '" value="' + esc(p.url) + '" placeholder="https://…/v1" aria-label="Alamat API"></div>' : '') +
      '</div><div class="d-flex gap-2 mt-2"><button class="btn btn-primary btn-sm" onclick="aiSimpanProv(\'' + p.id + '\',this)">Simpan</button>' + (p.ada ? '<button class="btn btn-soft btn-sm text-danger" onclick="aiHapusProv(\'' + p.id + '\')">Hapus kunci</button>' : '') + '</div></div>').join('') +
    '<div class="row g-2 mt-2"><div class="col-md-6"><label class="form-label">Penyedia bawaan (teks)</label><select class="form-select" id="aiDef">' + P.map(p => '<option value="' + p.id + '" ' + (p.id === st.data.def ? 'selected' : '') + '>' + esc(p.nama) + '</option>').join('') + '</select></div>' +
    '<div class="col-md-6"><label class="form-label">Pembuat gambar</label><select class="form-select" id="aiImg"><option value="gemini" ' + (st.data.imgProvider === 'gemini' ? 'selected' : '') + '>Gemini</option><option value="openai" ' + (st.data.imgProvider === 'openai' ? 'selected' : '') + '>GPT (OpenAI)</option></select></div></div>' +
    '<button class="btn btn-primary mt-3" id="btnAiDef">Simpan pilihan bawaan</button>';
  $('pageContent').appendChild(d);
  $('btnAiDef').onclick = async () => { const r = await call('aiSetKey', { def: $('aiDef').value, imgProvider: $('aiImg').value }, $('btnAiDef')); if (r) toast('Berhasil', r.message, 'success'); };
}
async function aiSimpanProv(id, btn) {
  const pay = { provider: id, key: $('k_' + id).value, model: $('m_' + id).value }; if ($('u_' + id)) pay.url = $('u_' + id).value;
  const r = await call('aiSetKey', pay, btn); if (r) { toast('Berhasil', r.message, 'success'); pgPengaturan(); }
}
async function aiHapusProv(id) { const r = await call('aiSetKey', { provider: id, hapus: true }); if (r) { toast('Berhasil', r.message, 'success'); pgPengaturan(); } }

// ── Grafik → SVG (digambar di browser agar data pasti akurat) ──
function grafikKeSvg(g) {
  const W = 480, H = 300, L = 56, R = 20, T = 44, B = 56, warna = ['#2F6FED', '#FFC93C', '#16A34A', '#DC2626', '#8B5CF6', '#F97316', '#14B8A6', '#EC4899', '#64748B', '#84CC16', '#0EA5E9', '#A855F7'];
  const t = x => esc(String(x)); let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" font-family="Arial,sans-serif"><rect width="' + W + '" height="' + H + '" fill="#fff"/>' +
    '<text x="' + W / 2 + '" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="#16275C">' + t(g.judul || '') + '</text>';
  const n = g.nilai.length, max = Math.max.apply(null, g.nilai.concat(1));
  if (g.tipe === 'pie') {
    const tot = g.nilai.reduce((a, b) => a + b, 0) || 1, cx = 150, cy = 165, r = 100; let a0 = -Math.PI / 2;
    g.nilai.forEach((v, i) => {
      const a1 = a0 + v / tot * Math.PI * 2, x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      s += n === 1 || v === tot ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + warna[i % 12] + '"/>' : '<path d="M' + cx + ',' + cy + ' L' + x0 + ',' + y0 + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1 + ',' + y1 + ' Z" fill="' + warna[i % 12] + '" stroke="#fff" stroke-width="2"/>';
      const am = (a0 + a1) / 2; if (v / tot > .05) s += '<text x="' + (cx + r * .62 * Math.cos(am)) + '" y="' + (cy + r * .62 * Math.sin(am) + 4) + '" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">' + Math.round(v / tot * 100) + '%</text>';
      s += '<rect x="290" y="' + (70 + i * 20) + '" width="12" height="12" fill="' + warna[i % 12] + '"/><text x="308" y="' + (80 + i * 20) + '" font-size="12" fill="#1E2A4A">' + t(g.label[i]) + ' (' + v + (g.satuan ? ' ' + t(g.satuan) : '') + ')</text>'; a0 = a1;
    });
    return s + '</svg>';
  }
  const mag = Math.pow(10, Math.floor(Math.log10(max))), step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(v => v >= max / 5), top = Math.ceil(max / step) * step, pw = W - L - R, ph = H - T - B;
  for (let v = 0; v <= top + 1e-9; v += step) { const y = T + ph - v / top * ph; s += '<line x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '" stroke="#E3E9F5"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#64708A">' + (Math.round(v * 100) / 100) + '</text>'; }
  if (g.satuan) s += '<text x="' + L + '" y="' + (T - 8) + '" font-size="11" fill="#64708A">' + t(g.satuan) + '</text>';
  const bw = pw / n;
  if (g.tipe === 'bar') g.nilai.forEach((v, i) => { const h = v / top * ph, x = L + i * bw + bw * .18; s += '<rect x="' + x + '" y="' + (T + ph - h) + '" width="' + bw * .64 + '" height="' + h + '" rx="4" fill="' + warna[i % 12] + '"/><text x="' + (x + bw * .32) + '" y="' + (T + ph - h - 5) + '" text-anchor="middle" font-size="11" font-weight="bold" fill="#1E2A4A">' + v + '</text>'; });
  else { const pts = g.nilai.map((v, i) => [L + i * bw + bw / 2, T + ph - v / top * ph]); s += '<polyline fill="none" stroke="#2F6FED" stroke-width="3" points="' + pts.map(p => p.join(',')).join(' ') + '"/>'; pts.forEach((p, i) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#2F6FED"/><text x="' + p[0] + '" y="' + (p[1] - 10) + '" text-anchor="middle" font-size="11" font-weight="bold" fill="#1E2A4A">' + g.nilai[i] + '</text>'; }); }
  g.label.forEach((l, i) => { s += '<text x="' + (L + i * bw + bw / 2) + '" y="' + (T + ph + 18) + '" text-anchor="middle" font-size="11" fill="#1E2A4A">' + t(l.length > 12 ? l.slice(0, 11) + '…' : l) + '</text>'; });
  return s + '<line x1="' + L + '" y1="' + (T + ph) + '" x2="' + (W - R) + '" y2="' + (T + ph) + '" stroke="#64708A"/></svg>';
}
function svgSiap(svg) {   // pastikan <svg> punya width/height (Firefox/Safari butuh untuk digambar ke canvas)
  const tag = (svg.match(/<svg[^>]*>/i) || [''])[0]; if (/\swidth\s*=/.test(tag) && /\sheight\s*=/.test(tag)) return svg;
  const m = tag.match(/viewBox\s*=\s*["']\s*[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i), w = 800, h = m ? Math.round(w * (+m[2]) / (+m[1])) : 500;
  return svg.replace(/<svg/i, '<svg width="' + w + '" height="' + h + '"');
}
const svgUrl = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSiap(svg));
function visualSrc(d) { if (d.png) return 'data:' + (d.mime || 'image/png') + ';base64,' + d.png; if (d.grafik) return svgUrl(grafikKeSvg(d.grafik)); if (d.svg) return svgUrl(d.svg); return ''; }
/** Rasterisasi gambar (SVG/PNG) ke base64 di browser; hasil diunggah ke Drive lewat soalGambar */
function rasterisasi(src, maxW, jpg) {
  return new Promise((ok, no) => {
    const im = new Image(); im.onload = () => {
      const nw = im.naturalWidth || 800, nh = im.naturalHeight || 500, W = Math.min(maxW, nw), H = Math.max(1, Math.round(W * nh / nw));
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H);
      ok({ base64: cv.toDataURL(jpg ? 'image/jpeg' : 'image/png', .85).split(',')[1], mime: jpg ? 'image/jpeg' : 'image/png' });
    }; im.onerror = () => no(new Error('Gagal memproses gambar.')); im.src = src;
  });
}

// ── Halaman AI ──
const aiProv = () => AI.providers.find(p => p.id === AI.provider) || {};
async function pgAi() {
  const st = await call('aiStatus'); if (!st) return;
  AI.providers = st.data.providers; AI.imgProvider = st.data.imgProvider; if (!AI.provider || !AI.providers.some(p => p.id === AI.provider)) AI.provider = st.data.def;
  if (!AI.mapelId) AI.mapelId = (S.mapel[0] || {}).ID || '';
  const kls = [1, 2, 3, 4, 5, 6].map(n => '<option ' + (n === 4 ? 'selected' : '') + '>' + n + '</option>').join('');
  $('pageContent').innerHTML = pageHead('Buat Soal dengan AI', 'Pilih penyedia AI, buat soal lewat percakapan atau massal, tambahkan grafik, gambar, dan video, lalu simpan ke Bank Soal') +
    '<div class="ai-grid"><div class="card-x"><div class="row g-2 mb-2"><div class="col-6"><label class="form-label" for="aiProv">Penyedia AI</label><select class="form-select" id="aiProv" onchange="AI.provider=this.value;aiWarn()">' + AI.providers.map(p => '<option value="' + p.id + '" ' + (p.id === AI.provider ? 'selected' : '') + '>' + esc(p.nama) + (p.ada ? '' : ' (belum ada kunci)') + '</option>').join('') + '</select></div>' +
    '<div class="col-6"><label class="form-label" for="aiMapel">Mata pelajaran tujuan</label><select class="form-select" id="aiMapel" onchange="AI.mapelId=this.value">' + S.mapel.map(m => '<option value="' + m.ID + '" ' + (m.ID === AI.mapelId ? 'selected' : '') + '>' + esc(m.Nama) + '</option>').join('') + '</select></div></div><div id="aiWarn"></div>' +
    '<label class="form-check mb-2"><input type="checkbox" class="form-check-input" id="aiVis" ' + (AI.visual ? 'checked' : '') + ' onchange="AI.visual=this.checked"> <span class="form-check-label small">Sertakan grafik / gambar bila cocok</span></label>' +
    '<div class="d-flex gap-2 mb-2"><button class="btn btn-sm" id="tabChat" onclick="aiTab(\'chat\')">Percakapan</button><button class="btn btn-sm" id="tabMassal" onclick="aiTab(\'massal\')">Generate Massal</button></div>' +
    '<div id="panChat"><div class="chat" id="aiChat"></div><div class="d-flex flex-wrap gap-1 mb-2">' + ['10 soal PG pecahan kelas 4, tingkat sedang', '5 soal PG kompleks tentang bangun datar', '6 soal benar/salah dengan diagram batang'].map(t => '<button class="badge-x border-0" style="cursor:pointer" onclick="$(\'aiMsg\').value=this.textContent;$(\'aiMsg\').focus()">' + t + '</button>').join('') + '</div><div class="d-flex gap-2"><textarea class="form-control" id="aiMsg" rows="2" placeholder="Ceritakan soal yang dibutuhkan..." aria-label="Pesan"></textarea><button class="btn btn-primary" id="btnAi" onclick="kirimAi()" aria-label="Kirim"><i class="bi bi-send-fill"></i></button></div></div>' +
    '<div id="panMassal" class="hidden"><div class="mb-2"><label class="form-label">Topik / materi</label><input class="form-control" id="msTopik" placeholder="mis. pecahan senilai dan perbandingan pecahan"></div><div class="row g-2 mb-2"><div class="col-6"><label class="form-label">Kelas</label><select class="form-select" id="msKelas">' + kls + '</select></div><div class="col-6"><label class="form-label">Tingkat</label><select class="form-select" id="msTingkat"><option>mudah</option><option selected>sedang</option><option>sulit</option><option>campuran</option></select></div></div>' +
    '<div class="row g-2 mb-2"><div class="col-4"><label class="form-label">Jml PG</label><input type="number" min="0" max="60" class="form-control" id="msPG" value="10"></div><div class="col-4"><label class="form-label">Jml PGK</label><input type="number" min="0" max="60" class="form-control" id="msPGK" value="5"></div><div class="col-4"><label class="form-label">Jml B/S</label><input type="number" min="0" max="60" class="form-control" id="msBS" value="5"></div></div>' +
    '<div class="small text-muted mb-2">Maksimal 100 soal per proses. Soal dibuat bertahap (6 soal per permintaan, 4 bila ada visual) dan hasilnya langsung masuk ke daftar draf.</div><div class="d-flex gap-2"><button class="btn btn-primary flex-grow-1" id="btnMassal" onclick="mulaiMassal()"><i class="bi bi-lightning-charge-fill"></i> Mulai Generate</button><button class="btn btn-soft hidden" id="btnStop" onclick="if(AI.job)AI.job.stop=true">Hentikan</button></div><div id="aiJob" class="mt-3"></div></div></div>' +
    '<div class="card-x"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><h6 class="mb-0">Draf Soal <span class="badge-x" id="aiCnt">0</span></h6><div class="d-flex flex-wrap gap-1"><button class="btn btn-soft btn-sm" onclick="aiPilih(true)">Pilih semua</button><button class="btn btn-soft btn-sm" onclick="aiPilih(false)">Kosongkan</button><button class="btn btn-soft btn-sm" onclick="aiSalin()" title="Salin teks soal untuk dipakai di aplikasi lain (mis. Wordwall)"><i class="bi bi-clipboard"></i></button><button class="btn btn-soft btn-sm" onclick="aiEkspor()" title="Unduh Excel"><i class="bi bi-file-earmark-excel"></i></button></div></div><div id="aiDraf"></div><button class="btn btn-primary w-100 mt-2" id="btnAiSimpan" onclick="aiSimpan()"><i class="bi bi-save"></i> Simpan soal terpilih ke Bank Soal</button></div></div>';
  $('aiMsg').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimAi(); } });
  aiTab(AI.tab); aiWarn(); drawChat(); drawDraf();
}
function aiWarn() { const p = aiProv(), b = $('aiWarn'); if (b) b.innerHTML = p.ada ? '' : '<div class="alert-x mb-2" style="background:var(--yellow-50);color:#7a5200">Kunci API ' + esc(p.nama || '') + ' belum diisi. Buka <a href="#" onclick="nav(\'pengaturan\');return false">Pengaturan</a>.</div>'; }
function aiTab(t) { AI.tab = t; $('panChat').classList.toggle('hidden', t !== 'chat'); $('panMassal').classList.toggle('hidden', t !== 'massal'); $('tabChat').className = 'btn btn-sm ' + (t === 'chat' ? 'btn-primary' : 'btn-soft'); $('tabMassal').className = 'btn btn-sm ' + (t === 'massal' ? 'btn-primary' : 'btn-soft'); }
function drawChat() {
  const box = $('aiChat'); if (!box) return;
  box.innerHTML = '<div class="msg a">Halo! Sebutkan jenis, jumlah, topik, dan tingkat kesulitan soal. Untuk banyak soal sekaligus, buka tab "Generate Massal".</div>' + AI.hist.map(m => '<div class="msg ' + (m.role === 'user' ? 'u' : 'a') + '">' + esc(m.content) + '</div>').join('') + (AI.busy ? '<div class="msg a typing"><span></span><span></span><span></span></div>' : '');
  box.scrollTop = box.scrollHeight;
}
const embedVideo = u => u ? '<div class="q-video" style="max-width:260px"><iframe src="' + esc(u) + '" loading="lazy" title="Video"></iframe></div>' : '';
function drawDraf() {
  const box = $('aiDraf'); if (!box) return;
  $('aiCnt').textContent = AI.drafts.length;
  box.innerHTML = AI.drafts.length ? AI.drafts.map((d, i) => {
    const s = d.data, kunci = String(s.Kunci).split(','), src = visualSrc(d);
    const pil = s.Pilihan.length ? s.Pilihan.map((p, k) => '<div class="pl ' + ((s.Jenis !== 'BS' && kunci.includes(HUR[k])) ? 'k' : '') + '">' + (s.Jenis === 'BS' ? (k + 1) + '. ' + esc(p) + ' → <b>' + (kunci[k] === 'B' ? 'Benar' : 'Salah') + '</b>' : HUR[k] + '. ' + esc(p)) + '</div>').join('') : '<div class="pl k">Kunci: <b>' + (kunci[0] === 'B' ? 'BENAR' : 'SALAH') + '</b></div>';
    return '<div class="draft ' + (d.sel ? 'sel' : '') + (d.ok ? '' : ' bad') + '"><div class="d-flex gap-2 align-items-start"><input type="checkbox" class="form-check-input mt-1" style="width:22px;height:22px;flex:none" ' + (d.sel ? 'checked' : '') + (d.ok ? '' : ' disabled') + ' onchange="AI.drafts[' + i + '].sel=this.checked;drawDraf()" aria-label="Pilih soal ' + (i + 1) + '"><div class="flex-grow-1" style="min-width:0"><div class="mb-1"><span class="badge-x">' + (i + 1) + '</span> <span class="badge-x ' + (s.Jenis === 'BS' ? 'warn' : '') + '">' + (JENIS[s.Jenis] || s.Jenis) + '</span>' + (d.video ? ' <span class="badge-x ok"><i class="bi bi-play-btn"></i> video</span>' : '') + '</div><div>' + nl2br(s.Teks) + '</div>' +
      (src ? '<img class="img-fluid rounded border my-2" style="max-height:170px;background:#fff" src="' + src + '" alt="Visual soal">' : '') + embedVideo(d.video) + pil + (d.ok ? '' : '<div class="text-danger small mt-1"><i class="bi bi-exclamation-triangle"></i> ' + esc(d.err) + ' — gunakan Ganti.</div>') + '</div></div>' +
      '<div class="d-flex flex-wrap gap-1 justify-content-end mt-2"><button class="btn btn-soft btn-sm" onclick="aiGanti(' + i + ')"><i class="bi bi-arrow-repeat"></i> Ganti</button><button class="btn btn-soft btn-sm" onclick="aiBuatGambar(' + i + ')"><i class="bi bi-image"></i> Gambar AI</button><button class="btn btn-soft btn-sm" onclick="aiVideo(' + i + ')"><i class="bi bi-play-btn"></i> Video</button>' +
      (src ? '<button class="btn btn-soft btn-sm" onclick="aiHapusVisual(' + i + ')" aria-label="Hapus visual"><i class="bi bi-image-alt"></i>✕</button>' : '') + '<button class="btn btn-soft btn-sm text-danger" onclick="AI.drafts.splice(' + i + ',1);drawDraf()" aria-label="Buang"><i class="bi bi-trash"></i></button></div></div>';
  }).join('') : '<div class="text-center text-muted py-5"><i class="bi bi-stars fs-1"></i><p class="mb-0">Draf soal dari asisten akan muncul di sini.</p></div>';
  const n = AI.drafts.filter(d => d.sel && d.ok).length; const b = $('btnAiSimpan'); if (b && !b.disabled) b.innerHTML = '<i class="bi bi-save"></i> Simpan ' + n + ' soal terpilih ke Bank Soal';
}
function aiPilih(on) { AI.drafts.forEach(d => { if (d.ok) d.sel = on; }); drawDraf(); }
const draftBaru = s => ({ data: s.data, ok: s.ok, err: s.err, sel: s.ok, grafik: s.grafik || null, svg: s.svg || '', gambarPrompt: s.gambarPrompt || '', png: '', mime: '', video: '' });

async function kirimAi() {
  if (AI.busy) return; const t = $('aiMsg').value.trim(); if (!t) return;
  if (!AI.mapelId) { toast('Peringatan', 'Pilih mata pelajaran dahulu.', 'warning'); return; }
  const riwayat = AI.hist.slice(); AI.hist.push({ role: 'user', content: t }); $('aiMsg').value = ''; AI.busy = true; $('btnAi').disabled = true; drawChat();
  try {
    const res = await api('aiChat', { provider: AI.provider, mapelId: AI.mapelId, visual: AI.visual, history: riwayat, pesan: t, drafts: AI.drafts.map(d => d.data) });
    if (!res.success) AI.hist.push({ role: 'assistant', content: 'Maaf, terjadi kendala: ' + res.message });
    else { AI.hist.push({ role: 'assistant', content: res.data.balasan || (res.data.soal.length ? 'Ini draf soalnya.' : '...') }); res.data.soal.forEach(s => AI.drafts.push(draftBaru(s))); }
  } catch (e) { AI.hist.push({ role: 'assistant', content: 'Maaf, koneksi bermasalah: ' + e.message }); }
  AI.busy = false; const b = $('btnAi'); if (b) b.disabled = false; drawChat(); drawDraf();
}

// ── Generate massal (beberapa permintaan paralel, hasil masuk bertahap) ──
async function mulaiMassal() {
  if (AI.job && !AI.job.selesai) return;
  if (!AI.mapelId) { toast('Peringatan', 'Pilih mata pelajaran dahulu.', 'warning'); return; }
  const n = { PG: +$('msPG').value || 0, PGK: +$('msPGK').value || 0, BS: +$('msBS').value || 0 }, total = n.PG + n.PGK + n.BS;
  if (!total) { toast('Peringatan', 'Isi jumlah soal minimal satu jenis.', 'warning'); return; }
  if (total > 100) { toast('Peringatan', 'Maksimal 100 soal per proses.', 'warning'); return; }
  if (!aiProv().ada) { toast('Peringatan', 'Kunci API penyedia ini belum diisi.', 'warning'); return; }
  const per = AI.visual ? 4 : 6, antri = [], dasar = { provider: AI.provider, mapelId: AI.mapelId, visual: AI.visual, topik: $('msTopik').value.trim(), kelas: $('msKelas').value, tingkat: $('msTingkat').value, mode: 'batch' };
  ['PG', 'PGK', 'BS'].forEach(j => { let sisa = n[j]; const bag = Math.ceil(sisa / per); for (let b = 1; sisa > 0; b++) { const c = Math.min(per, sisa); antri.push({ jenis: j, jumlah: c, bagian: b, dari: bag }); sisa -= c; } });
  const job = AI.job = { total: total, dapat: 0, selesaiBagian: 0, bagian: antri.length, gagal: [], stop: false, selesai: false };
  $('btnMassal').disabled = true; $('btnStop').classList.remove('hidden'); jobUI();
  const worker = async () => {
    while (antri.length && !job.stop) {
      const q = antri.shift(); let ok = false, err = '';
      for (let coba = 0; coba < 2 && !ok && !job.stop; coba++) {
        try {
          const hindari = AI.drafts.filter(d => d.data.Jenis === q.jenis).slice(-25).map(d => d.data.Teks);
          const r = await api('aiChat', Object.assign({}, dasar, q, { hindari: hindari }));
          if (r.success) { r.data.soal.forEach(s => AI.drafts.push(draftBaru(s))); job.dapat += r.data.soal.length; ok = true; } else err = r.message;
        } catch (e) { err = e.message; }
      }
      if (!ok) job.gagal.push(q.jenis + ' bagian ' + q.bagian + ': ' + err);
      job.selesaiBagian++; jobUI(); drawDraf();
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  job.selesai = true; const b = $('btnMassal'); if (b) b.disabled = false; if ($('btnStop')) $('btnStop').classList.add('hidden'); jobUI(); drawDraf();
}
function jobUI() {
  const j = AI.job, box = $('aiJob'); if (!j || !box) return; const pct = Math.round(j.selesaiBagian / j.bagian * 100);
  box.innerHTML = '<div class="progress mb-2"><div class="progress-bar" style="width:' + pct + '%"></div></div><div class="small">' + (j.selesai ? (j.stop ? 'Dihentikan. ' : 'Selesai. ') : 'Membuat soal... ') + '<b>' + j.dapat + '</b> soal masuk draf (' + j.selesaiBagian + '/' + j.bagian + ' permintaan).</div>' +
    (j.gagal.length ? '<div class="alert-x mt-2 small">' + j.gagal.length + ' permintaan gagal:<br>' + j.gagal.slice(0, 4).map(esc).join('<br>') + '</div>' : '');
}

// ── Ganti soal, gambar AI, video ──
function aiGanti(i) {
  modal('Ganti soal nomor ' + (i + 1), '<div class="mb-2 small text-muted">' + esc(AI.drafts[i].data.Teks.slice(0, 140)) + '</div><label class="form-label">Apa yang ingin diubah? (opsional)</label><textarea class="form-control" id="aiInstr" rows="3" placeholder="mis. buat lebih mudah, ganti nama tokoh, atau ubah menjadi PG kompleks"></textarea>', '<button class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnGanti">Ganti Soal</button>');
  $('btnGanti').onclick = async () => {
    const r = await call('aiChat', { mode: 'ganti', provider: AI.provider, mapelId: AI.mapelId, visual: AI.visual, draft: AI.drafts[i].data, instruksi: $('aiInstr').value }, $('btnGanti'));
    if (!r) return; const s = r.data.soal[0];
    if (!s) { toast('Gagal', 'AI tidak mengembalikan soal. Coba ubah instruksi.', 'danger'); return; }
    const lama = AI.drafts[i]; AI.drafts[i] = draftBaru(s); AI.drafts[i].video = lama.video; closeModal(); drawDraf(); toast('Berhasil', 'Soal nomor ' + (i + 1) + ' diganti.', 'success');
  };
}
function aiBuatGambar(i) {
  const d = AI.drafts[i], ip = AI.providers.find(p => p.id === AI.imgProvider) || {};
  modal('Gambar AI untuk soal ' + (i + 1), '<div class="small text-muted mb-2">Dibuat oleh <b>' + esc(ip.nama || AI.imgProvider) + '</b>' + (ip.ada ? '' : ' — kunci belum diisi di Pengaturan') + '. Gambar tanpa teks; untuk grafik berangka pakai opsi grafik agar akurat.</div><label class="form-label">Deskripsi gambar</label><textarea class="form-control" id="imgPrompt" rows="3" placeholder="mis. seorang petani memanen 5 keranjang apel di kebun">' + esc(d.gambarPrompt || '') + '</textarea>', '<button class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnImg"><i class="bi bi-magic"></i> Buat Gambar</button>');
  $('btnImg').onclick = async () => {
    const p = $('imgPrompt').value.trim(); if (!p) { toast('Peringatan', 'Isi deskripsi gambar.', 'warning'); return; }
    const r = await call('aiGambar', { provider: AI.imgProvider, prompt: p }, $('btnImg')); if (!r) return;
    Object.assign(AI.drafts[i], { png: r.data.base64, mime: r.data.mime, gambarPrompt: p }); closeModal(); drawDraf(); toast('Berhasil', 'Gambar dibuat. Periksa sebelum menyimpan.', 'success');
  };
}
function aiHapusVisual(i) { Object.assign(AI.drafts[i], { png: '', mime: '', grafik: null, svg: '' }); drawDraf(); }
function aiVideo(i) {
  modal('Video untuk soal ' + (i + 1), '<label class="form-label">Tautan video (YouTube atau Google Drive)</label><input class="form-control" id="vidUrl" value="' + esc(AI.drafts[i].video || '') + '" placeholder="https://www.youtube.com/watch?v=..."><div class="small text-muted mt-2">AI tidak membuat video. Cari video yang sesuai, lalu tempel tautannya. Video Drive harus dibagikan "siapa pun dengan tautan". Kosongkan untuk menghapus.</div>', '<button class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnVid">Pasang</button>');
  $('btnVid').onclick = () => { const u = $('vidUrl').value.trim(); if (u && !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|drive\.google\.com)\//.test(u)) { toast('Peringatan', 'Hanya tautan YouTube atau Google Drive (https).', 'warning'); return; } AI.drafts[i].video = u; closeModal(); drawDraf(); };
}

// ── Simpan (unggah gambar dulu, lalu simpan batch) ──
async function aiSimpan() {
  const pilih = AI.drafts.filter(d => d.sel && d.ok); if (!pilih.length) { toast('Peringatan', 'Belum ada soal yang dipilih.', 'warning'); return; }
  const btn = $('btnAiSimpan'); setBtn(btn, true, 'Menyimpan...');
  try {
    const out = [];
    for (let k = 0; k < pilih.length; k++) {
      const d = pilih[k], data = Object.assign({}, d.data); btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan ' + (k + 1) + '/' + pilih.length + '...';
      const src = visualSrc(d);
      if (src) {
        const img = await rasterisasi(src, d.png ? 900 : 800, !!d.png);
        const g = await api('soalGambar', { base64: img.base64, mime: img.mime, nama: 'ai.' + (img.mime === 'image/jpeg' ? 'jpg' : 'png') });
        if (!g.success) throw new Error('Soal ' + (AI.drafts.indexOf(d) + 1) + ': ' + g.message); data.GambarID = g.data.id;
      }
      if (d.video) data.VideoURL = d.video; out.push(data);
    }
    let simpan = 0; for (let k = 0; k < out.length; k += 20) { const r = await api('soalBatch', { mapelId: AI.mapelId, data: out.slice(k, k + 20) }); if (!r.success) throw new Error(r.message); simpan += out.length; }
    toast('Berhasil', out.length + ' soal masuk ke Bank Soal.', 'success'); AI.drafts = AI.drafts.filter(d => !pilih.includes(d)); 
  } catch (e) { toast('Gagal', e.message, 'danger'); }
  finally { setBtn(btn, false); drawDraf(); }
}

// ── Ekspor draf (untuk aplikasi lain, mis. Wordwall, atau impor ulang) ──
function aiTeks() {
  return AI.drafts.filter(d => d.ok).map((d, i) => { const s = d.data, k = String(s.Kunci).split(','); return (i + 1) + '. ' + s.Teks + '\n' + (s.Jenis === 'BS' ? (s.Pilihan.length ? s.Pilihan.map((p, x) => '   - ' + p + ' [' + (k[x] === 'B' ? 'Benar' : 'Salah') + ']').join('\n') : '   Jawaban: ' + (k[0] === 'B' ? 'Benar' : 'Salah')) : s.Pilihan.map((p, x) => '   ' + HUR[x] + '. ' + p + (k.includes(HUR[x]) ? '  ✓' : '')).join('\n')); }).join('\n\n');
}
async function aiSalin() { if (!AI.drafts.length) { toast('Info', 'Belum ada draf.', 'info'); return; } try { await navigator.clipboard.writeText(aiTeks()); toast('Berhasil', 'Teks soal disalin ke clipboard.', 'success'); } catch (e) { toast('Gagal', 'Browser menolak akses clipboard.', 'danger'); } }
function aiEkspor() {
  if (!AI.drafts.length) { toast('Info', 'Belum ada draf.', 'info'); return; }
  const mp = namaMapel(AI.mapelId), aoa = [['mapel', 'jenis', 'soal', 'a', 'b', 'c', 'd', 'e', 'kunci', 'bobot', 'video']].concat(AI.drafts.filter(d => d.ok).map(d => { const s = d.data, p = s.Pilihan.slice(0, 5); while (p.length < 5) p.push(''); return [mp, s.Jenis, s.Teks].concat(p, [s.Kunci, s.Bobot, d.video || '']); }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Soal'); XLSX.writeFile(wb, 'draf_soal_ai.xlsx');
}
