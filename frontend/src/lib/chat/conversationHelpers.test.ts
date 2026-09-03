import { describe, expect, it } from 'vitest';
import type { Conversation, ChatParticipant } from '../../types/chat.ts';
import {
  conversationParty,
  getOtherParticipant,
  mergeConversationRecords,
} from './conversationHelpers.ts';

function participant(overrides: Partial<ChatParticipant>): ChatParticipant {
  return {
    id: 'p1',
    user_id: 'u1',
    name: 'Sara',
    avatar_url: 'https://cdn.example/sara.jpg',
    participant_role: 'customer',
    ...overrides,
  };
}

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    created_by: 'u1',
    type: 'customer_vendor',
    subject: 'Order question',
    context_type: null,
    context_id: null,
    vendor_account_id: 'v1',
    provider_account_id: null,
    unread_count: 0,
    last_read_at: null,
    participants: [
      participant({ id: 'p-customer', user_id: 'customer-1', name: 'Sara Customer', participant_role: 'customer' }),
      participant({
        id: 'p-vendor',
        user_id: 'vendor-1',
        name: 'Diyar Majlis',
        avatar_url: null,
        participant_role: 'vendor',
      }),
    ],
    display_name: 'Sara Customer',
    display_avatar_url: 'https://cdn.example/sara.jpg',
    vendor_slug: 'diyar-majlis',
    provider_slug: null,
    last_message: null,
    last_message_at: null,
    created_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('chat counterparty identity', () => {
  it('lets a vendor see the customer, not themselves', () => {
    const other = getOtherParticipant(conversation(), 'vendor-1');

    expect(other?.user_id).toBe('customer-1');
    expect(other?.name).toBe('Sara Customer');
    expect(conversationParty(conversation(), 'vendor-1', 'Conversation').name).toBe('Sara Customer');
    expect(conversationParty(conversation(), 'vendor-1', 'Conversation').role).toBe('customer');
  });

  it('lets a customer see the store, not their own name', () => {
    const other = getOtherParticipant(conversation(), 'customer-1');

    expect(other?.user_id).toBe('vendor-1');
    expect(other?.name).toBe('Diyar Majlis');
  });

  it('falls back to display_name when participants are missing', () => {
    const stub = conversation({
      participants: [],
      display_name: 'Sara Customer',
      display_avatar_url: 'https://cdn.example/sara.jpg',
    });

    const party = conversationParty(stub, 'vendor-1', 'Conversation');

    expect(party.name).toBe('Sara Customer');
    expect(party.avatarUrl).toBe('https://cdn.example/sara.jpg');
    expect(party.name).not.toBe('?');
  });

  it('merges list preview with detail participants so the header keeps the other person', () => {
    const stub = conversation({
      participants: [],
      display_name: null,
      last_message: {
        id: 'm1',
        body: 'اهلا',
        sender_id: 'customer-1',
        message_type: 'text',
        created_at: '2026-09-01T12:00:00.000Z',
      },
    });
    const detail = conversation();

    const merged = mergeConversationRecords(stub, detail);

    expect(merged?.display_name).toBe('Sara Customer');
    expect(getOtherParticipant(merged, 'vendor-1')?.name).toBe('Sara Customer');
    expect(merged?.last_message?.body).toBe('اهلا');
  });
});
