import DashboardLayout from "@/components/ui/DashboardLayout";
import { ClientsList } from "@/components/Clients/ClientsList";

export default function MyClients() {
  return (
    <DashboardLayout>
      <ClientsList />
    </DashboardLayout>
  );
}
