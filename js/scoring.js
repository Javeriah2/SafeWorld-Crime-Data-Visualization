// js/scoring.js

export function rankBoroughs(boroughs) {
  const sorted = [...boroughs].sort((a, b) => a.crimeCount - b.crimeCount);
  return sorted.map((borough, index) => {
    const rank = index + 1;
    const score = Math.ceil((rank / sorted.length) * 10);
    return { ...borough, rank, score };
  });
}

export function scoreToColour(score) {
  const palette = {
    1:  '#2ecc71',
    2:  '#5dbd5d',
    3:  '#a8d44a',
    4:  '#c8d44a',
    5:  '#f1c40f',
    6:  '#f39c12',
    7:  '#e67e22',
    8:  '#d35400',
    9:  '#e74c3c',
    10: '#c0392b',
  };
  return palette[score] ?? '#cccccc';
}
