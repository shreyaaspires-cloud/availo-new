import test from 'node:test';
import assert from 'node:assert';
import { useAppStore } from '../lib/store';
import { DEMO_USERS } from '../lib/mockData';

test('NexusShare Governance Engine - Initializes with default user', () => {
  useAppStore.setState({
    currentUser: DEMO_USERS.USER,
    allUsers: Object.values(DEMO_USERS),
    bookings: [],
    incidents: [],
    auditLogs: [],
  });
  const state = useAppStore.getState();
  assert.strictEqual(state.currentUser?.name, 'Maya Lin');
  assert.ok(state.allUsers.length > 0);
});

test('NexusShare Governance Engine - Rejects booking under 1 hour duration policy', () => {
  const state = useAppStore.getState();
  const result = state.requestBooking({
    resourceId: state.resources[0].id,
    resourceName: state.resources[0].name,
    category: state.resources[0].category,
    startTime: '2026-11-02T10:00:00',
    endTime: '2026-11-02T10:30:00',
    purpose: 'Quick check',
  });

  assert.strictEqual(result.success, false);
  assert.match(result.message, /Minimum booking duration is 1 hour/);
});

test('NexusShare Governance Engine - Deducts weekly quota hours on eligible booking', () => {
  const userResource = useAppStore
    .getState()
    .resources.find((r) =>
      r.requiredQualifications.every((q) =>
        DEMO_USERS.USER.qualifications.includes(q)
      )
    );

  assert.ok(userResource, 'Resource matching user qualifications found');
  const initialUsed = useAppStore.getState().currentUser!.weeklyUsedHours;
  const result = useAppStore.getState().requestBooking({
    resourceId: userResource.id,
    resourceName: userResource.name,
    category: userResource.category,
    startTime: '2026-11-02T10:00:00',
    endTime: '2026-11-02T12:00:00',
    purpose: 'Robotics thesis prototype fabrication',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(useAppStore.getState().currentUser!.weeklyUsedHours, initialUsed + 2);
});

test('NexusShare Governance Engine - Restores weekly quota hours on booking rejection', () => {
  const userResource = useAppStore
    .getState()
    .resources.find((r) =>
      r.requiredQualifications.every((q) =>
        DEMO_USERS.USER.qualifications.includes(q)
      )
    );

  assert.ok(userResource);
  const initialUsed = useAppStore.getState().currentUser!.weeklyUsedHours;
  useAppStore.getState().requestBooking({
    resourceId: userResource.id,
    resourceName: userResource.name,
    category: userResource.category,
    startTime: '2026-11-02T10:00:00',
    endTime: '2026-11-02T12:00:00',
    purpose: 'Prototype testing',
  });

  const bookingId = useAppStore.getState().bookings[0].id;
  useAppStore.getState().rejectBooking(bookingId, 'Emergency safety shutdown');

  assert.strictEqual(useAppStore.getState().currentUser!.weeklyUsedHours, initialUsed);
});
