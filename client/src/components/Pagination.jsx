export function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return <p className="muted small">{total} kết quả</p>;
  return (
    <nav className="pagination" aria-label="Phân trang">
      <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Trước</button>
      <span>Trang {page} / {totalPages} · {total} kết quả</span>
      <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Sau ›</button>
    </nav>
  );
}
