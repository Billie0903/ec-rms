import { useState } from 'react';

/** Shows an activation link once, with a copy button (to paste into Zalo). */
export function CopyLink({ link, emailSent }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  }
  return (
    <div className="copy-link">
      <p className="small">
        {emailSent ? 'Đã gửi email kích hoạt. ' : 'Chưa gửi được email (máy chủ chưa cấu hình email). '}
        Bạn có thể sao chép đường dẫn để gửi qua Zalo. Đường dẫn chỉ dùng một lần và hết hạn sau 72 giờ.
      </p>
      <div className="copy-row">
        <input className="input" readOnly value={link} aria-label="Đường dẫn kích hoạt" onFocus={(e) => e.target.select()} />
        <button type="button" className="btn btn-primary" onClick={copy}>{copied ? 'Đã sao chép ✓' : 'Sao chép'}</button>
      </div>
    </div>
  );
}
