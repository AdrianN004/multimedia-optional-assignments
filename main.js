let allAlbums = [];

document.addEventListener('DOMContentLoaded', () => {
    // Fetch data
    fetch('assets/data/library.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allAlbums = data;
            renderAlbums(allAlbums);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            const container = document.getElementById('album-container');
            container.innerHTML = `
                <div class="col-12 text-center text-danger">
                    <h3>Error loading albums</h3>
                    <p>${error.message}</p>
                    <p class="small text-muted">If you are opening this file directly, try using a local server (ex: Live Server extension).</p>
                </div>
            `;
        });

    // Search listener
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allAlbums.filter(album =>
            album.artist.toLowerCase().includes(term) ||
            album.album.toLowerCase().includes(term)
        );
        renderAlbums(filtered);
    });

    // Event Delegation for "View Tracklist" buttons
    document.getElementById('album-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('view-tracklist-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            openModal(id);
        }
    });

    // Back to Top Button Logic
    const backToTopBtn = document.getElementById('backToTopBtn');

    window.onscroll = function () {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    backToTopBtn.addEventListener('click', () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });
});

// Render cards
function renderAlbums(albums) {
    const container = document.getElementById('album-container');
    container.innerHTML = '';

    if (albums.length === 0) {
        container.innerHTML = '<div class="col-12 text-center">No albums found.</div>';
        return;
    }

    albums.forEach(album => {
        const card = document.createElement('div');
        card.className = 'col-xl-2 col-md-3 col-sm-6 col-12 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <img src="assets/img/${album.thumbnail}" class="card-img-top" alt="${album.album} cover">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-truncate" title="${album.artist}">${album.artist}</h5>
                    <p class="card-text text-truncate" title="${album.album}">${album.album}</p>
                    <div class="mt-auto"></div> <!-- Spacer to push footer down -->
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <button class="btn btn-primary w-100 view-tracklist-btn" data-id="${album.id}">
                        View Tracklist
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Open Modal
function openModal(id) {
    const album = allAlbums.find(a => a.id === id);
    if (!album) return;

    // Set Title
    document.getElementById('albumModalLabel').textContent = `${album.artist} - ${album.album}`;

    // Calculate Stats
    const stats = calculateStats(album.tracklist);

    // Render Stats
    const statsContainer = document.getElementById('albumStats');
    statsContainer.innerHTML = `
        <div class="row text-center">
            <div class="col-md-3 col-6 mb-2"><strong>Tracks:</strong><br>${stats.count}</div>
            <div class="col-md-3 col-6 mb-2"><strong>Duration:</strong><br>${stats.totalDuration}</div>
            <div class="col-md-3 col-6 mb-2"><strong>Avg Length:</strong><br>${stats.avgDuration}</div>
            <div class="col-md-3 col-6 mb-2"><strong>Extremes:</strong><br>
                <small title="Longest">L: ${stats.longest}</small><br>
                <small title="Shortest">S: ${stats.shortest}</small>
            </div>
        </div>
    `;

    // Render Tracklist
    const tracklistContainer = document.getElementById('tracklistContainer');
    let tableHtml = `
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th class="text-end">Length</th>
                </tr>
            </thead>
            <tbody>
    `;

    album.tracklist.forEach(track => {
        tableHtml += `
            <tr>
                <td>${track.number}</td>
                <td><a href="${track.url}" target="_blank" class="spotify-link">${track.title}</a></td>
                <td class="text-end">${track.trackLength}</td>
            </tr>
        `;
    });

    tableHtml += '</tbody></table>';
    tracklistContainer.innerHTML = tableHtml;

    // Update Play Button
    const playBtn = document.getElementById('playOnSpotifyBtn');
    if (album.tracklist.length > 0) {
        playBtn.href = album.tracklist[0].url;
        playBtn.classList.remove('disabled');
    } else {
        playBtn.href = '#';
        playBtn.classList.add('disabled');
    }

    // Show Modal
    const modal = new bootstrap.Modal(document.getElementById('albumModal'));
    modal.show();
}

// Sort
function sortAlbums(criteria) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (criteria === 'artist') {
        allAlbums.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (criteria === 'album') {
        allAlbums.sort((a, b) => a.album.localeCompare(b.album));
    } else if (criteria === 'tracks') {
        allAlbums.sort((a, b) => a.tracklist.length - b.tracklist.length);
    }

    const filtered = allAlbums.filter(album =>
        album.artist.toLowerCase().includes(searchTerm) ||
        album.album.toLowerCase().includes(searchTerm)
    );

    renderAlbums(filtered);
}

// Calculate Stats
function calculateStats(tracklist) {
    if (!tracklist || tracklist.length === 0) return { count: 0, totalDuration: '0:00', avgDuration: '0:00', longest: '-', shortest: '-' };

    let totalSeconds = 0;
    let maxSeconds = -1;
    let minSeconds = Infinity;
    let longestTrack = '';
    let shortestTrack = '';

    tracklist.forEach(track => {
        const parts = track.trackLength.split(':');
        const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        totalSeconds += seconds;

        if (seconds > maxSeconds) {
            maxSeconds = seconds;
            longestTrack = track.title;
        }
        if (seconds < minSeconds) {
            minSeconds = seconds;
            shortestTrack = track.title;
        }
    });

    const avgSeconds = Math.round(totalSeconds / tracklist.length);

    return {
        count: tracklist.length,
        totalDuration: formatTime(totalSeconds),
        avgDuration: formatTime(avgSeconds),
        longest: longestTrack,
        shortest: shortestTrack
    };
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
