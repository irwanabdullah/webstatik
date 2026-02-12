const SPREADSHEET_ID = 'MASUKKAN_ID_SPREADSHEET_ANDA_DISINI';
const SHEET_NAME = 'Portfolio';
const ADMIN_SHEET = 'Admin';

// --- HANDLER REQUEST ---

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Lock service untuk mencegah konflik penulisan bersamaan
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = e.parameter.action;
    let result = {};

    // Jika method POST, ambil body data
    let postData = null;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    if (action == 'read') {
      result = getPortfolioData();
    } else if (action == 'login') {
      result = loginAdmin(postData);
    } else if (action == 'create') {
      result = addData(postData);
    } else if (action == 'update') {
      result = editData(postData);
    } else if (action == 'delete') {
      result = deleteData(postData);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNGSI LOGIKA DATABASE ---

function getPortfolioData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift(); // Hapus header
  
  // Format data ke array of objects agar lebih rapi di JSON
  const formatted = data.map(row => ({
    id: row[0],
    judul: row[1],
    kategori: row[2],
    deskripsi: row[3],
    gambar: row[4],
    link: row[5]
  }));
  
  return { status: 'success', data: formatted };
}

function loginAdmin(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ADMIN_SHEET);
  const rows = sheet.getDataRange().getValues();
  
  // Baris 1 adalah header, mulai loop dari baris 2 (index 1)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.username && rows[i][1] == data.password) {
      return { status: 'success', token: 'admin_token_' + new Date().getTime() };
    }
  }
  return { status: 'error', message: 'Username atau Password salah' };
}

function addData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const id = "P" + new Date().getTime();
  
  sheet.appendRow([
    id, data.judul, data.kategori, data.deskripsi, data.gambar, data.link
  ]);
  return { status: 'success', message: 'Data berhasil ditambahkan' };
}

function editData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      // Ingat: i+1 karena sheet mulai dari 1
      sheet.getRange(i + 1, 2).setValue(data.judul);
      sheet.getRange(i + 1, 3).setValue(data.kategori);
      sheet.getRange(i + 1, 4).setValue(data.deskripsi);
      sheet.getRange(i + 1, 5).setValue(data.gambar);
      sheet.getRange(i + 1, 6).setValue(data.link);
      return { status: 'success', message: 'Data berhasil diupdate' };
    }
  }
  return { status: 'error', message: 'ID tidak ditemukan' };
}

function deleteData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data berhasil dihapus' };
    }
  }
  return { status: 'error', message: 'Gagal menghapus' };
}