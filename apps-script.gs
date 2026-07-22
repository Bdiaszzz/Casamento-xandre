// Apps Script para receber os dados do formulário e gravar em uma planilha do Google Sheets.
// 1) Crie um novo projeto no Apps Script.
// 2) Cole este código.
// 3) Troque SPREADSHEET_ID pelo ID da sua planilha.
// 4) Publique como Web App e use a URL gerada no campo "sheet" da página.

const SPREADSHEET_ID = "1aTa__HfCqF8LNTj-LhvXMJfJpajxgjkXEr2aFkOn0qU";
const SHEET_NAME = "Respostas";

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    Logger.log("=== doPost called ===");
    Logger.log("e object type: " + typeof e);
    Logger.log("e is null: " + (e === null));
    if (e) {
      Logger.log("e.postData: " + JSON.stringify(e.postData));
      Logger.log("e.parameter: " + JSON.stringify(e.parameter));
      Logger.log("e.parameters: " + JSON.stringify(e.parameters));
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Nome",
        "Presença",
        "Nº de pessoas",
        "Mensagem",
        "Data de envio",
      ]);
    }

    let payload = {};
    
    try {
      // Primeiro, tenta JSON (fetch com Content-Type: application/json)
      if (
        e &&
        e.postData &&
        e.postData.type &&
        e.postData.type.indexOf("application/json") > -1
      ) {
        Logger.log("Attempting to parse JSON");
        payload = JSON.parse(e.postData.getDataAsString() || "{}");
        Logger.log("Parsed JSON payload: " + JSON.stringify(payload));
      } 
      // Segundo, tenta FormData/form-encoded (XMLHttpRequest)
      else if (e && e.parameter) {
        Logger.log("Using e.parameter (FormData/form-encoded)");
        payload = {
          nome: e.parameter.nome || "",
          presenca: e.parameter.presenca || "",
          pessoas: e.parameter.pessoas || "",
          mensagem: e.parameter.mensagem || "",
          data_envio: e.parameter.data_envio || new Date().toLocaleString("pt-BR"),
        };
        Logger.log("Extracted payload from parameter: " + JSON.stringify(payload));
      } 
      // Fallback se nada funcionar
      else {
        Logger.log("No data found in e.postData or e.parameter");
        payload = {};
      }
    } catch (parseErr) {
      Logger.log("Error during payload parsing: " + parseErr.toString());
      payload = {};
    }

    const row = [
      payload.nome || "",
      payload.presenca || "",
      payload.pessoas || "",
      payload.mensagem || "",
      payload.data_envio || new Date().toLocaleString("pt-BR"),
    ];

    Logger.log("Appending row: " + JSON.stringify(row));
    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, row }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log("doPost fatal error: " + err.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT,
  );
}
