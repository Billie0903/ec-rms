import { EmptyState } from '../../components/StateViews.jsx';

export default function AdminPlaceholder({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <EmptyState title="Đang xây dựng" message="Chức năng này sẽ có trong tuần 2." />
    </section>
  );
}
