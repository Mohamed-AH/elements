// Institution dashboard (#/admin): roster management + progress analytics.
// Server-gated: /api/me must report admin (ADMIN_EMAILS on the server).
// Metrics reuse the same badge/journey logic the kids see.

import { loadData } from './data.js';
import { badges } from './progress.js';
import { icon } from './icons.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

const DAY = 86400_000;

function fmtWhen(ts) {
  if (!ts) return 'never';
  const days = Math.floor((Date.now() - ts) / DAY);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(ts).toLocaleDateString();
}

export async function adminView(viewEl) {
  viewEl.innerHTML = '<p class="muted">Loading dashboard…</p>';

  let user = null;
  try {
    user = (await fetch('/api/me', { credentials: 'same-origin' }).then((r) => r.json())).user;
  } catch { /* static hosting / offline */ }

  if (!user || !user.admin) {
    viewEl.innerHTML = `
      <div class="card" style="max-width:560px">
        <h3>${icon('lock')} Institution dashboard</h3>
        <p>${user
          ? 'This account isn\'t an institution admin. Admins are set with the <code>ADMIN_EMAILS</code> environment variable on the server.'
          : 'Sign in (top right) with an institution admin account to open the dashboard. This feature needs the app to be running on its companion server — see docs/DEPLOY.md.'}</p>
      </div>`;
    return;
  }

  const data = await loadData();
  const total118 = data.featuredNumbers.length;

  async function refresh() {
    let students;
    try {
      students = (await fetch('/api/admin/students', { credentials: 'same-origin' }).then((r) => r.json())).students;
    } catch {
      viewEl.innerHTML = '<div class="card"><h3>Error</h3><p>Couldn\'t load students. Check the server connection.</p></div>';
      return;
    }

    const withProgress = students.filter((s) => s.progress);
    const active7 = students.filter((s) => s.lastActive && Date.now() - s.lastActive < 7 * DAY).length;
    const avgMet = withProgress.length
      ? Math.round(withProgress.reduce((sum, s) => sum + (s.progress.visited?.length || 0), 0) / withProgress.length)
      : 0;
    const badgeCount = (p) => badges(data.featuredNumbers, p).filter((b) => b.earned).length;
    const totalBadges = withProgress.reduce((sum, s) => sum + badgeCount(s.progress), 0);

    const stat = (label, value, note) => `
      <div class="stat-card">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        ${note ? `<div class="stat-note">${note}</div>` : ''}
      </div>`;

    const rows = students
      .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
      .map((s) => {
        const met = s.progress?.visited?.length || 0;
        const earned = s.progress ? badgeCount(s.progress) : 0;
        const solved = s.progress?.solved?.length || 0;
        const streak = s.progress?.heavierBest || 0;
        return `
        <tr>
          <td><strong>${esc(s.name || s.email)}</strong><br><span class="muted">${esc(s.email)}</span></td>
          <td>
            <div class="cell-metric">${met} / 118</div>
            <div class="bar mini"><span style="width:${Math.max(2, (met / 118) * 100)}%"></span></div>
          </td>
          <td class="cell-metric">${earned} / 8</td>
          <td class="cell-metric">${solved} solved · streak ${streak}</td>
          <td>${fmtWhen(s.lastActive)}</td>
          <td><button class="chip-btn subtle remove-btn" data-email="${esc(s.email)}">Remove</button></td>
        </tr>`;
      }).join('');

    viewEl.innerHTML = `
      <div class="admin-stats">
        ${stat('Students on roster', students.length)}
        ${stat('Active this week', active7, students.length ? `${Math.round((active7 / students.length) * 100)}% of roster` : '')}
        ${stat('Avg. elements met', `${avgMet} / ${total118}`, withProgress.length ? `across ${withProgress.length} synced student${withProgress.length === 1 ? '' : 's'}` : 'no synced students yet')}
        ${stat('Badges earned', totalBadges, 'all students combined')}
      </div>

      <div class="card">
        <h3>${icon('rocket')} Add a student</h3>
        <p class="muted" style="margin-bottom:10px">Add the Google account email your institution issued to the student.
        Their progress links up automatically the first time they sign in.</p>
        <form class="admin-form" id="add-form">
          <input type="text" id="add-name" placeholder="Name (optional)" maxlength="80">
          <input type="email" id="add-email" placeholder="student@school.org" required>
          <button class="big-btn" type="submit">Add student</button>
        </form>
        <p class="muted" id="add-msg" style="min-height:1.2em"></p>
      </div>

      <div class="card">
        <h3>${icon('gauge')} Student progress</h3>
        ${students.length ? `
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Student</th><th>Elements met</th><th>Badges</th><th>Detective &amp; games</th><th>Last active</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>` : '<p class="muted">No students yet — add the first one above.</p>'}
      </div>

      <p class="muted">Students not yet signed in show "never" for activity. A student's progress
      stays on their own device too — signing in only adds a synced copy.</p>
    `;

    viewEl.querySelector('#add-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = viewEl.querySelector('#add-email').value.trim();
      const name = viewEl.querySelector('#add-name').value.trim();
      const msg = viewEl.querySelector('#add-msg');
      try {
        const res = await fetch('/api/admin/students', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name })
        });
        if (!res.ok) throw new Error((await res.json()).error || res.status);
        await refresh();
      } catch (err) {
        msg.textContent = `Couldn't add: ${err.message}`;
      }
    });

    viewEl.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Remove ${btn.dataset.email} from the roster? Their own progress is not deleted.`)) return;
        await fetch(`/api/admin/students?email=${encodeURIComponent(btn.dataset.email)}`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });
        await refresh();
      });
    });
  }

  await refresh();
}
