import TenantDetailPage from "./TenantDetailPage";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function TenantPage() {
  return <TenantDetailPage />;
}
