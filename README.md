# run-hack

## London Run League

A map-based running game for the hackathon. Explore London, pick a race course, and compete with friends on routes rated by difficulty and incline.

### Core loop

1. Browse race courses across London on the map.
2. Compare distance, difficulty, and incline ratings out of 10.
3. Invite friends or a team lead to join a race.
4. Complete the course and climb the leaderboard.

### Starter structure

- `src/index.html` — lightweight game UI shell
- `src/styles.css` — map, course cards, and invite panel styling
- `src/app.js` — sample course data, rendering, course selection, and invite flow
- `data/courses.json` — seed course catalogue for London routes

### Running locally

This starter is dependency-free. Open `src/index.html` in a browser, or serve the repository with any static file server.

### Next steps

- Replace the illustrated map with Mapbox or Google Maps tiles.
- Persist teams, invites, race progress, and leaderboards.
- Add GPS tracking and route completion checks.
- Import elevation data to calculate the incline rating automatically.
