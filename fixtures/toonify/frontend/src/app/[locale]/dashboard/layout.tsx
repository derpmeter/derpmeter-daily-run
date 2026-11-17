import { cookies } from 'next/headers';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    return (
        <DashboardLayout accessToken={token}>
            {children}
        </DashboardLayout>
    );
}
