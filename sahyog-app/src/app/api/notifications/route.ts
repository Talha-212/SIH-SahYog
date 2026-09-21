import { NextResponse } from 'next/server';
import { getNotifications, markNotificationsAsRead } from '@/lib/server/db';
import type { Role } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') as Role) || null;
    const notifications = await getNotifications(role);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: notifications.filter(n => n.unread).length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    await markNotificationsAsRead();
    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
