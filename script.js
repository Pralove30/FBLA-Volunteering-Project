const STORAGE_KEY = 'goodhours-activities-v1';

const organizations = [
	{
		name: 'Nonprofit organizations',
		symbol: '♡',
		description: 'Mission-led groups often need hands-on help, event support, mentoring, and skills shared by volunteers.',
		details: 'Nonprofits work toward a public or community benefit. Volunteers can support their programs in many ways, from preparing supplies and helping at events to sharing professional skills. The organization decides what roles are appropriate, how volunteers are trained, and whether hours can be officially confirmed.',
		examples: 'Program support, event setup, tutoring, donation sorting'
	},
	{
		name: 'Local businesses',
		symbol: '⌂',
		description: 'Independent businesses can use a neighbor’s time and talent to strengthen the places we share.',
		details: 'Small and independent businesses are part of a neighborhood’s day-to-day life. When a business organizes a community project or partners with a local cause, volunteers may help with a cleanup, a public event, or other clearly defined community work. Ask the business what support is welcome before getting started.',
		examples: 'Community events, neighborhood cleanups, local drives'
	},
	{
		name: 'Community groups',
		symbol: '✳',
		description: 'Clubs, mutual-aid networks, and neighborhood groups bring people together around shared needs.',
		details: 'Community groups are often organized by the people closest to a local need. Volunteers may help distribute resources, coordinate gatherings, or make a shared space more welcoming. Listen first, follow the group’s safety guidance, and check with its organizer about recording or verifying your contribution.',
		examples: 'Mutual aid, neighborhood projects, community gatherings'
	}
];

const views = ['overview', 'log', 'organizations', 'guide'];
const viewLabels = { overview: 'Overview', log: 'Log hours', organizations: 'Who we help', guide: 'How it works' };
let toastTimer;
let isSignUp = false;

function loadActivities() {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
		return Array.isArray(saved) ? saved : [];
	} catch {
		return [];
	}
}

let activities = loadActivities();

function showToast(message) {
	const toast = document.querySelector('#toast');
	toast.textContent = message;
	toast.classList.add('is-visible');
	window.clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function setView(name) {
	if (!views.includes(name)) return;
	document.querySelectorAll('.view').forEach((view) => {
		const active = view.id === `view-${name}`;
		view.hidden = !active;
		view.classList.toggle('is-visible', active);
	});
	document.querySelectorAll('.nav-item').forEach((item) => {
		const active = item.dataset.view === name;
		item.classList.toggle('is-active', active);
		if (active) item.setAttribute('aria-current', 'page');
		else item.removeAttribute('aria-current');
	});
	document.querySelector('#current-section').textContent = viewLabels[name];
	if (name === 'log') document.querySelector('#activity-name').focus({ preventScroll: true });
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderActivities() {
	const total = activities.reduce((sum, activity) => sum + Number(activity.hours), 0);
	document.querySelector('#total-hours').innerHTML = `${Number.isInteger(total) ? total : total.toFixed(2).replace(/0$/, '')}<span> hrs</span>`;
	document.querySelector('#activity-count').textContent = activities.length;
	document.querySelector('#pending-count').textContent = activities.length;
	const list = document.querySelector('#activity-list');
	if (!activities.length) {
		list.innerHTML = '<div class="empty-state"><span class="empty-icon">↗</span><div><strong>Your story starts here</strong><p>Log your first volunteer shift to see it here.</p></div><button class="text-button" data-view="log">Add hours →</button></div>';
		return;
	}
	list.innerHTML = [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((activity) => {
		const date = new Date(`${activity.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
		return `<article class="activity-row"><span class="activity-icon" aria-hidden="true">↗</span><div><div class="activity-name" title="${escapeHtml(activity.name)}">${escapeHtml(activity.name)}</div><div class="activity-meta">${date} · Saved on this device</div></div><span class="activity-hours">${formatHours(activity.hours)} hrs</span></article>`;
	}).join('');
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function formatHours(hours) {
	return Number.isInteger(Number(hours)) ? String(Number(hours)) : String(Number(hours));
}

function localDateStamp(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function renderOrganizations() {
	document.querySelector('#organization-grid').innerHTML = organizations.map((organization, index) => `
		<article class="organization-card">
			<span class="organization-icon" aria-hidden="true">${organization.symbol}</span>
			<h2>${organization.name}</h2>
			<p>${organization.description}</p>
			<button class="text-button" data-organization="${index}">See how we help →</button>
		</article>`).join('');
}

function openAuth() {
	const modal = document.querySelector('#auth-modal');
	modal.hidden = false;
	document.querySelector('#auth-email').focus();
}

function closeAuth() {
	document.querySelector('#auth-modal').hidden = true;
}

function updateAuthMode() {
	document.querySelector('#auth-title').textContent = isSignUp ? 'Join GoodHours.' : 'Welcome back.';
	document.querySelector('#auth-description').textContent = isSignUp ? 'Create an account to keep your volunteer journey going.' : 'Sign in to keep your volunteer journey going.';
	document.querySelector('#auth-submit').innerHTML = `${isSignUp ? 'Create account' : 'Sign in'} <span aria-hidden="true">↗</span>`;
	document.querySelector('#auth-toggle-prompt').textContent = isSignUp ? 'Already have an account?' : 'New to GoodHours?';
	document.querySelector('#auth-toggle').textContent = isSignUp ? 'Sign in' : 'Create an account';
}

document.addEventListener('click', (event) => {
	const viewButton = event.target.closest('[data-view]');
	if (viewButton) setView(viewButton.dataset.view);

	if (event.target.closest('[data-open-auth]')) openAuth();
	if (event.target.closest('.modal-close')) closeAuth();
	if (event.target.id === 'auth-modal') closeAuth();
	if (event.target.closest('#auth-toggle')) {
		isSignUp = !isSignUp;
		updateAuthMode();
	}
	if (event.target.closest('#google-signin')) showToast('Google sign-in is a demo button. Connect an authentication provider to enable accounts.');

	const organizationButton = event.target.closest('[data-organization]');
	if (organizationButton) {
		const organization = organizations[Number(organizationButton.dataset.organization)];
		const dialog = document.createElement('div');
		dialog.className = 'modal-backdrop';
		dialog.setAttribute('role', 'presentation');
		dialog.innerHTML = `<section class="auth-dialog organization-dialog" role="dialog" aria-modal="true" aria-labelledby="organization-dialog-title"><button class="modal-close" aria-label="Close details">×</button><span class="organization-icon" aria-hidden="true">${organization.symbol}</span><p class="eyebrow">WHO WE HELP</p><h2 id="organization-dialog-title">${organization.name}</h2><p class="auth-description">${organization.details}</p><p class="eyebrow">WAYS TO CONTRIBUTE</p><p class="auth-description">${organization.examples}</p><button class="button button-coral" data-view="log">Log your hours <span aria-hidden="true">↗</span></button></section>`;
		document.body.append(dialog);
		dialog.addEventListener('click', (modalEvent) => {
			if (modalEvent.target === dialog || modalEvent.target.closest('.modal-close') || modalEvent.target.closest('[data-view]')) dialog.remove();
		});
	}
});

document.querySelector('#hours-form').addEventListener('submit', (event) => {
	event.preventDefault();
	const form = event.currentTarget;
	const data = new FormData(form);
	const activity = {
		id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
		name: data.get('activity').trim(),
		date: data.get('date'),
		hours: Number(data.get('hours')),
		notes: data.get('notes').trim()
	};
	if (!form.reportValidity() || !activity.name || !activity.date || activity.hours <= 0 || activity.hours > 24) {
		showToast('Enter an activity, date, and a number of hours from 0.25 to 24.');
		return;
	}
	activities.push(activity);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
	renderActivities();
	form.reset();
	document.querySelector('#activity-date').value = localDateStamp();
	showToast('Your volunteer activity has been saved on this device.');
	setView('overview');
});

document.querySelector('#auth-form').addEventListener('submit', (event) => {
	event.preventDefault();
	showToast('This is a front-end demo. Connect an authentication service to enable accounts.');
	closeAuth();
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		closeAuth();
		document.querySelectorAll('.organization-dialog').forEach((dialog) => dialog.closest('.modal-backdrop')?.remove());
	}
});

const now = new Date();
document.querySelector('#today-label').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
document.querySelector('#activity-date').value = localDateStamp(now);
renderOrganizations();
renderActivities();
