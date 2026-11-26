import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Không tìm thấy trang</h1>
        <p className="muted">Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
        <Link className="btn btn-primary btn-block" to="/">Về trang chủ</Link>
      </div>
    </div>
  );
}
