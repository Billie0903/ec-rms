import { Link, useParams } from 'react-router-dom';
import { familyApi } from '../../api/admin.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Badge } from '../../components/Badge.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { ScheduleList } from '../residents/ScheduleTab.jsx';
import { ALLERGY_TYPE, MOBILITY, NOTE_CATEGORY, ROUTE, SEVERITY, STATUS, VITAL_FLAGS, formatDate, initials } from '../../utils/labels.js';
import { errorMessage } from '../../utils/messages.js';


/** Read-only view for a relative. Sections depend on the access level the server returns. */
export default function FamilyResidentPage() {
  const { residentId } = useParams();
  const { data, loading, error, reload } = useFetch(() => familyApi.get(residentId), [residentId]);

  if (loading) return <Loading />;
  if (error) {
    return error.code === 'NOT_FOUND'
      ? <EmptyState title="Không tìm thấy" message="Bạn không có quyền xem thông tin này." action={<Link to="/family" className="btn btn-secondary">Quay lại</Link>} />
      : <ErrorState message={errorMessage(error)} onRetry={reload} />;
  }

  const { resident: r, accessLevel, schedules, summaries } = data;
  const full = accessLevel === 'full';
  const latestVitals = data.vitals?.[0];

  return (
    <section className="family">
      <Link to="/family" className="back-link">‹ Người thân của tôi</Link>
      <div className="family-hero card">
        {r.photoUrl ? <img src={r.photoUrl} alt="" className="avatar avatar-lg" /> : <span className="avatar avatar-lg" aria-hidden="true">{initials(r.fullName)}</span>}
        <div>
          <h1>{r.fullName}</h1>
          <p className="muted">{r.age} tuổi · Phòng {r.room || '—'} · Nhập viện {formatDate(r.admissionDate)}</p>
          <Badge value={r.status} label={STATUS[r.status]} />
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Tóm tắt tuần</h2>
        {summaries.length === 0 ? <p className="muted">Trung tâm chưa đăng tóm tắt tuần nào.</p> : (
          <>
            <p className="muted small">Tuần từ {formatDate(summaries[0].weekStart)}</p>
            <p className="summary-text">{summaries[0].content}</p>
            {summaries.length > 1 && (
              <details>
                <summary>Các tuần trước ({summaries.length - 1})</summary>
                {summaries.slice(1).map((s) => <div key={s.id} className="older-summary"><p className="muted small">Tuần từ {formatDate(s.weekStart)}</p><p>{s.content}</p></div>)}
              </details>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2 className="h2">Lịch sắp tới</h2>
        {schedules.length === 0 ? <p className="muted">Chưa có lịch nào sắp tới.</p> : <ScheduleList items={schedules} />}
      </div>

      {full && (
        <>
          <div className="card">
            <h2 className="h2">Sức khỏe</h2>
            {latestVitals ? (
              <div className="vital-tiles">
                {latestVitals.bpSystolic != null && <Tile label="Huyết áp" value={`${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`} flag={VITAL_FLAGS.bp(latestVitals)} />}
                {latestVitals.pulse != null && <Tile label="Mạch" value={latestVitals.pulse} flag={VITAL_FLAGS.pulse(latestVitals)} />}
                {latestVitals.temperatureC != null && <Tile label="Nhiệt độ" value={`${latestVitals.temperatureC} °C`} flag={VITAL_FLAGS.temperatureC(latestVitals)} />}
                {latestVitals.spo2 != null && <Tile label="SpO2" value={`${latestVitals.spo2}%`} flag={VITAL_FLAGS.spo2(latestVitals)} />}
                {latestVitals.weightKg != null && <Tile label="Cân nặng" value={`${latestVitals.weightKg} kg`} />}
              </div>
            ) : <p className="muted">Chưa có chỉ số trong 14 ngày qua.</p>}
            {latestVitals && <p className="muted small">Đo lúc {formatDate(latestVitals.measuredAt, true)}</p>}

            <h3>Dị ứng</h3>
            {data.allergies.length === 0 ? <p className="muted">Không có.</p> : (
              <ul className="plain-list">{data.allergies.map((a) => <li key={a.id}><strong>{a.allergen}</strong> ({ALLERGY_TYPE[a.type]}) <Badge value={a.severity} label={SEVERITY[a.severity]} />{a.reaction && ` · ${a.reaction}`}</li>)}</ul>
            )}
            <h3>Bệnh lý</h3>
            {data.conditions.length === 0 ? <p className="muted">Không có.</p> : (
              <ul className="plain-list">{data.conditions.map((c) => <li key={c.id}>{c.name}{c.sinceDate && <span className="muted"> · từ {formatDate(c.sinceDate)}</span>}</li>)}</ul>
            )}
            {(r.mobilityLevel || r.dietNotes) && (
              <p className="small">{r.mobilityLevel && <>Đi lại: {MOBILITY[r.mobilityLevel]}. </>}{r.dietNotes && <>Chế độ ăn: {r.dietNotes}.</>}</p>
            )}
          </div>

          <div className="card">
            <h2 className="h2">Thuốc đang dùng</h2>
            {data.medications.length === 0 ? <p className="muted">Không có thuốc nào.</p> : (
              <ul className="record-list">
                {data.medications.map((m) => (
                  <li key={m.id}><div>
                    <strong>{m.name}</strong> · {m.dosage} <span className="muted">({ROUTE[m.route]})</span>
                    <div className="time-pills">{m.timesOfDay.map((t) => <span key={t} className="pill pill-green">{t}</span>)}</div>
                    {m.instructions && <div className="small muted">{m.instructions}</div>}
                  </div></li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="h2">Nhật ký chăm sóc</h2>
            {data.careNotes.length === 0 ? <p className="muted">Chưa có ghi chú nào được chia sẻ.</p> : (
              <ul className="timeline">
                {data.careNotes.map((n) => (
                  <li key={n.id} className={n.category === 'incident' ? 'incident' : undefined}>
                    <div className="timeline-meta">
                      <span className={`pill ${n.category === 'incident' ? 'pill-red' : 'pill-gray'}`}>{NOTE_CATEGORY[n.category]}</span>
                      <span className="muted small">{formatDate(n.createdAt, true)}</span>
                    </div>
                    <p>{n.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <p className="muted small center">Nếu có thắc mắc, vui lòng liên hệ trung tâm.</p>
    </section>
  );
}

function Tile({ label, value, flag }) {
  return (
    <div className={flag ? 'tile tile-flag' : 'tile'}>
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {flag && <span className="small">Cần theo dõi</span>}
    </div>
  );
}
