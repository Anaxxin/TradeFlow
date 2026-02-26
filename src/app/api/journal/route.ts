import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch Daily Journal AND Trades
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const accountId = searchParams.get('accountId');

    if (!date || !accountId) {
        return NextResponse.json({ error: 'Missing date or accountId' }, { status: 400 });
    }

    try {
        const searchDate = new Date(date);

        const entry = await prisma.journalEntry.findFirst({
            where: {
                account_id: accountId,
                date: searchDate,
            },
        });

        // Also fetch trades for this day
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const trades = await prisma.trade.findMany({
            where: {
                account_id: accountId,
                exit_time: {
                    gte: searchDate,
                    lt: nextDay
                }
            },
            orderBy: { exit_time: 'asc' }

        });

        return NextResponse.json({
            content: entry?.content || '',
            trades: trades
        });
    } catch (error) {
        console.error('Error fetching journal:', error);
        return NextResponse.json({ error: 'Failed to fetch journal' }, { status: 500 });
    }
}

// POST: Save Daily Journal Note
export async function POST(req: Request) {
    try {
        const { date, content, accountId } = await req.json();

        if (!date || !accountId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const entryDate = new Date(date);

        const entry = await prisma.journalEntry.upsert({
            where: {
                account_id_date: {
                    account_id: accountId,
                    date: entryDate,
                },
            },
            update: {
                content,
            },
            create: {
                account_id: accountId,
                date: entryDate,
                content,
            },
        });

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        console.error('Error saving journal:', error);
        return NextResponse.json({ error: 'Failed to save journal' }, { status: 500 });
    }
}

// PATCH: Update specific trade note
export async function PATCH(req: Request) {
    try {
        const { tradeId, notes, images } = await req.json();

        if (!tradeId) {
            return NextResponse.json({ error: 'Missing tradeId' }, { status: 400 });
        }

        const updatedTrade = await prisma.trade.update({
            where: { id: tradeId },
            data: {
                notes: notes,
                // Only update images if provided
                ...(images ? { images } : {})
            }
        });

        return NextResponse.json({ success: true, trade: updatedTrade });
    } catch (error) {
        console.error('Error updating trade:', error);
        return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
    }
}
