import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList, ActivityIndicator, Modal, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { REFLECTION_CATEGORIES, CategoryIcon } from "@/constants/reflectionCategories";
import { useUpdateMyReflection, useDeleteMyReflection, type Reflection, type ReflectionCategory, listMyReflections, useListMyReflections, getListMyReflectionsQueryKey } from "@workspace/api-client-react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export default function InnerSpaceScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const qc = useQueryClient();
  const { authLoading, isSignedIn, clerkUserId } = useAuth();
  
  const [filter, setFilter] = useState<ReflectionCategory | "all">("all");
  const limit = 30;
  const filterRef = useRef(filter);
  const nextRequestRef = useRef<AbortController | null>(null);
  const previousUserRef = useRef<string | null>(null);
  
  const queryParams = { 
    category: filter === "all" ? undefined : filter,
    limit 
  };
  
  const { data: firstPageData, isLoading: isFirstLoading, isError: isFirstError, refetch: refetchFirst } = useListMyReflections(
    queryParams,
    {
      query: {
        queryKey: [...getListMyReflectionsQueryKey(queryParams), clerkUserId],
        enabled: !authLoading && isSignedIn && Boolean(clerkUserId),
      }
    }
  );

  const [subsequentPages, setSubsequentPages] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [fetchNextError, setFetchNextError] = useState(false);

  useEffect(() => {
    filterRef.current = filter;
    nextRequestRef.current?.abort();
    nextRequestRef.current = null;
    setIsFetchingNext(false);
    setSubsequentPages([]);
    setNextCursor(null);
    setFetchNextError(false);
  }, [filter]);

  useEffect(() => {
    const previousUserId = previousUserRef.current;
    if (previousUserId && previousUserId !== clerkUserId) {
      void qc.cancelQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/me/reflections" &&
          query.queryKey[query.queryKey.length - 1] === previousUserId,
      });
      qc.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/me/reflections" &&
          query.queryKey[query.queryKey.length - 1] === previousUserId,
      });
    }
    previousUserRef.current = clerkUserId;
    return () => nextRequestRef.current?.abort();
  }, [clerkUserId, qc]);

  useEffect(() => {
    if (firstPageData) {
      setNextCursor(firstPageData.nextCursor);
    }
  }, [firstPageData]);

  const loadMore = async () => {
    if (!nextCursor || isFetchingNext || isFirstLoading) return;
    const requestFilter = filter;
    const requestCursor = nextCursor;
    const controller = new AbortController();
    nextRequestRef.current?.abort();
    nextRequestRef.current = controller;
    setIsFetchingNext(true);
    setFetchNextError(false);
    try {
      const res = await listMyReflections(
        {
          category: requestFilter === "all" ? undefined : requestFilter,
          limit,
          cursor: requestCursor,
        },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || filterRef.current !== requestFilter) return;
      setSubsequentPages(prev => [...prev, res]);
      setNextCursor(res.nextCursor);
    } catch {
      if (!controller.signal.aborted && filterRef.current === requestFilter) {
        setFetchNextError(true);
      }
    } finally {
      if (nextRequestRef.current === controller) {
        nextRequestRef.current = null;
        setIsFetchingNext(false);
      }
    }
  };

  const items = useMemo(() => {
    const list = [...(firstPageData?.items || [])];
    subsequentPages.forEach(page => {
      list.push(...page.items);
    });
    const seen = new Set();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [firstPageData, subsequentPages]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editCategory, setEditCategory] = useState<ReflectionCategory | null>(null);
  const [actionReflection, setActionReflection] = useState<Reflection | null>(null);
  const [actionMode, setActionMode] = useState<"menu" | "delete">("menu");

  const updateMutation = useUpdateMyReflection({
    mutation: {
      onSuccess: (updated) => {
        setSubsequentPages(prev => prev.map(page => ({
          ...page,
          items: page.items
            .map((item: Reflection) => item.id === updated.id ? updated : item)
            .filter((item: Reflection) => filter === "all" || item.category === filter)
        })));
        qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/me/reflections' });
        setEditingId(null);
      }
    }
  });

  const deleteMutation = useDeleteMyReflection({
    mutation: {
      onSuccess: (_, variables) => {
        setSubsequentPages(prev => prev.map(page => ({
          ...page,
          items: page.items.filter((item: any) => item.id !== variables.id)
        })));
        qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/me/reflections' });
      }
    }
  });

  const beginEditing = (reflection: Reflection) => {
    setActionReflection(null);
    setEditingId(reflection.id);
    setEditMessage(reflection.message);
    setEditCategory(reflection.category);
  };

  const confirmDelete = () => {
    if (!actionReflection) return;
    const id = actionReflection.id;
    setActionReflection(null);
    deleteMutation.mutate({ id });
  };

  const groupedData = useMemo(() => {
    const groups: { dateLabel: string; items: Reflection[] }[] = [];
    items.forEach(item => {
      const date = new Date(item.createdAt);
      const dateLabel = date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateLabel === dateLabel) {
        lastGroup.items.push(item);
      } else {
        groups.push({ dateLabel, items: [item] });
      }
    });
    return groups;
  }, [items]);

  const flatData = useMemo(() => {
    const result: any[] = [];
    groupedData.forEach(group => {
      result.push({ type: 'header', dateLabel: group.dateLabel, id: `header-${group.dateLabel}` });
      group.items.forEach((item, index) => {
        result.push({ type: 'item', item, isLastInGroup: index === group.items.length - 1, id: item.id.toString() });
      });
    });
    return result;
  }, [groupedData]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeader}>
          <View style={[styles.datePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dateText, { color: colors.foreground }]}>{item.dateLabel}</Text>
          </View>
        </View>
      );
    }

    const reflection: Reflection = item.item;
    const timeLabel = new Date(reflection.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const cat = REFLECTION_CATEGORIES[reflection.category];
    const isEditing = editingId === reflection.id;

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{timeLabel}</Text>
          <View style={styles.timelineDotContainer}>
            <View style={[styles.timelineLine, { backgroundColor: colors.border }, item.isLastInGroup && { bottom: '50%' }]} />
            <CategoryIcon category={cat.id} size={14} />
          </View>
        </View>

        <View style={[styles.reflectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardCatPill, { backgroundColor: cat.bg }]}>
              <Text style={[styles.cardCatText, { color: cat.color }]}>{cat.label}</Text>
            </View>

            {!isEditing && (
              <Pressable
                testID={`menu-${reflection.id}`}
                accessibilityLabel="Opciones"
                accessibilityRole="button"
                style={styles.menuButton}
                onPress={() => {
                  setActionMode("menu");
                  setActionReflection(reflection);
                }}
              >
                <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <View style={styles.editCategoryRow}>
                {Object.values(REFLECTION_CATEGORIES).map(c => (
                  <Pressable
                    key={c.id}
                    testID={`edit-cat-${c.id}`}
                    accessibilityLabel={`Seleccionar ${c.label}`}
                    onPress={() => setEditCategory(c.id as ReflectionCategory)}
                    style={[styles.editCategoryPill, editCategory === c.id && { backgroundColor: c.bg, borderColor: c.color }]}
                  >
                    <CategoryIcon category={c.id as ReflectionCategory} size={12} />
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.1)' }]}
                multiline
                maxLength={300}
                value={editMessage}
                onChangeText={setEditMessage}
              />
              <View style={styles.editActions}>
                <Pressable testID="cancel-edit" style={styles.editCancel} onPress={() => setEditingId(null)}>
                  <Text style={[styles.editCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
                </Pressable>
                <Pressable
                  testID="save-edit"
                  style={[styles.editSave, { backgroundColor: colors.primary }]}
                  disabled={editMessage.trim() === "" || !editCategory || updateMutation.isPending}
                  onPress={() => updateMutation.mutate({ id: reflection.id, data: { message: editMessage.trim(), category: editCategory! } })}
                >
                  <Text style={[styles.editSaveText, { color: colors.primaryForeground }]}>{updateMutation.isPending ? "Guardando..." : "Guardar"}</Text>
                </Pressable>
              </View>
              {updateMutation.isError && <Text style={[styles.errorText, { color: colors.destructive, marginTop: 8, textAlign: 'right' }]}>Error al guardar.</Text>}
            </View>
          ) : (
            <Text style={[styles.cardMessage, { color: colors.foreground }]}>{reflection.message}</Text>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="feather" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Tu espacio interior está comenzando</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Cada pensamiento que compartas contigo puede convertirse en un descubrimiento.
      </Text>
      <Pressable testID="empty-back" style={[styles.emptyButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()}>
        <Text style={[styles.emptyButtonText, { color: colors.foreground }]}>Escribir mi primera reflexión</Text>
      </Pressable>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
      style={styles.root}
    >
      <View style={[styles.headerContainer, { paddingTop: (Platform.OS === "web" ? 67 : Math.max(insets.top, 40)) + 8 }]}>
        <Pressable testID="back-button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={[styles.mainTitle, { color: colors.foreground }]}>Mi espacio interior</Text>
          <Text style={[styles.subTitle, { color: colors.mutedForeground }]}>Un recorrido por tus intenciones, reflexiones y descubrimientos.</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <Pressable
            testID="filter-all"
            accessibilityLabel="Filtrar por Todos"
            style={[styles.filterPill, filter === "all" ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, { color: filter === "all" ? colors.foreground : colors.mutedForeground }]}>Todos</Text>
          </Pressable>
          {Object.values(REFLECTION_CATEGORIES).map(cat => {
            const isActive = filter === cat.id;
            const IconComp = cat.iconFamily === "Feather" ? Feather : MaterialCommunityIcons;
            return (
              <Pressable
                key={cat.id}
                testID={`filter-${cat.id}`}
                accessibilityLabel={`Filtrar por ${cat.label}`}
                style={[styles.filterPill, isActive ? { backgroundColor: cat.bg, borderColor: cat.color } : { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setFilter(cat.id as ReflectionCategory)}
              >
                <IconComp name={cat.icon as any} size={14} color={isActive ? cat.color : colors.mutedForeground} />
                <Text style={[styles.filterText, { color: isActive ? cat.color : colors.mutedForeground }, { marginLeft: 6 }]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isFirstError ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>Error al cargar las reflexiones.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchFirst()}>
             <Text style={{ color: colors.primary }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : isFirstLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : flatData.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <View style={{ margin: 20, alignItems: 'center' }}>
               {isFetchingNext && <ActivityIndicator color={colors.primary} />}
               {fetchNextError && (
                 <Pressable onPress={loadMore} style={{ padding: 10 }}>
                   <Text style={{ color: colors.destructive }}>Error al cargar más. Reintentar.</Text>
                 </Pressable>
               )}
            </View>
          }
          keyboardShouldPersistTaps="handled"
          renderScrollComponent={Platform.OS === 'web' ? undefined : (props) => <KeyboardAwareScrollView {...props} />}
        />
      )}
      <Modal
        visible={Boolean(actionReflection)}
        transparent
        animationType="fade"
        onRequestClose={() => setActionReflection(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActionReflection(null)}>
          <Pressable
            accessibilityViewIsModal
            style={[styles.actionSheet, { backgroundColor: theme.gradient[0], borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            {actionMode === "menu" ? (
              <>
                <Text style={[styles.actionSheetTitle, { color: colors.foreground }]}>Reflexión</Text>
                <Pressable
                  testID="reflection-edit-action"
                  accessibilityRole="button"
                  style={styles.actionRow}
                  onPress={() => actionReflection && beginEditing(actionReflection)}
                >
                  <Feather name="edit-2" size={19} color={colors.foreground} />
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>Editar</Text>
                </Pressable>
                <Pressable
                  testID="reflection-delete-action"
                  accessibilityRole="button"
                  style={styles.actionRow}
                  onPress={() => setActionMode("delete")}
                >
                  <Feather name="trash-2" size={19} color={colors.destructive} />
                  <Text style={[styles.actionLabel, { color: colors.destructive }]}>Eliminar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.actionSheetTitle, { color: colors.foreground }]}>¿Eliminar esta reflexión?</Text>
                <Text style={[styles.actionSheetBody, { color: colors.mutedForeground }]}>
                  Esta acción no se puede deshacer.
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    testID="reflection-delete-cancel"
                    accessibilityRole="button"
                    style={styles.confirmButton}
                    onPress={() => setActionMode("menu")}
                  >
                    <Text style={[styles.confirmLabel, { color: colors.foreground }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    testID="reflection-delete-confirm"
                    accessibilityRole="button"
                    style={[styles.confirmButton, styles.destructiveButton]}
                    onPress={confirmDelete}
                  >
                    <Text style={[styles.confirmLabel, { color: "#FFFFFF" }]}>Eliminar</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dateHeader: {
    alignItems: 'flex-start',
    marginLeft: 60,
    marginBottom: 16,
    marginTop: 16,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginBottom: 8,
  },
  timelineDotContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: -32,
    width: 1,
  },
  reflectionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCatPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardCatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
  },
  cardMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editContainer: {
    marginTop: 8,
  },
  editCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  editCategoryPill: {
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  editCancel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editSave: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
  },
  retryButton: {
    marginTop: 12,
    padding: 10,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  actionSheetBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  actionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  confirmButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  destructiveButton: {
    backgroundColor: "#B64052",
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});