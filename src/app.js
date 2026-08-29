let courses = [];
let selectedCourse;
const list = document.querySelector('#course-list');

function rating(label, value) { return `<span class="rating">${label} <strong>${value}/10</strong></span>`; }

function altitudeProfile(course) {
  const base = course.baseElevationM || 20;
  const gain = Math.round(course.distanceKm * course.incline * 1.7);
  const points = Array.from({ length: 10 }, (_, i) => Math.round(base + (gain * i / 9) + Math.sin(i * 1.7 + course.difficulty) * (course.incline * 1.8)));
  points[0] = base; points[points.length - 1] = Math.round(base + gain * .72);
  return { points, gain, high: Math.max(...points) };
}

function renderElevation(course) {
  const profile = altitudeProfile(course);
  const min = Math.min(...profile.points) - 5;
  const max = Math.max(...profile.points) + 5;
  const coords = profile.points.map((value, index) => `${index * 55 + 5},${138 - ((value - min) / (max - min)) * 112}`).join(' ');
  document.querySelector('#elevation-name').textContent = course.name;
  document.querySelector('#elevation-gain').textContent = `+${profile.gain} m gain`;
  document.querySelector('#elevation-high').textContent = `${profile.high} m high`;
  document.querySelector('#elevation-chart').innerHTML = `<defs><linearGradient id="elevation-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f36a" stop-opacity=".65"/><stop offset="1" stop-color="#d4f36a" stop-opacity="0"/></linearGradient></defs><polyline points="${coords} 500,145 5,145" class="elevation-fill"/><polyline points="${coords}" class="elevation-line"/>${profile.points.map((value,index) => `<circle cx="${index * 55 + 5}" cy="${138 - ((value - min) / (max - min)) * 112}" r="3" class="elevation-point"><title>${value}m</title></circle>`).join('')}`;
}

function renderCourses() {
  list.innerHTML = courses.map((course) => `<article class="course-card ${course.id === selectedCourse.id ? 'selected' : ''}" data-course="${course.id}" tabindex="0"><div class="course-top"><div><div class="course-name">${course.name}</div><div class="course-area">${course.area} · ${course.terrain}</div></div><strong>${course.distanceKm} km</strong></div><div class="course-meta">${rating('DIFFICULTY', course.difficulty)} ${rating('INCLINE', course.incline)}</div></article>`).join('');
  document.querySelector('#course-count').textContent = String(courses.length).padStart(2, '0');
  document.querySelectorAll('.course-card').forEach((card) => { const choose = () => { selectedCourse = courses.find((course) => course.id === card.dataset.course); renderCourses(); renderElevation(selectedCourse); }; card.addEventListener('click', choose); card.addEventListener('keydown', (event) => { if (event.key === 'Enter') choose(); }); });
}

document.querySelector('#invite-button').addEventListener('click', () => { const input = document.querySelector('#invite-input'); const status = document.querySelector('#invite-status'); if (!input.value || !input.value.includes('@')) { status.textContent = 'Enter a valid email to send an invite.'; return; } status.textContent = `Invite ready for ${input.value} — ${selectedCourse.name} selected.`; input.value = ''; });

fetch('../data/courses.json').then((response) => response.json()).then((data) => { courses = data; selectedCourse = courses[0]; renderCourses(); renderElevation(selectedCourse); }).catch(() => { list.innerHTML = '<p class="load-error">Course data could not be loaded. Serve the repository over HTTP.</p>'; });
