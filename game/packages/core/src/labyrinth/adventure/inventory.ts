import type { AdventureInventory, AdventureLoot, AdventureResourceId } from './types';

export function createInventory(startingScanCharges: number | null): AdventureInventory {
  return {
    scanCharge: startingScanCharges,
    repairScrap: 0,
    keys: 0,
  };
}

export function addResource(
  inventory: AdventureInventory,
  id: AdventureResourceId,
  amount: number,
): AdventureInventory {
  if (amount === 0) return inventory;
  if (id === 'scanCharge') {
    if (inventory.scanCharge === null) return inventory;
    return { ...inventory, scanCharge: inventory.scanCharge + amount };
  }
  if (id === 'repairScrap') {
    return { ...inventory, repairScrap: inventory.repairScrap + amount };
  }
  if (id === 'keys') {
    return { ...inventory, keys: inventory.keys + amount };
  }
  return inventory;
}

export function applyLoot(
  inventory: AdventureInventory,
  health: number,
  maxHealth: number,
  loot: AdventureLoot | undefined,
): { inventory: AdventureInventory; health: number } {
  if (!loot?.resources) return { inventory, health };
  let next = inventory;
  let hp = health;
  const res = loot.resources;
  if (res.scanCharge) next = addResource(next, 'scanCharge', res.scanCharge);
  if (res.repairScrap) next = addResource(next, 'repairScrap', res.repairScrap);
  if (res.keys) next = addResource(next, 'keys', res.keys);
  if (res.health) hp = Math.min(maxHealth, hp + res.health);
  return { inventory: next, health: hp };
}

export function consumeScanCharge(inventory: AdventureInventory): AdventureInventory | null {
  if (inventory.scanCharge === null) return inventory;
  if (inventory.scanCharge <= 0) return null;
  return { ...inventory, scanCharge: inventory.scanCharge - 1 };
}

export function canSpendScan(inventory: AdventureInventory): boolean {
  return inventory.scanCharge === null || inventory.scanCharge > 0;
}
