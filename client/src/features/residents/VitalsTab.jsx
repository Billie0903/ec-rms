import { careApi } from '../../api/care.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useInlineForm } from '../../hooks/useInlineForm.js';
import { useToast } from '../../hooks/useToast.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { VITAL_FLAGS, formatDate } from '../../utils/labels.js';
import { validateVitals } from '../../validation/care.js';
import { errorMessage } from '../../utils/messages.js';

const BLANK = { bpSystolic: '', bpDiastolic: '', pulse: '', temperatureC: '', spo2: '', weightKg: '', bloodSugarMmol: '' };

const Cell = ({ label, flag, children }) => (
  <td data-label={label} className={flag ? 'flagged' : undefined}>{children ?? '—'}{flag && <span className="sr-only"> (bất thường)</span>}</td>
);

export default function VitalsTab({ residentId, readOnly }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => careApi.listVitals(residentId, 30), [residentId]);
  const f = useInlineForm(BLANK, validateVitals);

  return (
    <div className="stack">
      {!readOnly && (
        <form className="card" noValidate onSubmit={async (e) => {
          const ok = await f.submit(e, (body) => careApi.createVitals(residentId, body));
          if (ok) { toast('Đã ghi chỉ số.'); f.setForm(BLANK); reload(); }
        }}>
          <h2 className="h2">Ghi chỉ số mới</h2>
          <Alert>{f.formError}</Alert>
          <div className="grid-4">
            <FormField type="number" inputMode="numeric" label="Huyết áp tâm thu" placeholder="mmHg" {...f.field('bpSystolic')} />
            <FormField type="number" inputMode="numeric" label="Huyết áp tâm trương" placeholder="mmHg" {...f.field('bpDiastolic')} />
            <FormField type="number" inputMode="numeric" label="Mạch" placeholder="lần/phút" {...f.field('pulse')} />
            <FormField type="number" inputMode="decimal" step="0.1" label="Nhiệt độ" placeholder="°C" {...f.field('temperatureC')} />
            <FormField type="number" inputMode="numeric" label="SpO2" placeholder="%" {...f.field('spo2')} />
            <FormField type="number" inputMode="decimal" step="0.1" label="Cân nặng" placeholder="kg" {...f.field('weightKg')} />
            <FormField type="number" inputMode="decimal" step="0.1" label="Đường huyết" placeholder="mmol/L" {...f.field('bloodSugarMmol')} />
          </div>
          <div className="actions"><button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Đang lưu…' : 'Lưu chỉ số'}</button></div>
        </form>
      )}

      <div className="card">
        <h2 className="h2">30 ngày gần nhất</h2>
        {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
          <EmptyState title="Chưa có chỉ số nào trong 30 ngày qua" />
        ) : (
          <table className="table responsive-table">
            <thead><tr><th>Thời gian</th><th>Huyết áp</th><th>Mạch</th><th>Nhiệt độ</th><th>SpO2</th><th>Cân nặng</th><th>Đường huyết</th><th>Người ghi</th></tr></thead>
            <tbody>
              {data.map((v) => (
                <tr key={v.id}>
                  <td data-label="Thời gian">{formatDate(v.measuredAt, true)}</td>
                  <Cell label="Huyết áp" flag={VITAL_FLAGS.bp(v)}>{v.bpSystolic != null ? `${v.bpSystolic}/${v.bpDiastolic}` : null}</Cell>
                  <Cell label="Mạch" flag={VITAL_FLAGS.pulse(v)}>{v.pulse}</Cell>
                  <Cell label="Nhiệt độ" flag={VITAL_FLAGS.temperatureC(v)}>{v.temperatureC != null ? `${v.temperatureC} °C` : null}</Cell>
                  <Cell label="SpO2" flag={VITAL_FLAGS.spo2(v)}>{v.spo2 != null ? `${v.spo2}%` : null}</Cell>
                  <Cell label="Cân nặng">{v.weightKg != null ? `${v.weightKg} kg` : null}</Cell>
                  <Cell label="Đường huyết" flag={VITAL_FLAGS.bloodSugarMmol(v)}>{v.bloodSugarMmol}</Cell>
                  <td data-label="Người ghi">{v.recordedByName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small">Ô màu đỏ là chỉ số nằm ngoài khoảng thông thường.</p>
      </div>
    </div>
  );
}
