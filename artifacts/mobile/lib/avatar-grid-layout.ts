// FlatList with numColumns calls getItemLayout with ROW indices, not avatar indices.
export const AVATAR_GRID_CELL_SIZE = 63;
export const AVATAR_GRID_ROW_GAP = 12;
export const AVATAR_GRID_TOP_PADDING = 20;

export function avatarGridItemLayout(_data: unknown, index: number) {
  const length = AVATAR_GRID_CELL_SIZE + AVATAR_GRID_ROW_GAP;
  return { length, offset: AVATAR_GRID_TOP_PADDING + index * length, index };
}
