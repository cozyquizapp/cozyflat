import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const roomImageMap: Record<string, string> = {
  'garden-living.png': 'garden-living-game-v2.png',
  'garden-bedroom.png': 'garden-bedroom-game-v2.png',
  'garden-kitchen.png': 'garden-kitchen-game-v2.png',
  'garden-bathroom.png': 'garden-bathroom-game-v2.png',
};

const allowedRoomImages = new Set([
  'garden-living-game-v2.png',
  'garden-bedroom-game-v2.png',
  'garden-kitchen-game-v2.png',
  'garden-bathroom-game-v2.png',
  'garden-living.png',
  'garden-bedroom.png',
  'garden-kitchen.png',
  'garden-bathroom.png',
]);

export async function GET(_: Request, { params }: { params: { name: string } }) {
  const requested = decodeURIComponent(params.name);
  if (!allowedRoomImages.has(requested) || path.extname(requested).toLowerCase() !== '.png') {
    return new NextResponse('Not found', { status: 404 });
  }

  const filename = roomImageMap[requested] ?? requested;
  const filePath = path.join(process.cwd(), 'public', 'garden', 'rooms', filename);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch {
    return new NextResponse('Bild nicht gefunden', { status: 404 });
  }
}
