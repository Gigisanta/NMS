import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const clientsCount = await db.client.count();
    const clients = await db.client.findMany({
      include: { grupo: true }
    });
    
    const groupsCount = await db.group.count();
    const groups = await db.group.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { clients: true } }
      }
    });

    return NextResponse.json({
      success: true,
      clientsCount,
      clients,
      groupsCount,
      groups
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
