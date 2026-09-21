import Constants from "expo-constants";
import React, { createContext, useContext, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

/** Identificador del entitlement premium configurado en RevenueCat (seed script). */
export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "premium";
const CUSTOMER_INFO_QUERY_KEY = ["revenuecat", "customer-info"] as const;
let revenueCatConfigured = false;

function getRevenueCatApiKey() {
  if (!REVENUECAT_ENTITLEMENT_IDENTIFIER) {
    throw new Error("RevenueCat Entitlement Identifier not provided");
  }

  // Solo se necesita la key relevante para el runtime actual, no las tres.
  const useTestKey =
    __DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient";

  let apiKey: string | undefined;
  if (useTestKey) {
    apiKey = REVENUECAT_TEST_API_KEY;
  } else if (Platform.OS === "ios") {
    apiKey = REVENUECAT_IOS_API_KEY;
  } else if (Platform.OS === "android") {
    apiKey = REVENUECAT_ANDROID_API_KEY;
  } else {
    apiKey = REVENUECAT_TEST_API_KEY;
  }

  if (!apiKey) {
    throw new Error("RevenueCat Public API Key not found");
  }

  return apiKey;
}

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) throw new Error("RevenueCat Public API Key not found");

  void Purchases.setLogLevel(
    __DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.WARN,
  );
  Purchases.configure({ apiKey });
  revenueCatConfigured = true;

  console.log("Configured RevenueCat");
}

function useSubscriptionContext() {
  const queryClient = useQueryClient();
  const customerInfoQuery = useQuery<CustomerInfo>({
    queryKey: CUSTOMER_INFO_QUERY_KEY,
    queryFn: async () => {
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
    retry: false,
    enabled: revenueCatConfigured,
  });

  const offeringsQuery = useQuery<PurchasesOfferings>({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    staleTime: 300 * 1000,
    retry: false,
    enabled: revenueCatConfigured,
  });

  useEffect(() => {
    if (!revenueCatConfigured) return;
    const listener = (info: CustomerInfo) => {
      queryClient.setQueryData(CUSTOMER_INFO_QUERY_KEY, info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [queryClient]);

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: (info) => {
      queryClient.setQueryData(CUSTOMER_INFO_QUERY_KEY, info);
      void customerInfoQuery.refetch();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return Purchases.restorePurchases();
    },
    onSuccess: (info) => {
      queryClient.setQueryData(CUSTOMER_INFO_QUERY_KEY, info);
      void customerInfoQuery.refetch();
    },
  });

  const isSubscribed =
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !==
    undefined;
  const subscriptionStatus =
    !revenueCatConfigured || customerInfoQuery.isError || !customerInfoQuery.data
      ? "unknown"
      : isSubscribed
        ? "active"
        : "inactive";

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isSubscribed,
    subscriptionStatus,
    isLoading:
      revenueCatConfigured
      && (customerInfoQuery.isLoading || offeringsQuery.isLoading),
    isConfigured: revenueCatConfigured,
    customerInfoError: !revenueCatConfigured || customerInfoQuery.isError,
    offeringsError: offeringsQuery.isError,
    refreshCustomerInfo: customerInfoQuery.refetch,
    refreshOfferings: offeringsQuery.refetch,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
