import { useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { residentsApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { Badge } from '../../components/Badge.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { FALL_RISK, ROOM_SORT_LABELS, STATUS, formatDate, options } from '../../utils/labels.js';
import { errorMessage } from '../../utils/messages.js';

const DEFAULTS = { q: '', status: '', fallRisk: '', sort: 'name', order: 'asc', page: '1' };

export default function ResidentsPage() {
  const navigate = useNavigate();
  // Filters live in the URL so they survive refresh and the back button.
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) ?? DEFAULTS[k];
  const q = get('q');
  const debouncedQ = useDebounce(q);

  const query = { q: debouncedQ, status: get('status'), fallRisk: get('fallRisk'), sort: get('sort'), order: get('order'), page: get('page') };
  const { data, loading, error, reload } = useFetch(
    () => residentsApi.list(query),
    [debouncedQ, query.status, query.fallRisk, query.sort, query.order, query.page],
  );

  const setParam = useCallback((key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === DEFAULTS[key]) next.delete(key); else next.set(key, value);
      if (key !== 'page') next.delete('page'); // new filter → back to page 1
      return next;
    }, { replace: true });
  }, [setParams]);

  const hasFilters = q || get('status') || get('fallRisk');
  const rows = data?.data ?? [];

  return (
    <section>
      <div className="page-header">
        <h1>Người cao tuổi</h1>
        <Link to="/residents/new" className="btn btn-primary">+ Thêm người cao tuổi</Link>
      </div>

      <div className="toolbar card">
        <input className="input search" type="search" placeholder="Tìm theo tên, mã hoặc phòng…" aria-label="Tìm kiếm"
          value={q} onChange={(e) => setParam('q', e.target.value)} />
        <select className="input" aria-label="Lọc theo tình trạng" value={get('status')} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Tất cả (trừ lưu trữ)</option>
          {options(STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          <option value="all">Tất cả, kể cả lưu trữ</option>
        </select>
        <select className="input" aria-label="Lọc theo nguy cơ té ngã" value={get('fallRisk')} onChange={(e) => setParam('fallRisk', e.target.value)}>
          <option value="">Mọi nguy cơ té ngã</option>
          {options(FALL_RISK).map((o) => <option key={o.value} value={o.value}>Nguy cơ {o.label.toLowerCase()}</option>)}
        </select>
        <select className="input" aria-label="Sắp xếp" value={`${get('sort')}:${get('order')}`}
          onChange={(e) => { const [s, o] = e.target.value.split(':'); setParams((p) => { const n = new URLSearchParams(p); n.set('sort', s); n.set('order', o); n.delete('page'); return n; }, { replace: true }); }}>
          {Object.entries(ROOM_SORT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {hasFilters && <button className="btn btn-link" onClick={() => setParams({}, { replace: true })}>Xóa bộ lọc</button>}
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : rows.length === 0 ? (
        hasFilters
          ? <EmptyState title="Không tìm thấy kết quả" message="Thử từ khóa hoặc bộ lọc khác." />
          : <EmptyState title="Chưa có người cao tuổi nào" message="Thêm hồ sơ đầu tiên để bắt đầu."
              action={<Link to="/residents/new" className="btn btn-primary">+ Thêm người cao tuổi</Link>} />
      ) : (
        <div className={loading ? 'is-refreshing' : undefined}>
          <table className="table responsive-table">
            <thead>
              <tr><th>Mã</th><th>Họ tên</th><th>Tuổi</th><th>Phòng</th><th>Ngày nhập viện</th><th>Nguy cơ té ngã</th><th>Tình trạng</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="clickable" tabIndex={0}
                  onClick={() => navigate(`/residents/${r.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/residents/${r.id}`)}>
                  <td data-label="Mã">{r.residentCode}</td>
                  <td data-label="Họ tên"><strong>{r.fullName}</strong></td>
                  <td data-label="Tuổi">{r.age}</td>
                  <td data-label="Phòng">{r.room || '—'}</td>
                  <td data-label="Ngày nhập viện">{formatDate(r.admissionDate)}</td>
                  <td data-label="Nguy cơ té ngã"><Badge value={r.fallRisk} label={FALL_RISK[r.fallRisk]} /></td>
                  <td data-label="Tình trạng"><Badge value={r.status} label={STATUS[r.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total}
            onChange={(p) => setParam('page', String(p))} />
        </div>
      )}
    </section>
  );
}
