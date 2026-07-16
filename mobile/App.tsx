import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const COLORS = {
  page: "#EAF2FF",
  card: "#FFFFFF",
  surface: "#F8FAFC",
  subtle: "#E0F2FE",
  border: "#BFDBFE",
  borderStrong: "#7DD3FC",
  navy: "#081A33",
  navySoft: "#0F2748",
  primary: "#0F172A",
  secondary: "#475569",
  muted: "#64748B",
  blue: "#2563EB",
  sky: "#0284C7",
  teal: "#0F766E",
  green: "#16A34A",
  red: "#E11D48",
};

const TOKEN_KEY = "agrivault.mobile.token";
const PROFILE_KEY = "agrivault.mobile.profile";
const API_BASE_KEY = "agrivault.mobile.apiBase";
const DRAFTS_KEY = "agrivault.mobile.captureDrafts";
const DEFAULT_API_BASE = "http://localhost:3000";

type Tab = "home" | "capture" | "records" | "settings";
type DraftType = "activity" | "sale" | "payroll";
type DraftStatus = "pending" | "synced" | "failed";

type Profile = {
  user: { id: string; name?: string | null; email: string; role: string };
  farm: { id: string; name: string; location: string } | null;
  subscription?: { status: string; tierName: string } | null;
};

type Dashboard = {
  farmName: string;
  userName?: string | null;
  totalFields: number;
  totalArea: number;
  activeCrops: number;
  activeEmployees: number;
  totalEmployees: number;
  income: number;
  expense: number;
  net: number;
  recentActivities: Array<{
    id: string;
    activityType: string;
    fieldName: string;
    cropName?: string | null;
    date: string;
  }>;
};

type Field = {
  id: string;
  name: string;
  totalArea: number;
  cultivatableArea: number;
  soilType: string;
  allocatedArea: number;
  cropCount: number;
  crops: string[];
};

type SeasonalTemplate = {
  id: string;
  name: string;
  crop: string;
  season: string;
  description: string;
  activities: Array<{ activityType: string; timing: string; notes: string }>;
  payroll: Array<{ role: string; payRateUnit: string; notes: string }>;
  sales: Array<{ category: string; description: string }>;
};

type CaptureDraft = {
  id: string;
  type: DraftType;
  status: DraftStatus;
  createdAt: string;
  payload: Record<string, string>;
  error?: string;
};

const emptyCapture = {
  date: new Date().toISOString().slice(0, 10),
  fieldId: "",
  activityType: "Field scouting",
  notes: "",
  amount: "",
  description: "",
  season: "",
  employeeName: "",
  role: "Field assistant",
  payRate: "",
  payRateUnit: "day",
  phone: "",
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);

  useEffect(() => {
    async function boot() {
      const [storedToken, storedProfile, storedApiBase] = await Promise.all([
        mobileStore.getItem(TOKEN_KEY),
        mobileStore.getItem(PROFILE_KEY),
        mobileStore.getItem(API_BASE_KEY),
      ]);
      setToken(storedToken);
      if (storedProfile) setProfile(JSON.parse(storedProfile));
      if (storedApiBase) setApiBase(storedApiBase);
      setBooting(false);
    }
    boot();
  }, []);

  const signIn = async (nextToken: string, nextProfile: Profile, nextApiBase: string) => {
    await Promise.all([
      mobileStore.setItem(TOKEN_KEY, nextToken),
      mobileStore.setItem(PROFILE_KEY, JSON.stringify(nextProfile)),
      mobileStore.setItem(API_BASE_KEY, nextApiBase),
    ]);
    setToken(nextToken);
    setProfile(nextProfile);
    setApiBase(nextApiBase);
  };

  const signOut = async () => {
    await Promise.all([
      mobileStore.removeItem(TOKEN_KEY),
      mobileStore.removeItem(PROFILE_KEY),
      mobileStore.removeItem(DRAFTS_KEY),
    ]);
    setToken(null);
    setProfile(null);
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={COLORS.blue} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {token && profile ? (
        <Shell apiBase={apiBase} profile={profile} token={token} onSignOut={signOut} />
      ) : (
        <LoginScreen defaultApiBase={apiBase} onSignIn={signIn} />
      )}
    </>
  );
}

function LoginScreen({
  defaultApiBase,
  onSignIn,
}: {
  defaultApiBase: string;
  onSignIn: (token: string, profile: Profile, apiBase: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/mobile/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Login failed");
      await onSignIn(data.token, { user: data.user, farm: data.farm, subscription: data.subscription }, apiBase);
    } catch (error: any) {
      setError(error.message);
      Alert.alert("Could not sign in", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.login}>
          <View style={styles.loginHero}>
            <View style={styles.brandRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>F</Text>
              </View>
              <View>
                <Text style={styles.brandName}>AgriVault</Text>
                <Text style={styles.brandMeta}>Field operations</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Capture farm work from anywhere.</Text>
            <Text style={styles.heroCopy}>Offline drafts, guided seasonal records, and export-ready farm evidence for mobile teams.</Text>
            <View style={styles.featureRow}>
              <Text style={styles.featurePill}>Offline first</Text>
              <Text style={styles.featurePill}>Blue records</Text>
              <Text style={styles.featurePill}>Team ready</Text>
            </View>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtext}>Use the same account as the AgriVault web dashboard.</Text>
            <Input label="API server" value={apiBase} onChangeText={setApiBase} autoCapitalize="none" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <PrimaryButton label={loading ? "Signing in..." : "Sign in"} onPress={submit} disabled={loading} />
            <Text style={styles.helpText}>
              Android emulator usually needs http://10.0.2.2:3000. iOS simulator can use http://localhost:3000.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Shell({
  apiBase,
  profile,
  token,
  onSignOut,
}: {
  apiBase: string;
  profile: Profile;
  token: string;
  onSignOut: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const client = useMemo(() => createClient(apiBase, token), [apiBase, token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>F</Text>
          </View>
          <View>
            <Text style={styles.kicker}>{profile.farm?.location ?? "AgriVault"}</Text>
            <Text style={styles.headerTitle}>{profile.farm?.name ?? "No farm selected"}</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{profile.subscription?.tierName ?? "Trial"}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {tab === "home" && <HomeScreen client={client} />}
        {tab === "capture" && <CaptureScreen client={client} />}
        {tab === "records" && <RecordsScreen client={client} />}
        {tab === "settings" && <SettingsScreen apiBase={apiBase} profile={profile} onSignOut={onSignOut} />}
      </View>

      <View style={styles.tabBar}>
        <TabButton active={tab === "home"} label="Home" icon="H" onPress={() => setTab("home")} />
        <TabButton active={tab === "capture"} label="Capture" icon="C" onPress={() => setTab("capture")} />
        <TabButton active={tab === "records"} label="Records" icon="R" onPress={() => setTab("records")} />
        <TabButton active={tab === "settings"} label="Settings" icon="S" onPress={() => setTab("settings")} />
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ client }: { client: ReturnType<typeof createClient> }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [dashboardData, fieldsData] = await Promise.all([
      client.get<Dashboard>("/api/mobile/dashboard"),
      client.get<Field[]>("/api/mobile/fields"),
    ]);
    setDashboard(dashboardData);
    setFields(fieldsData);
  }, [client]);

  useEffect(() => {
    load().catch((error) => Alert.alert("Sync issue", error.message));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={styles.screen}>
      <View style={styles.pageIntro}>
        <Text style={styles.screenEyebrow}>Today</Text>
        <Text style={styles.screenTitle}>Farm overview</Text>
        <Text style={styles.bodyText}>A quick operational snapshot for your active farm.</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Net position</Text>
        <Text style={styles.summaryValue}>MWK {fmt(dashboard?.net ?? 0)}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryMeta}>Income MWK {fmt(dashboard?.income ?? 0)}</Text>
          <Text style={styles.summaryMeta}>Expenses MWK {fmt(dashboard?.expense ?? 0)}</Text>
        </View>
      </View>
      <View style={styles.metricGrid}>
        <Metric label="Fields" value={dashboard?.totalFields ?? 0} />
        <Metric label="Area" value={`${(dashboard?.totalArea ?? 0).toFixed(1)} ha`} />
        <Metric label="Crops" value={dashboard?.activeCrops ?? 0} />
        <Metric label="Workers" value={dashboard?.activeEmployees ?? 0} />
      </View>

      <Text style={styles.sectionTitle}>Fields</Text>
      {fields.length === 0 ? <EmptyState title="No fields yet" body="Create fields in the web dashboard or mobile API, then pull to refresh." /> : fields.map((field) => (
        <View key={field.id} style={styles.listCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.listTitle}>{field.name}</Text>
            <Text style={styles.badge}>{field.cropCount} crops</Text>
          </View>
          <Text style={styles.listMeta}>{field.soilType} - {field.cultivatableArea} ha cultivatable</Text>
          <Text style={styles.listMeta}>Allocated {field.allocatedArea.toFixed(1)} ha</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Recent activity</Text>
      {(dashboard?.recentActivities ?? []).length === 0 ? <EmptyState title="No activity yet" body="Field notes and seasonal work will appear here after sync." /> : (dashboard?.recentActivities ?? []).map((activity) => (
        <View key={activity.id} style={styles.listCard}>
          <Text style={styles.listTitle}>{activity.activityType}</Text>
          <Text style={styles.listMeta}>{activity.fieldName}{activity.cropName ? ` - ${activity.cropName}` : ""}</Text>
          <Text style={styles.listMeta}>{new Date(activity.date).toLocaleDateString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function CaptureScreen({ client }: { client: ReturnType<typeof createClient> }) {
  const [fields, setFields] = useState<Field[]>([]);
  const [templates, setTemplates] = useState<SeasonalTemplate[]>([]);
  const [type, setType] = useState<DraftType>("activity");
  const [payload, setPayload] = useState<Record<string, string>>(emptyCapture);
  const [drafts, setDrafts] = useState<CaptureDraft[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    mobileStore.getItem(DRAFTS_KEY).then((saved: string | null) => saved && setDrafts(JSON.parse(saved)));
    client.get<Field[]>("/api/mobile/fields").then(setFields).catch(() => setFields([]));
    client.get<{ templates: SeasonalTemplate[] }>("/api/mobile/templates")
      .then((data) => setTemplates(data.templates))
      .catch(() => setTemplates([]));
  }, [client]);

  useEffect(() => {
    mobileStore.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  }, [drafts]);

  function setValue(key: string, value: string) {
    setPayload((current) => ({ ...current, [key]: value }));
  }

  function useTemplate(template: SeasonalTemplate) {
    const activity = template.activities[0];
    setPayload((current) => ({
      ...current,
      activityType: activity?.activityType ?? current.activityType,
      notes: activity ? `${activity.timing}: ${activity.notes}` : current.notes,
      season: template.season,
      role: template.payroll[0]?.role ?? current.role,
      payRateUnit: template.payroll[0]?.payRateUnit ?? current.payRateUnit,
      description: template.sales[0]?.description ?? current.description,
    }));
  }

  function saveDraft() {
    if (type === "activity" && !payload.fieldId) return Alert.alert("Field required", "Select a field before saving this activity.");
    if (type === "sale" && (!payload.amount || !payload.description)) return Alert.alert("Sale incomplete", "Amount and description are required.");
    if (type === "payroll" && (!payload.employeeName || !payload.payRate)) return Alert.alert("Payroll incomplete", "Worker name and pay rate are required.");

    setDrafts((current) => [
      {
        id: `${Date.now()}`,
        type,
        status: "pending",
        createdAt: new Date().toISOString(),
        payload,
      },
      ...current,
    ]);
    setPayload(emptyCapture);
  }

  async function sync() {
    setSyncing(true);
    for (const draft of drafts.filter((item) => item.status !== "synced")) {
      try {
        await syncDraft(client, draft);
        setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, status: "synced", error: undefined } : item));
      } catch (error: any) {
        setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, status: "failed", error: error.message } : item));
      }
    }
    setSyncing(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.screenEyebrow}>Offline queue</Text>
          <Text style={styles.screenTitle}>Field capture</Text>
        </View>
        <Pressable style={styles.syncButton} onPress={sync} disabled={syncing}>
          <Text style={styles.syncText}>{syncing ? "Syncing" : `Sync ${drafts.filter((d) => d.status !== "synced").length}`}</Text>
        </Pressable>
      </View>

      <View style={styles.segment}>
        {(["activity", "sale", "payroll"] as DraftType[]).map((item) => (
          <Pressable key={item} style={[styles.segmentButton, type === item && styles.segmentActive]} onPress={() => setType(item)}>
            <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>{titleCase(item)}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateRail}>
        {templates.map((template) => (
          <Pressable key={template.id} style={styles.templateChip} onPress={() => useTemplate(template)}>
            <Text style={styles.templateTitle}>{template.crop}</Text>
            <Text style={styles.templateMeta}>{template.season}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{titleCase(type)} record</Text>
        {type === "activity" && (
          <>
            <PickerLike label="Field" value={payload.fieldId} onChange={setValue} fieldKey="fieldId" options={fields.map((f) => ({ label: f.name, value: f.id }))} />
            <Input label="Date" value={payload.date} onChangeText={(v) => setValue("date", v)} />
            <Input label="Activity" value={payload.activityType} onChangeText={(v) => setValue("activityType", v)} />
            <Input label="Season" value={payload.season} onChangeText={(v) => setValue("season", v)} />
            <Input label="Notes" value={payload.notes} onChangeText={(v) => setValue("notes", v)} multiline />
          </>
        )}
        {type === "sale" && (
          <>
            <Input label="Date" value={payload.date} onChangeText={(v) => setValue("date", v)} />
            <Input label="Amount" value={payload.amount} onChangeText={(v) => setValue("amount", v)} keyboardType="numeric" />
            <Input label="Season" value={payload.season} onChangeText={(v) => setValue("season", v)} />
            <PickerLike label="Field" value={payload.fieldId} onChange={setValue} fieldKey="fieldId" options={fields.map((f) => ({ label: f.name, value: f.id }))} />
            <Input label="Description" value={payload.description} onChangeText={(v) => setValue("description", v)} multiline />
          </>
        )}
        {type === "payroll" && (
          <>
            <Input label="Worker name" value={payload.employeeName} onChangeText={(v) => setValue("employeeName", v)} />
            <Input label="Role" value={payload.role} onChangeText={(v) => setValue("role", v)} />
            <Input label="Pay rate" value={payload.payRate} onChangeText={(v) => setValue("payRate", v)} keyboardType="numeric" />
            <Input label="Pay unit" value={payload.payRateUnit} onChangeText={(v) => setValue("payRateUnit", v)} />
            <Input label="Phone" value={payload.phone} onChangeText={(v) => setValue("phone", v)} keyboardType="phone-pad" />
          </>
        )}
        <PrimaryButton label="Save offline draft" onPress={saveDraft} />
      </View>

      <Text style={styles.sectionTitle}>Draft queue</Text>
      {drafts.length === 0 ? <EmptyState title="No drafts saved" body="Capture a field record and sync when you have a connection." /> : drafts.map((draft) => (
        <View key={draft.id} style={styles.listCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.listTitle}>{titleCase(draft.type)}</Text>
            <Text style={[styles.badge, draft.status === "failed" && styles.badgeDanger]}>{draft.status}</Text>
          </View>
          <Text style={styles.listMeta}>{draft.payload.activityType || draft.payload.description || draft.payload.employeeName}</Text>
          {draft.error ? <Text style={styles.errorText}>{draft.error}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

function RecordsScreen({ client }: { client: ReturnType<typeof createClient> }) {
  const [summary, setSummary] = useState<any>(null);
  const packs = [
    ["loan", "Loan readiness", "Cashflow, field area, staff capacity, and repayment evidence."],
    ["buyer", "Buyer records", "Traceability, activities, crop volumes, and sales evidence."],
    ["audit", "Audit file", "Activity, input, payroll, finance, and inventory trail."],
    ["insurance", "Insurance file", "Acreage, crop status, activity proof, and harvest evidence."],
  ];

  useEffect(() => {
    client.get<Dashboard>("/api/mobile/dashboard").then(setSummary).catch(() => null);
  }, [client]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.pageIntro}>
        <Text style={styles.screenEyebrow}>Evidence</Text>
        <Text style={styles.screenTitle}>Record packs</Text>
      </View>
      <Text style={styles.bodyText}>Use these packs to prepare farm evidence for lenders, buyers, auditors, and insurers.</Text>
      <View style={styles.metricGrid}>
        <Metric label="Fields" value={summary?.totalFields ?? 0} />
        <Metric label="Crops" value={summary?.activeCrops ?? 0} />
        <Metric label="Employees" value={summary?.activeEmployees ?? 0} />
        <Metric label="Net" value={`MWK ${fmt(summary?.net ?? 0)}`} />
      </View>
      {packs.map(([type, title, description]) => (
        <View key={type} style={styles.listCard}>
          <Text style={styles.listTitle}>{title}</Text>
          <Text style={styles.listMeta}>{description}</Text>
          <Text style={styles.recordHint}>Export CSV from web: /api/export/records?type={type}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function SettingsScreen({
  apiBase,
  profile,
  onSignOut,
}: {
  apiBase: string;
  profile: Profile;
  onSignOut: () => Promise<void>;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.pageIntro}>
        <Text style={styles.screenEyebrow}>Profile</Text>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.bodyText}>{profile.user.name ?? profile.user.email}</Text>
        <Text style={styles.bodyText}>{profile.user.email}</Text>
        <Text style={styles.helpText}>API server: {apiBase}</Text>
        <PrimaryButton label="Sign out" onPress={onSignOut} />
      </View>
    </ScrollView>
  );
}

function createClient(apiBase: string, token: string) {
  const base = apiBase.replace(/\/$/, "");
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Request failed");
    return data as T;
  }
  return {
    get: <T,>(path: string) => request<T>(path),
    post: <T,>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  };
}

const mobileStore = {
  async getItem(key: string) {
    if (Platform.OS === "web") return window.localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

async function syncDraft(client: ReturnType<typeof createClient>, draft: CaptureDraft) {
  if (draft.type === "activity") {
    return client.post("/api/mobile/activities", {
      fieldId: draft.payload.fieldId,
      activityType: draft.payload.activityType,
      date: draft.payload.date,
      notes: draft.payload.notes,
    });
  }
  if (draft.type === "sale") {
    return client.post("/api/mobile/finance", {
      type: "Income",
      category: "Crop sales",
      amount: draft.payload.amount,
      date: draft.payload.date,
      description: draft.payload.description,
      season: draft.payload.season,
      fieldId: draft.payload.fieldId || null,
    });
  }
  return client.post("/api/mobile/employees", {
    name: draft.payload.employeeName,
    role: draft.payload.role,
    payRate: draft.payload.payRate,
    payRateUnit: draft.payload.payRateUnit,
    phone: draft.payload.phone,
  });
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Input({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        style={[styles.input, props.multiline && styles.textArea]}
        {...props}
      />
    </View>
  );
}

function PickerLike({
  label,
  value,
  fieldKey,
  options,
  onChange,
}: {
  label: string;
  value: string;
  fieldKey: string;
  options: Array<{ label: string; value: string }>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <FlatList
        horizontal
        data={options}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.optionChip, value === item.value && styles.optionChipActive]}
            onPress={() => onChange(fieldKey, item.value)}
          >
            <Text style={[styles.optionText, value === item.value && styles.optionTextActive]}>{item.label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyDot} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function TabButton({ active, label, icon, onPress }: { active: boolean; label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <View style={[styles.tabIcon, active && styles.tabIconActive]}>
        <Text style={[styles.tabIconText, active && styles.tabIconTextActive]}>{icon}</Text>
      </View>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(value);
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.page },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.page },
  login: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 18 },
  loginHero: {
    backgroundColor: COLORS.navy,
    borderRadius: 30,
    padding: 22,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: COLORS.blue, fontSize: 25, fontWeight: "900" },
  brandName: { color: "white", fontSize: 19, fontWeight: "900" },
  brandMeta: { color: "#93C5FD", fontSize: 11, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase", marginTop: 2 },
  heroTitle: { fontSize: 31, fontWeight: "900", color: "white", lineHeight: 36 },
  heroCopy: { color: "#BFDBFE", fontSize: 15, lineHeight: 22 },
  featureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featurePill: {
    color: "#DBEAFE",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.2)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "900",
  },
  loginCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    padding: 18,
    gap: 13,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 7,
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1 },
  headerLogo: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  headerLogoText: { color: COLORS.blue, fontWeight: "900", fontSize: 18 },
  kicker: { color: "#93C5FD", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.1 },
  headerTitle: { color: "white", fontSize: 19, fontWeight: "900", marginTop: 1 },
  statusPill: { backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: "rgba(191,219,254,0.22)" },
  statusText: { color: "#BFDBFE", fontSize: 12, fontWeight: "900" },
  content: { flex: 1 },
  screen: { padding: 18, gap: 15, paddingBottom: 28 },
  pageIntro: { gap: 4 },
  screenEyebrow: { color: COLORS.sky, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  screenTitle: { fontSize: 27, fontWeight: "900", color: COLORS.primary, lineHeight: 32 },
  bodyText: { color: COLORS.secondary, fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontSize: 16, color: COLORS.primary, fontWeight: "900", marginTop: 12 },
  cardTitle: { color: COLORS.primary, fontSize: 18, fontWeight: "900" },
  cardSubtext: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  summaryCard: {
    backgroundColor: COLORS.navySoft,
    borderRadius: 24,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.18)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  summaryLabel: { color: "#93C5FD", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2 },
  summaryValue: { color: "white", fontSize: 29, fontWeight: "900" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryMeta: { color: "#BFDBFE", fontSize: 12, fontWeight: "800" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    padding: 17,
    gap: 13,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    width: "47.8%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  metricLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  metricValue: { color: COLORS.primary, fontSize: 22, fontWeight: "900", marginTop: 5 },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    padding: 15,
    gap: 6,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  listTitle: { color: COLORS.primary, fontSize: 15, fontWeight: "900" },
  listMeta: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  badge: { color: COLORS.sky, backgroundColor: COLORS.subtle, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: "900" },
  badgeDanger: { color: COLORS.red, backgroundColor: "#FFE4E6" },
  errorText: { color: COLORS.red, fontSize: 12, fontWeight: "700" },
  syncButton: { backgroundColor: COLORS.blue, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 14 },
  syncText: { color: "white", fontWeight: "900", fontSize: 12 },
  segment: { backgroundColor: "#DCEBFF", borderRadius: 18, padding: 5, flexDirection: "row", borderWidth: 1, borderColor: "#C7DDFF" },
  segmentButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 14 },
  segmentActive: { backgroundColor: COLORS.blue },
  segmentText: { color: COLORS.secondary, fontWeight: "800" },
  segmentTextActive: { color: "white" },
  templateRail: { marginHorizontal: -18, paddingHorizontal: 18 },
  templateChip: { width: 178, backgroundColor: COLORS.card, borderWidth: 1, borderColor: "#D8E8FF", borderRadius: 18, padding: 13, marginRight: 10 },
  templateTitle: { color: COLORS.primary, fontWeight: "900" },
  templateMeta: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  inputGroup: { gap: 6 },
  inputLabel: { color: COLORS.secondary, fontSize: 12, fontWeight: "900" },
  input: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 13,
    color: COLORS.primary,
    fontSize: 15,
  },
  textArea: { minHeight: 92, textAlignVertical: "top", paddingTop: 12 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "#C7DDFF", marginRight: 8, backgroundColor: COLORS.surface },
  optionChipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  optionText: { color: COLORS.secondary, fontWeight: "800", fontSize: 12 },
  optionTextActive: { color: "white" },
  primaryButton: { backgroundColor: COLORS.blue, minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2, shadowColor: COLORS.blue, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 15, elevation: 4 },
  primaryButtonText: { color: "white", fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  helpText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: "#D8E8FF",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    gap: 6,
  },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 14, gap: 3 },
  tabButtonActive: { backgroundColor: "#EFF6FF" },
  tabIcon: { width: 24, height: 24, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#E2E8F0" },
  tabIconActive: { backgroundColor: COLORS.blue },
  tabIconText: { color: COLORS.muted, fontWeight: "900", fontSize: 11 },
  tabIconTextActive: { color: "white" },
  tabText: { color: COLORS.muted, fontWeight: "800", fontSize: 11 },
  tabTextActive: { color: COLORS.blue },
  recordHint: { color: COLORS.sky, fontSize: 12, fontWeight: "800", marginTop: 6 },
  emptyState: {
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "#D8E8FF",
    borderRadius: 18,
    padding: 18,
    alignItems: "flex-start",
    gap: 7,
  },
  emptyDot: { width: 28, height: 5, borderRadius: 999, backgroundColor: COLORS.borderStrong },
  emptyTitle: { color: COLORS.primary, fontSize: 15, fontWeight: "900" },
  emptyBody: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
});
