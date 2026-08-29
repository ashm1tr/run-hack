const courses = [
  { id: 'regents-park-loop', name: "Regent's Park Loop", area: 'Regent’s Park', distanceKm: 5.2, difficulty: 4, incline: 3, terrain: 'Park paths' },
  { id: 'primrose-hill-climb', name: 'Primrose Hill Climb', area: 'Camden', distanceKm: 6.8, difficulty: 7, incline: 8, terrain: 'Mixed streets' },
  { id: 'thames-sprint', name: 'Thames Riverside Sprint', area: 'South Bank', distanceKm: 10, difficulty: 6, incline: 2, terrain: 'Riverside path' },
];

let selectedCourse = courses[0];
const list = document.querySelector('#course-list');

function rating(label, value) {
  return `<span class="rating">${label} <strong>${value}/10</strong></span>`;
}

function renderCourses() {
  list.innerHTML = courses.map((course) => `
    <article class="course-card ${course.id === selectedCourse.id ? 'selected' : ''}" data-course="${course.id}" tabindex="0">
      <div class="course-top"><div><div class="course-name">${course.name}</div><div class="course-area">${course.area} · ${course.terrain}</div></div><strong>${course.distanceKm} km</strong></div>
      <div class="course-meta">${rating('DIFFICULTY', course.difficulty)} ${rating('INCLINE', course.incline)}</div>
    </article>
  `).join('');

  document.querySelectorAll('.course-card').forEach((card) => {
    card.addEventListener('click', () => { selectedCourse = courses.find((course) => course.id === card.dataset.course); renderCourses(); });
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter') card.click(); });
  });
}

document.querySelector('#invite-button').addEventListener('click', () => {
  const input = document.querySelector('#invite-input');
  const status = document.querySelector('#invite-status');
  if (!input.value || !input.value.includes('@')) { status.textContent = 'Enter a valid email to send an invite.'; return; }
  status.textContent = `Invite ready for ${input.value} — ${selectedCourse.name} selected.`;
  input.value = '';
});

renderCourses();
