import DashboardLayout from "@/components/ui/DashboardLayout";
import { CreateClientForm } from "@/components/Clients/CreateClientForm";

export default function CreateClient() {
  return (
    <DashboardLayout>
      <CreateClientForm />
    </DashboardLayout>
  );
}
