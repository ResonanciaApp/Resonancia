import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList, ActivityIndicator, Modal, TextInput, Platform, Animated, Easing, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { REFLECTION_CATEGORIES, REFLECTION_CATEGORY_OPTIONS, CategoryIcon } from "@/constants/reflectionCategories";
import { useUpdateMyReflection, useDeleteMyReflection, type Reflection, type ReflectionCategory, listMyReflections, useListMyReflections, getListMyReflectionsQueryKey } from "@workspace/api-client-react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ReflectionShare } from "@/components/ReflectionShare";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { canShareReflection } from "@/lib/reflection-story-logic";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function SlidingSheetModal({
  visible,
  onClose,
  surfaceColor,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  surfaceColor: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  const translateY = useRef(new Animated.Value(700)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      translateY.setValue(700);
      overlayOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }

    if (mountedRef.current) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 700,
          duration: 350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          mountedRef.current = false;
          setMounted(false);
        }
      });
    }
  }, [overlayOpacity, translateY, visible]);

  useEffect(() => () => {
    translateY.stopAnimation();
    overlayOpacity.stopAnimation();
  }, [overlayOpacity, translateY]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[styles.modalOverlay, { opacity: overlayOpacity }]}
        />
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.actionSheet,
              { backgroundColor: surfaceColor, transform: [{ translateY }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {children}
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

function CollapsibleReflectionMessage({
  message,
  color,
}: {
  message: string;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  return (
    <View style={styles.messageContainer}>
      <Text
        pointerEvents="none"
        style={[styles.cardMessage, styles.messageMeasure, { color }]}
        onTextLayout={(event) => setHasOverflow(event.nativeEvent.lines.length > 5)}
      >
        {message}
      </Text>
      <View>
        <Text
          style={[styles.cardMessage, { color }]}
          numberOfLines={expanded ? undefined : 5}
          ellipsizeMode="tail"
        >
          {message}
        </Text>
        {hasOverflow && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Leer menos" : "Leer más"}
            onPress={() => setExpanded((value) => !value)}
            hitSlop={8}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>{expanded ? "Leer menos" : "Leer más"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function WallScrollReveal({
  active,
  children,
  completedIds,
  delay = 0,
  disabled = false,
  revealId,
  scaleFrom,
  style,
  translateYFrom,
}: {
  active: boolean;
  children: React.ReactNode;
  completedIds: React.MutableRefObject<Set<string>>;
  delay?: number;
  disabled?: boolean;
  revealId: string;
  scaleFrom: number;
  style?: React.ComponentProps<typeof CinematicFadeSlide>["style"];
  translateYFrom: number;
}) {
  const skipAnimation = useRef(completedIds.current.has(revealId)).current;

  useEffect(() => {
    if (active && !skipAnimation) completedIds.current.add(revealId);
  }, [active, completedIds, revealId, skipAnimation]);

  if (disabled || skipAnimation) return <>{children}</>;

  return (
    <CinematicFadeSlide
      active={active}
      replayKey={revealId}
      delay={delay}
      duration={1100}
      scaleFrom={scaleFrom}
      style={style}
      translateYFrom={translateYFrom}
    >
      {children}
    </CinematicFadeSlide>
  );
}

export default function InnerSpaceScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const qc = useQueryClient();
  const { authLoading, isSignedIn, clerkUserId } = useAuth();
  const today = useRef(new Date()).current;
  const [filter, setFilter] = useState<ReflectionCategory | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const selectedYear = today.getFullYear();
  const limit = 30;
  const monthRange = useMemo(() => {
    const from = new Date(selectedYear, selectedMonth, 1);
    const to = new Date(selectedYear, selectedMonth + 1, 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [selectedMonth, selectedYear]);
  const requestScope = `${filter}:${monthRange.from}:${monthRange.to}`;
  const requestScopeRef = useRef(requestScope);
  const nextRequestRef = useRef<AbortController | null>(null);
  const previousUserRef = useRef<string | null>(null);
  const completedRevealIds = useRef(new Set<string>());
  const wallAnimationsDisabledRef = useRef(false);
  const [wallAnimationsDisabled, setWallAnimationsDisabled] = useState(false);
  const [wallVisitKey, setWallVisitKey] = useState(0);
  const [wallRevealDelays, setWallRevealDelays] = useState<Map<string, number>>(
    () => new Map(),
  );
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
    waitForInteraction: false,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: any; isViewable?: boolean }> }) => {
      if (wallAnimationsDisabledRef.current) return;
      const visibleIds = viewableItems
        .filter(({ item, isViewable }) => isViewable !== false && item?.id)
        .map(({ item }) => String(item.id));
      if (visibleIds.length === 0) return;
      setWallRevealDelays((current) => {
        const next = new Map(current);
        let changed = false;
        let cascadeIndex = 0;
        visibleIds.forEach((id) => {
          if (next.has(id)) return;
          next.set(id, cascadeIndex * 330);
          cascadeIndex += 1;
          changed = true;
        });
        return changed ? next : current;
      });
    },
  ).current;

  const disableWallAnimations = useCallback(() => {
    wallAnimationsDisabledRef.current = true;
    setWallAnimationsDisabled(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      wallAnimationsDisabledRef.current = false;
      completedRevealIds.current.clear();
      setWallRevealDelays(new Map());
      setWallAnimationsDisabled(false);
      setWallVisitKey((current) => current + 1);

      return () => {
        wallAnimationsDisabledRef.current = true;
        setWallAnimationsDisabled(true);
      };
    }, []),
  );
  
  const queryParams = { 
    category: filter === "all" ? undefined : filter,
    from: monthRange.from,
    to: monthRange.to,
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
    requestScopeRef.current = requestScope;
    completedRevealIds.current.clear();
    setWallRevealDelays(new Map());
    nextRequestRef.current?.abort();
    nextRequestRef.current = null;
    setIsFetchingNext(false);
    setSubsequentPages([]);
    setNextCursor(null);
    setFetchNextError(false);
  }, [requestScope]);

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
    const requestedScope = requestScope;
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
          from: monthRange.from,
          to: monthRange.to,
          limit,
          cursor: requestCursor,
        },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || requestScopeRef.current !== requestedScope) return;
      setSubsequentPages(prev => [...prev, res]);
      setNextCursor(res.nextCursor);
    } catch {
      if (!controller.signal.aborted && requestScopeRef.current === requestedScope) {
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

  const [shareReflection, setShareReflection] = useState<Reflection | null>(null);

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
    setEditingId(reflection.id);
    setEditMessage(reflection.message);
    setEditCategory(reflection.category);
  };

  const requestDelete = (reflection: Reflection) => {
    Alert.alert(
      "¿Quieres borrar tu mensaje?",
      undefined,
      [
        { text: "Conservar", style: "cancel" },
        {
          text: "Sí, borrar",
          style: "destructive",
          onPress: () => {
            setEditingId(null);
            deleteMutation.mutate({ id: reflection.id });
          },
        },
      ],
    );
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

  const renderMonthSelector = () => (
    <Pressable
      testID="month-filter"
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por mes. Mes actual: ${MONTH_NAMES[selectedMonth]}`}
      style={styles.monthSelectorButton}
      onPress={() => setMonthPickerVisible(true)}
    >
      <Text style={styles.monthSelectorText}>{MONTH_NAMES[selectedMonth]}</Text>
      <Feather name="chevron-down" size={17} color="#F9F9F9" />
    </Pressable>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'header') {
      const revealId = String(item.id);
      const revealDelay = wallRevealDelays.get(revealId) ?? 0;
      return (
        <View style={styles.dateHeader}>
          <WallScrollReveal
            active={wallRevealDelays.has(revealId)}
            completedIds={completedRevealIds}
            delay={revealDelay}
            disabled={wallAnimationsDisabled}
            revealId={`${requestScope}:date:${revealId}`}
            scaleFrom={0.98}
            style={styles.dateHeaderEntrance}
            translateYFrom={12}
          >
            <View style={styles.dateHeaderRow}>
              <View style={styles.datePill}>
                <Text style={[styles.dateText, { color: colors.foreground }]}>{item.dateLabel}</Text>
              </View>
              {index === 0 ? renderMonthSelector() : null}
            </View>
          </WallScrollReveal>
        </View>
      );
    }

    const reflection: Reflection = item.item;
    const timeLabel = new Date(reflection.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const cat = REFLECTION_CATEGORIES[reflection.category];
    const isEditing = editingId === reflection.id;
    const isShareable = canShareReflection(reflection.message);
    const reflectionId = String(reflection.id);
    const isRevealed = wallRevealDelays.has(reflectionId);
    const revealDelay = wallRevealDelays.get(reflectionId) ?? 0;

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <WallScrollReveal
            active={isRevealed}
            completedIds={completedRevealIds}
            delay={revealDelay}
            disabled={wallAnimationsDisabled}
            revealId={`${requestScope}:time:${reflectionId}`}
            scaleFrom={0.98}
            translateYFrom={10}
          >
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{timeLabel}</Text>
          </WallScrollReveal>
          <View style={styles.timelineDotContainer}>
            <View style={styles.timelineIconSlot}>
              <WallScrollReveal
                active={isRevealed}
                completedIds={completedRevealIds}
                delay={revealDelay + 110}
                disabled={wallAnimationsDisabled}
                revealId={`${requestScope}:icon:${reflectionId}`}
                scaleFrom={0.9}
                translateYFrom={14}
              >
                <CategoryIcon category={cat.id} size={17} containerSize={31} />
              </WallScrollReveal>
            </View>
          </View>
        </View>

        <WallScrollReveal
          active={isRevealed}
          completedIds={completedRevealIds}
          delay={revealDelay + 220}
          disabled={wallAnimationsDisabled}
          revealId={`${requestScope}:card:${reflectionId}`}
          scaleFrom={0.985}
          style={styles.reflectionCardEntrance}
          translateYFrom={18}
        >
        <View style={styles.reflectionCard}>
          {isEditing && (
            <View style={styles.cardHeader}>
              <View style={[styles.cardCatPill, { backgroundColor: cat.bg }]}>
                <Text style={[styles.cardCatText, { color: cat.color }]}>{cat.label}</Text>
              </View>
              <Pressable
                testID={`delete-${reflection.id}`}
                accessibilityLabel="Borrar mensaje"
                accessibilityRole="button"
                disabled={deleteMutation.isPending}
                style={[styles.menuButton, deleteMutation.isPending && { opacity: 0.45 }]}
                onPress={() => requestDelete(reflection)}
              >
                <Feather name="trash-2" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}

          {isEditing ? (
            <View style={styles.editContainer}>
              <View style={styles.editCategoryRow}>
                {REFLECTION_CATEGORY_OPTIONS.map(c => (
                  <Pressable
                    key={c.id}
                    testID={`edit-cat-${c.id}`}
                    accessibilityLabel={`Seleccionar ${c.label}`}
                    onPress={() => setEditCategory(c.id as ReflectionCategory)}
                    style={[
                      styles.editCategoryPill,
                      editCategory === c.id && { borderColor: "rgba(249,249,249,0.1)" },
                    ]}
                  >
                    <CategoryIcon
                      category={c.id as ReflectionCategory}
                      size={16}
                      active={editCategory === c.id}
                      neutralWhenInactive
                      inactiveColor="#F9F9F9"
                    />
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[
                  styles.editInput,
                  {
                    color: colors.foreground,
                    borderColor: "rgba(249,249,249,0.1)",
                    backgroundColor: "rgba(0,0,0,0.1)",
                  },
                ]}
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
            <View style={styles.cardContentRow}>
              <View style={styles.cardMessageColumn}>
                <CollapsibleReflectionMessage message={reflection.message} color={colors.foreground} />
              </View>
              <View style={styles.cardActionsColumn}>
                <Pressable
                  testID={`menu-${reflection.id}`}
                  accessibilityLabel="Opciones"
                  accessibilityRole="button"
                  style={styles.menuButton}
                  onPress={() => beginEditing(reflection)}
                >
                  <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
                </Pressable>
                <Pressable
                  testID={`share-${reflection.id}`}
                  accessibilityLabel="Compartir"
                  accessibilityRole="button"
                  style={[styles.menuButton, !isShareable && { opacity: 0.3 }]}
                  disabled={!isShareable}
                  onPress={() => setShareReflection(reflection)}
                >
                  <Feather name="share" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
        </WallScrollReveal>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="feather" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {selectedMonth === today.getMonth()
          ? "¿De qué te has dado cuenta?"
          : "No compartiste reflexiones este mes"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {selectedMonth === today.getMonth()
          ? "Comparte tus reflexiones y registra tu viaje interior"
          : "Tampoco podrás hacerlo, a no ser que crees una maquina del tiempo."}
      </Text>
      {selectedMonth === today.getMonth() && (
        <Pressable
          testID="empty-back"
          style={styles.emptyButton}
          onPress={() => router.replace("/profile")}
        >
          <Text style={styles.emptyButtonText}>Escribir mi primera reflexión</Text>
        </Pressable>
      )}
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
          <Text style={[styles.mainTitle, { color: colors.foreground }]}>Muro expansivo</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <Pressable
            testID="filter-all"
            accessibilityLabel="Filtrar por Todos"
            style={[
              styles.filterPill,
              filter === "all" ? styles.filterPillSelected : styles.filterPillInactive,
            ]}
            onPress={() => {
              if (filter === "all") return;
              disableWallAnimations();
              setFilter("all");
            }}
          >
            <Text style={[styles.filterText, { color: filter === "all" ? "#060A0F" : "#F9F9F9" }]}>Todos</Text>
          </Pressable>
           {REFLECTION_CATEGORY_OPTIONS.map(cat => {
            const isActive = filter === cat.id;
            const IconComp = cat.iconFamily === "Feather" ? Feather : MaterialCommunityIcons;
            return (
              <Pressable
                key={cat.id}
                testID={`filter-${cat.id}`}
                accessibilityLabel={`Filtrar por ${cat.label}`}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillSelected : styles.filterPillInactive,
                ]}
                onPress={() => {
                  if (filter === cat.id) return;
                  disableWallAnimations();
                  setFilter(cat.id as ReflectionCategory);
                }}
              >
                <IconComp name={cat.icon as any} size={18} color={isActive ? cat.color : "#F9F9F9"} />
                <Text style={[styles.filterText, { color: isActive ? "#060A0F" : "#F9F9F9" }]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {flatData.length === 0 ? (
        <View style={styles.monthSelectorContainer}>
          {renderMonthSelector()}
        </View>
      ) : null}

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
          key={`wall-visit-${wallVisitKey}`}
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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
      <SlidingSheetModal
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        surfaceColor={theme.gradient[0]}
      >
        <Text style={[styles.actionSheetTitle, { color: colors.foreground }]}>
          Seleccionar mes · {selectedYear}
        </Text>
        <ScrollView style={styles.monthList} showsVerticalScrollIndicator={false}>
          {MONTH_NAMES.map((month, index) => {
            const isSelected = selectedMonth === index;
            const isFuture = index > today.getMonth();
            return (
              <Pressable
                key={month}
                testID={`month-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                disabled={isFuture}
                style={[
                  styles.monthOption,
                  isSelected && styles.monthOptionSelected,
                  isFuture && styles.monthOptionDisabled,
                ]}
                onPress={() => {
                  if (selectedMonth !== index) disableWallAnimations();
                  setSelectedMonth(index);
                  setMonthPickerVisible(false);
                }}
              >
                <Text style={[styles.monthOptionText, isSelected && styles.monthOptionTextSelected]}>
                  {month}
                </Text>
                {isSelected && <Feather name="check" size={18} color="#060A0F" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </SlidingSheetModal>
      {shareReflection && (
        <ReflectionShare reflection={shareReflection} onClose={() => setShareReflection(null)} />
      )}
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
    textAlign: 'center',
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
    justifyContent: 'center',
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    borderWidth: 1,
    gap: 8,
  },
  filterPillInactive: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  filterPillSelected: {
    backgroundColor: "#F9F9F9",
    borderColor: "transparent",
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
    alignItems: 'stretch',
    marginBottom: 31,
    marginTop: 16,
  },
  dateHeaderEntrance: {
    width: "100%",
  },
  dateHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePill: {
    backgroundColor: "transparent",
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
    width: 40,
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    marginBottom: 8,
  },
  timelineDotContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  timelineIconSlot: {
    width: 31,
    alignItems: 'center',
  },
  reflectionCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    padding: 16,
    transform: [{ translateY: -15 }],
  },
  reflectionCardEntrance: {
    flex: 1,
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
    transform: [{ translateY: -3 }],
  },
  cardCatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
  },
  cardContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  cardMessageColumn: {
    flex: 1,
    minWidth: 0,
  },
  cardActionsColumn: {
    alignItems: "center",
    gap: 10,
  },
  cardMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageContainer: {
    position: "relative",
  },
  messageMeasure: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },
  readMoreButton: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  readMoreText: {
    color: "#F9F9F9",
    fontSize: 12,
    fontWeight: "500",
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
    paddingBottom: 160,
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
    backgroundColor: "#F9F9F9",
  },
  emptyButtonText: {
    color: "#060A0F",
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
  monthSelectorContainer: {
    paddingHorizontal: 16,
    marginTop: 7,
    marginBottom: 4,
    alignItems: "flex-start",
  },
  monthSelectorButton: {
    height: 33,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthSelectorText: {
    color: "#F9F9F9",
    fontSize: 13,
    fontWeight: "700",
  },
  monthList: {
    maxHeight: 460,
  },
  monthOption: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthOptionSelected: {
    backgroundColor: "#F9F9F9",
  },
  monthOptionDisabled: {
    opacity: 0.28,
  },
  monthOptionText: {
    color: "#F9F9F9",
    fontSize: 15,
    fontWeight: "600",
  },
  monthOptionTextSelected: {
    color: "#060A0F",
  },
  modalRoot: {
    flex: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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