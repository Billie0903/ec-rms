import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { residentsApi } from '../../api/residents.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Badge } from '../../components/Badge.jsx';
import { ReasonDialog } from '../../components/ReasonDialog.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { FALL_RISK, GENDER, MOBILITY, STATUS, formatDate } from '../../utils/labels.js';
import { errorMessage } from '../../utils/messages.js';
import HealthTab from './HealthTab.jsx';
import MedicationsTab from './MedicationsTab.jsx';
import VitalsTab from './VitalsTab.jsx';
import CareNotesTab from './CareNotesTab.jsx';
import ScheduleTab from './ScheduleTab.jsx';

const TABS = [
  { key: 'profile', label: 'Hồ sơ' },
  { key: 'health', label: 'Dị ứng & bệnh lý' },
  { key: 'medications', label: 'Thuốc' },
  { key: 'vitals', label: 'Chỉ số sức khỏe' },
  { key: 'notes', label: 'Ghi chú chăm sóc' },
  { key: 'schedule', label: 'Lịch' },
  { key: 'relatives', label: 'Người thân' },
];

export default function ResidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'profile';
  const [dialog, setDialog] = useState(null); // 'request' | 'archive' | null

  const { data: r, loading, error, reload, setData } = useFetch(() => residentsApi.get(id), [id]);

  if (loading && !r) return <Loading />;
  if (error) {
    return error.code === 'NOT_FOUND'
      ? <EmptyState title="Không tìm thấy hồ sơ" message="Hồ sơ này không tồn tại." action={<Link to="/residents" className="btn btn-secondary">Về danh sách</Link>} />
      : <ErrorState message={errorMessage(error)} onRetry={reload} />;
  }

  const archived = r.status === 'archived';
  const isAdmin = user.role === 'admin';
  const isOperator = user.role === 'operator';

  async function restore() {
    try {
      setData({ ...(await residentsApi.restore(id)), pendingArchiveRequest: null });
      toast('Đã khôi phục hồ sơ.');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <section>
      <Link to="/residents" className="back-link">‹ Danh sách</Link>

      <div className="page-header">
        <div>
          <h1>{r.fullName}</h1>
          <p className="muted">
            {r.residentCode} · {r.age} tuổi · {GENDER[r.gender]} · Phòng {r.room || '—'}{' '}
            <Badge value={r.status} label={STATUS[r.status]} />
          </p>
        </div>
        <div className="header-actions">
          {!archived && <Link to={`/residents/${id}/edit`} className="btn btn-secondary">Sửa hồ sơ</Link>}
          {!archived && isOperator && !r.pendingArchiveRequest && (
            <button className="btn btn-danger-outline" onClick={() => setDialog('request')}>Yêu cầu lưu trữ</button>
          )}
          {!archived && isAdmin && <button className="btn btn-danger-outline" onClick={() => setDialog('archive')}>Lưu trữ hồ sơ</button>}
          {archived && isAdmin && <button className="btn btn-primary" onClick={restore}>Khôi phục hồ sơ</button>}
        </div>
      </div>

      {archived && <Alert type="info">Hồ sơ đã được lưu trữ ngày {formatDate(r.archivedAt)}. Hồ sơ chỉ để xem, không thể chỉnh sửa.</Alert>}
      {r.pendingArchiveRequest && (
        <Alert type="info">
          {r.pendingArchiveRequest.requestedByName} đã yêu cầu lưu trữ hồ sơ này ngày {formatDate(r.pendingArchiveRequest.createdAt)}
          {' '}(lý do: “{r.pendingArchiveRequest.reason}”). Đang chờ quản trị viên duyệt.
          {isAdmin && <> <Link to="/admin/approvals">Xem yêu cầu</Link></>}
        </Alert>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setParams(t.key === 'profile' ? {} : { tab: t.key }, { replace: true })}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'profile' && <ProfileTab r={r} />}
        {tab === 'health' && <HealthTab residentId={id} readOnly={archived} />}
        {tab === 'medications' && <MedicationsTab residentId={id} readOnly={archived} />}
        {tab === 'vitals' && <VitalsTab residentId={id} readOnly={archived} />}
        {tab === 'notes' && <CareNotesTab residentId={id} readOnly={archived} />}
        {tab === 'schedule' && <ScheduleTab residentId={id} readOnly={archived} />}
        {tab === 'relatives' && (
          <div className="card"><EmptyState title="Đang xây dựng" message="Mục này sẽ có trong tuần 2." /></div>
        )}
      </div>

      <ReasonDialog
        open={dialog === 'request'}
        title="Yêu cầu lưu trữ hồ sơ"
        description="Quản trị viên sẽ xem xét và duyệt yêu cầu. Hồ sơ không bị xóa mà được chuyển sang lưu trữ."
        confirmLabel="Gửi yêu cầu"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          const req = await residentsApi.requestArchive(id, reason);
          setData({ ...r, pendingArchiveRequest: req });
          toast('Đã gửi yêu cầu lưu trữ.');
        }}
      />
      <ReasonDialog
        open={dialog === 'archive'}
        title="Lưu trữ hồ sơ"
        description="Hồ sơ sẽ bị ẩn khỏi danh sách và không thể chỉnh sửa. Bạn có thể khôi phục sau. Thao tác được ghi vào nhật ký."
        confirmLabel="Lưu trữ"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          setData({ ...(await residentsApi.archive(id, reason)), pendingArchiveRequest: null });
          toast('Đã lưu trữ hồ sơ.');
        }}
      />
    </section>
  );
}

function ProfileTab({ r }) {
  const rows = [
    ['Mã hồ sơ', r.residentCode],
    ['Ngày sinh', `${formatDate(r.dateOfBirth)} (${r.age} tuổi)`],
    ['Giới tính', GENDER[r.gender]],
    ['Phòng', r.room || '—'],
    ['Ngày nhập viện', formatDate(r.admissionDate)],
    ['Tình trạng', STATUS[r.status]],
    ['Khả năng đi lại', MOBILITY[r.mobilityLevel]],
    ['Nguy cơ té ngã', <Badge key="f" value={r.fallRisk} label={FALL_RISK[r.fallRisk]} />],
    ['Chế độ ăn', r.dietNotes || '—'],
    ['Tình trạng nhận thức', r.cognitiveStatus || '—'],
    ['Bác sĩ phụ trách', r.primaryDoctor || '—'],
    ['Bệnh viện ưu tiên', r.preferredHospital || '—'],
  ];
  return (
    <div className="card">
      <dl className="details">
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
