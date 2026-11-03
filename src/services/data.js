// All Firestore reads that were duplicated across Android activities live here.
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { tsMillis } from '../utils';

/**
 * Attendance aggregation (StudentDashboardActivity / StudentModulesActivity):
 * modules the student is enrolled in + attendance % for each
 * (sessions of the module that have an attendance doc for this student).
 */
export async function fetchStudentModules(uid) {
  const snap = await getDocs(query(collection(db, 'modules'), where('enrolledStudentIds', 'array-contains', uid)));
  const modules = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      let pct = 0;
      try {
        const sessions = await getDocs(query(collection(db, 'sessions'), where('moduleId', '==', d.id)));
        const total = sessions.size;
        if (total > 0) {
          const checks = await Promise.all(
            sessions.docs.map((sd) => getDoc(doc(db, 'sessions', sd.id, 'attendance', uid)).catch(() => null))
          );
          const attended = checks.filter((c) => c && c.exists()).length;
          pct = Math.floor((attended / total) * 100);
        }
      } catch (e) { /* network error -> 0% like the Android app */ }
      return {
        moduleId: d.id, code: data.code || '', name: data.name || '',
        tutorId: data.tutorId || '', attendancePercent: pct,
      };
    })
  );
  return modules.sort((a, b) => a.code.localeCompare(b.code));
}

/** StudentAttendanceActivity: one row per session of every enrolled module. */
export async function fetchStudentHistory(uid) {
  const mods = await getDocs(query(collection(db, 'modules'), where('enrolledStudentIds', 'array-contains', uid)));
  const perModule = await Promise.all(
    mods.docs.map(async (m) => {
      const moduleName = m.data().name || '';
      const sessions = await getDocs(query(collection(db, 'sessions'), where('moduleId', '==', m.id)));
      return Promise.all(
        sessions.docs.map(async (sd) => {
          const s = sd.data();
          const att = await getDoc(doc(db, 'sessions', sd.id, 'attendance', uid));
          return {
            sessionId: sd.id, moduleName,
            date: s.date || '', startTime: s.startTime || '', endTime: s.endTime || '',
            isPresent: att.exists(), createdAt: tsMillis(s.createdAt),
          };
        })
      );
    })
  );
  return perModule.flat().sort((a, b) => b.createdAt - a.createdAt);
}

/** Tutor: every session the tutor created, newest first. */
export async function fetchTutorSessions(uid) {
  const snap = await getDocs(query(collection(db, 'sessions'), where('tutorId', '==', uid)));
  return snap.docs
    .map((d) => {
      const s = d.data();
      return {
        sessionId: d.id, moduleId: s.moduleId || '', moduleName: s.moduleName || '',
        date: s.date || '', startTime: s.startTime || '', endTime: s.endTime || '',
        totalStudents: s.totalStudents || 0, presentCount: s.presentCount || 0,
        createdAt: tsMillis(s.createdAt),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
