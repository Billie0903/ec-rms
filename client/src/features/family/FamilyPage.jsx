import { EmptyState } from '../../components/StateViews.jsx';

// Week 2: cards for each linked resident, then a read-only detail page.
export default function FamilyPage() {
  return (
    <section>
      <h1>Người thân của tôi</h1>
      <EmptyState title="Đang xây dựng" message="Thông tin người thân sẽ có trong tuần 2." />
    </section>
  );
}
