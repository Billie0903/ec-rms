const TONES = {
  active: 'green', hospital: 'amber', discharged: 'gray', deceased: 'gray', archived: 'gray',
  low: 'green', medium: 'amber', high: 'red',
  mild: 'gray', moderate: 'amber', severe: 'red',
  pending: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray',
};

export function Badge({ value, label }) {
  return <span className={`pill pill-${TONES[value] || 'gray'}`}>{label}</span>;
}
