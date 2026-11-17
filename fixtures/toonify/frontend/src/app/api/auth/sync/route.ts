import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    if (!email) {
        return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Call Backend
    // Ensure we use the internal Docker URL if running in Docker, or localhost if defined
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000';

    try {
        const res = await axios.post(`${backendUrl}/api/v1/auth/sync-clerk`, {
            email: email,
            clerk_id: user.id,
            name: name || undefined
        });

        return NextResponse.json(res.data);
    } catch (error: any) {
        console.error("Sync Error:", error.response?.data || error.message);
        return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
    }
}
