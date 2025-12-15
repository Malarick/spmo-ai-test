/**
 * Google Apps Script backend for the AI Literacy Assessment.
 * 1) Create a new Apps Script project connected to your Google Sheet.
 * 2) Add a sheet named "Responses" with columns:
 *    A: Timestamp, B: Name, C: Email, D: Team,
 *    E: TotalScore, F: Capabilities, G: Types, H: Risk, I: Data, J: Tools, K: Responses (JSON).
 * 3) Deploy as Web App (Execute as: Me; Access: Anyone) and copy URL into ENDPOINT in index.html.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName("Responses") ||
      SpreadsheetApp.getActive().insertSheet("Responses");

    const body = JSON.parse(e.postData.contents || "{}");
    const scores = body.scores || {};
    const responses = body.responses || [];

    const row = [
      new Date(),
      body.name || "",
      body.email || "",
      body.team || "",
      body.totalScore || 0,
      scores.capabilities || 0,
      scores.types || 0,
      scores.risk || 0,
      scores.data || 0,
      scores.tools || 0,
      JSON.stringify(responses)
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET for health checks and report data (JSON/JSONP)
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "report") {
    const sheet = SpreadsheetApp.getActive().getSheetByName("Responses");
    const data = [];
    if (sheet) {
      const values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), Math.min(sheet.getLastColumn(), 11)).getValues();
      values.forEach((row) => {
        if (!row[1] && !row[2]) return;
        const totalScore = Number(row[4]) || 0;
        const scores = {
          capabilities: Number(row[5]) || 0,
          types: Number(row[6]) || 0,
          risk: Number(row[7]) || 0,
          data: Number(row[8]) || 0,
          tools: Number(row[9]) || 0
        };
        let responses = [];
        try {
          responses = row[10] ? JSON.parse(row[10]) : [];
        } catch (err) {
          responses = [];
        }
        data.push({
          timestamp: row[0],
          name: row[1],
          email: row[2],
          team: row[3],
          totalScore,
          scores,
          responses
        });
      });
    }
    const payload = { status: "ok", results: data };
    const callback = e && e.parameter && e.parameter.callback;
    const output = callback ? `${callback}(${JSON.stringify(payload)})` : JSON.stringify(payload);
    const mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
    return ContentService.createTextOutput(output).setMimeType(mime);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ready" }))
    .setMimeType(ContentService.MimeType.JSON);
}
