import UserDetailPage from "./UserDetailPage";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function UserPage() {
  return <UserDetailPage />;
}
