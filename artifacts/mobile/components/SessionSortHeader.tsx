import { Feather } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { SORT_LABELS, SORT_OPTIONS, type SortKey } from "@/hooks/useSessionSort";

export function SessionSortHeader({
  title,
  sortKey,
  onChange,
  accentColor,
  style,
}: {
  title: string;
  sortKey: SortKey;
  onChange: (k: SortKey) => void;
  accentColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const btnRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const openMenu = () => {
    btnRef.current?.measureInWindow((x, y, w, h) => {
      setPos({
        top: y + h + 6,
        right: Dimensions.get("window").width - (x + w),
      });
      setOpen(true);
    });
  };

  const pick = (k: SortKey) => {
    onChange(k);
    setOpen(false);
  };

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        ref={btnRef}
        onPress={openMenu}
        style={styles.filterBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Filtrar y ordenar"
      >
        <Feather name="sliders" size={15} color={colors.foreground} />
        <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              { top: pos.top, right: pos.right, backgroundColor: colors.card, borderColor: "rgba(61,14,22,0.50)" },
            ]}
          >
            {SORT_OPTIONS.map((opt) => {
              const sel = sortKey === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => pick(opt)}
                  style={styles.item}
                >
                  <Text
                    style={[
                      styles.itemText,
                      { color: sel ? accentColor : colors.foreground, fontWeight: sel ? "700" : "500" },
                    ]}
                  >
                    {SORT_LABELS[opt]}
                  </Text>
                  {sel && <Feather name="check" size={16} color={accentColor} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { flex: 1, fontSize: 16, fontWeight: "700" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  backdrop: { flex: 1 },
  menu: {
    position: "absolute",
    minWidth: 200,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemText: { fontSize: 14 },
});
