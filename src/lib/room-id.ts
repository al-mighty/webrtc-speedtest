import { nanoid } from 'nanoid';

export function generateRoomId(): string {
  return nanoid(8);
}