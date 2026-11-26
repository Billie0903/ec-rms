import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Pagination } from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { formatDate } from '../../utils/labels.js';
import { ROLE_LABELS, errorMessage } from '../../utils/messages.js';

const ACTIONS = {
  'auth.': 'Đăng nhập / kích hoạt', 'resident.': 'Hồ sơ người cao tuổi', 'relative.': 'Liên kết người thân', 'user.': 'Tài khoản',
  'medication.': 'Thuốc', 'vitals.': 'Chỉ số sức khỏe', 'care_note.': 'Ghi chú chăm sóc', 'schedule.': 'Lịch',
  'allergy.': 'Dị ứng', 'condition.': 'Bệnh lý',
};

const ACTION_LABELS = {
  'auth.login': 'Đăng nhập', 'auth.activate': 'Kích hoạt tài khoản',
  'resident.create': 'Thêm hồ sơ', 'resident.update': 'Sửa hồ sơ', 'resident.archive': 'Lưu trữ hồ sơ', 'resident.restore': 'Khôi phục hồ sơ',
  'resident.archive_request': 'Yêu cầu lưu trữ', 'resident.archive_reject': 'Từ chối lưu trữ',
  'user.create': 'Tạo tài khoản', 'user.update': 'Sửa tài khoản', 'user.promote_admin': 'Cấp quyền Quản trị', 'user.role_change': 'Đổi vai trò',
  'user.disable': 'Khóa tài khoản', 'user.enable': 'Mở khóa tài khoản', 'user.resend_invite': 'Gửi lại link kích hoạt',
  'relative.link': 'Liên kết người thân', 'relative.unlink': 'Hủy liên kết', 'relative.relink': 'Liên kết lại', 'relative.update': 'Đổi quyền xem',
};
const label = (a) => ACTION_LABELS[a] || a;
const ENTITY = { user: 'Tài khoản', resident: 'Hồ sơ', deletion_request: 'Yêu cầu lưu trữ', resident_relative: 'Liên kết' };

export default function AuditPage() {
  const [filters, setFilters] = useState({ action: '', from: '', to: '', page: 1 });
  const { data, loading, error, reload } = useFetch(() => adminApi.listAudit({ ...filters, pageSize: 20 }), [filters.action, filters.from, filters.to, filters.page]);
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: 1 }));

  return (
    <section>
      <h1>Nhật ký hoạt động</h1>
      <div className="toolbar card">
        <select className="input" aria-label="Loại hoạt động" value={filters.action} onChange={set('action')}>
          <option value="">Mọi hoạt động</option>
          {Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="inline-label">Từ <input type="date" className="input" value={filters.from} onChange={set('from')} /></label>
        <label className="inline-label">Đến <input type="date" className="input" value={filters.to} onChange={set('to')} /></label>
      </div>

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.data.length === 0 ? (
        <EmptyState title="Không có hoạt động nào" />
      ) : (
        <>
          <table className="table responsive-table">
            <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hoạt động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
            <tbody>
              {data.data.map((a) => (
                <tr key={a.id}>
                  <td data-label="Thời gian">{formatDate(a.createdAt, true)}</td>
                  <td data-label="Người thực hiện">{a.actorName || '—'}{a.actorRole && <div className="muted small">{ROLE_LABELS[a.actorRole]}</div>}</td>
                  <td data-label="Hoạt động">{label(a.action)}</td>
                  <td data-label="Đối tượng">{ENTITY[a.entityType] || a.entityType} #{a.entityId ?? '—'}</td>
                  <td data-label="Chi tiết" className="small">{describe(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      )}
    </section>
  );
}

function describe(a) {
  const before = a.beforeData ? (typeof a.beforeData === 'string' ? JSON.parse(a.beforeData) : a.beforeData) : null;
  const after = a.afterData ? (typeof a.afterData === 'string' ? JSON.parse(a.afterData) : a.afterData) : null;
  if (!after) return '—';
  return Object.keys(after).map((k) => (before && k in before ? `${k}: ${before[k]} → ${after[k]}` : `${k}: ${after[k]}`)).join('; ');
}
