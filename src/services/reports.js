// Attendance report for one module: build the data, then export it as CSV or PDF.
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { db } from '../firebase';
import { csvCell, htmlEscape, formatDate, formatTime } from '../utils';

/** sessions = the module's sessions already filtered to the chosen date range */
export async function buildReport(module, sessions) {
  const modSnap = await getDoc(doc(db, 'modules', module.moduleId));
  const ids = modSnap.exists() ? modSnap.data().enrolledStudentIds || [] : [];

  const students = await Promise.all(ids.map(async (uid) => {
    try {
      const u = await getDoc(doc(db, 'users', uid));
      const d = u.exists() ? u.data() : {};
      return { uid, idNumber: d.idNumber || '', fullName: d.fullName || 'Unknown' };
    } catch (e) { return { uid, idNumber: '', fullName: 'Unknown' }; }
  }));

  const attended = await Promise.all(sessions.map(async (s) => {
    const snap = await getDocs(collection(db, 'sessions', s.sessionId, 'attendance'));
    return new Set(snap.docs.map((d) => d.id));
  }));

  const total = sessions.length;
  const rows = students.map((st) => {
    const n = attended.filter((set) => set.has(st.uid)).length;
    return { ...st, attended: n, total, percent: total ? Math.floor((n * 100) / total) : 0 };
  }).sort((a, b) => a.idNumber.localeCompare(b.idNumber));

  const sessionRows = sessions.map((s, i) => ({
    date: s.date, start: s.startTime, end: s.endTime, present: attended[i].size, total: s.totalStudents,
  }));
  return { module, rows, sessionRows };
}

const header = (report, period) => ({
  title: `${report.module.name} (${report.module.code})`,
  period: `${formatDate(period.from)} to ${formatDate(period.to)}`,
  generated: `${formatDate(new Date())} ${formatTime(new Date())}`,
});

function buildCsv(report, period) {
  const h = header(report, period);
  const L = [];
  L.push(['Module', h.title].map(csvCell).join(','));
  L.push(['Period', h.period].map(csvCell).join(','));
  L.push(['Generated', h.generated].map(csvCell).join(','));
  L.push('');
  L.push(['Student ID', 'Name', 'Sessions Attended', 'Total Sessions', 'Attendance %'].map(csvCell).join(','));
  report.rows.forEach((r) => L.push([r.idNumber, r.fullName, r.attended, r.total, `${r.percent}%`].map(csvCell).join(',')));
  L.push('');
  L.push(['Session Date', 'Start', 'End', 'Present', 'Enrolled'].map(csvCell).join(','));
  report.sessionRows.forEach((s) => L.push([s.date, s.start, s.end, s.present, s.total].map(csvCell).join(',')));
  return '\uFEFF' + L.join('\r\n'); // BOM so Excel reads UTF-8 correctly
}

function buildHtml(report, period) {
  const h = header(report, period);
  const e = htmlEscape;
  const studentRows = report.rows.map((r) =>
    `<tr><td>${e(r.idNumber)}</td><td>${e(r.fullName)}</td><td>${r.attended}</td><td>${r.total}</td><td>${r.percent}%</td></tr>`).join('');
  const sessionRows = report.sessionRows.map((s) =>
    `<tr><td>${e(s.date)}</td><td>${e(s.start)}</td><td>${e(s.end)}</td><td>${s.present}</td><td>${s.total}</td></tr>`).join('');
  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:Helvetica,Arial,sans-serif;padding:24px;color:#1e293b}
    h1{color:#0369a1;margin-bottom:4px} h2{margin-top:28px;color:#0f172a}
    .meta{color:#64748b;font-size:13px;margin:2px 0}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
    th{background:#0f172a;color:#fff;text-align:left;padding:8px} td{padding:8px;border-bottom:1px solid #e2e8f0}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
    <h1>ScanQ Attendance Report</h1>
    <p class="meta"><b>Module:</b> ${e(h.title)}</p>
    <p class="meta"><b>Period:</b> ${e(h.period)}</p>
    <p class="meta"><b>Generated:</b> ${e(h.generated)}</p>
    <h2>Students</h2>
    <table><tr><th>Student ID</th><th>Name</th><th>Attended</th><th>Total</th><th>Attendance</th></tr>${studentRows || '<tr><td colspan="5">No students enrolled</td></tr>'}</table>
    <h2>Sessions</h2>
    <table><tr><th>Date</th><th>Start</th><th>End</th><th>Present</th><th>Enrolled</th></tr>${sessionRows || '<tr><td colspan="5">No sessions in this period</td></tr>'}</table>
  </body></html>`;
}

async function share(uri, mimeType, uti) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uri, { mimeType, UTI: uti, dialogTitle: 'Share attendance report' });
}

export async function exportCsv(report, period) {
  const safe = report.module.code.replace(/[^A-Za-z0-9]/g, '') || 'module';
  const file = new File(Paths.cache, `ScanQ_${safe}_attendance.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(buildCsv(report, period));
  await share(file.uri, 'text/csv', 'public.comma-separated-values-text');
}

export async function exportPdf(report, period) {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(report, period) });
  await share(uri, 'application/pdf', 'com.adobe.pdf');
}
