import { Link, Navigate } from 'react-router-dom';
import { familyApi } from '../../api/admin.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Badge } from '../../components/Badge.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { STATUS, initials } from '../../utils/labels.js';
import { errorMessage } from '../../utils/messages.js';



/** A relative's home page: one card per linked family member. */
export default function FamilyPage() {
  const { data, loading, error, reload } = useFetch(() => familyApi.list(), []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />;
  if (data.length === 1) return <Navigate to={`/family/${data[0].id}`} replace />;

  return (
    <section className="family">
      <h1>Người thân của tôi</h1>
      {data.length === 0 ? (
        <EmptyState title="Chưa có thông tin" message="Tài khoản của bạn chưa được liên kết với người cao tuổi nào. Vui lòng liên hệ trung tâm." />
      ) : (
        <div className="family-cards">
          {data.map((r) => (
            <Link key={r.id} to={`/family/${r.id}`} className="card family-card">
              {r.photoUrl ? <img src={r.photoUrl} alt="" className="avatar" /> : <span className="avatar" aria-hidden="true">{initials(r.fullName)}</span>}
              <div>
                <h2>{r.fullName}</h2>
                <p className="muted">{r.age} tuổi · Phòng {r.room || '—'} · {r.relationship}</p>
                <Badge value={r.status} label={STATUS[r.status]} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
