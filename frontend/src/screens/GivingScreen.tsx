import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle, History } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { SERIF, SANS } from "../styles/theme";
import { useAuth } from "../context/AuthContext";
import { givingService } from "../services/giving.service";
import { MainStackParamList } from "../navigation/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";


type GivingNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface GivingCategory {
  name: string;
  icon: string;
}

interface GivingSummary {
  label: string;
  value: string;
}

export default function GivingScreen() {
  const navigation = useNavigation<GivingNavigationProp>();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [service, setService] = useState("");
  const [done, setDone] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories: GivingCategory[] = [
    { name: "Tithe", icon: "🌾" },
    { name: "Offering", icon: "🙏" },
    { name: "Thanksgiving", icon: "✨" },
    { name: "Building Fund", icon: "🏛️" },
    { name: "Mission Support", icon: "🌍" },
    { name: "Special Seed", icon: "🌱" },
  ];

  const services = [
    "Sunday First Service",
    "Sunday Second Service",
    "Youth Service",
    "Midweek Fellowship",
    "Conference Giving",
  ];

  const quickAmounts = ["10", "50", "100", "200"];

  const handleSubmit = async () => {
    if (!service) return;
    setLoading(true);
    setError("");
    try {
      await givingService.submit(
        {
          category: category.toUpperCase().replace(/ /g, "_"),
          amount: parseFloat(amount),
          reference: reference || undefined,
          note: note || undefined,
          service,
        },
        token!
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const summaryItems: GivingSummary[] = [
    { label: "Category", value: category },
    { label: "Amount", value: `Ksh ${amount}` },
    { label: "Reference", value: reference || "—" },
    { label: "Service", value: service },
  ];

  // Success Screen
  if (done) {
    return (
        <SafeAreaView style={styles.safeAreaDark} edges={["top", "bottom"]}>
         <StatusBar barStyle="light-content" backgroundColor="#07102A" />
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={40} color="#E8C77A" />
            </View>
            <Text style={styles.successLabel}>Giving Received</Text>
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successDescription}>
              Your {category} of{" "}
              <Text style={styles.successAmount}>Ksh {amount}</Text> has been
              submitted successfully.
            </Text>

            {/* Summary Card */}
            <View style={styles.successSummaryCard}>
              {summaryItems.map(({ label, value }, index) => (
                <View
                  key={label}
                  style={[
                    styles.successSummaryRow,
                    index > 0 && styles.successSummaryRowBorder,
                  ]}
                >
                  <Text style={styles.successSummaryLabel}>{label}</Text>
                  <Text style={styles.successSummaryValue}>{value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.navigate("GivingHistory")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View giving history"
            >
              <History size={15} color="#1B3A7A" />
              <Text style={styles.historyButtonText}>View History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={step === 1 ? "Go back" : "Previous step"}
            >
              <ArrowLeft size={16} color="#0D1B3E" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Give an Offering</Text>
              <Text style={styles.headerStep}>Step {step} of 3</Text>
            </View>
            <View style={styles.stepIndicators}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    {
                      width: s <= step ? 24 : 12,
                      backgroundColor: s <= step ? "#C4933A" : "#E8E4DC",
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1: Choose Category */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Choose Category</Text>
                  <Text style={styles.stepDescription}>
                    What kind of offering are you giving?
                  </Text>
                </View>
                <View style={styles.categoryGrid}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.name}
                      onPress={() => setCategory(c.name)}
                      style={[
                        styles.categoryCard,
                        {
                          backgroundColor:
                            category === c.name ? "#EDF0F8" : "#F7F5F0",
                          borderColor:
                            category === c.name ? "#1B3A7A" : "transparent",
                        },
                      ]}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityLabel={c.name}
                      accessibilityState={{ selected: category === c.name }}
                    >
                      <Text style={styles.categoryIcon}>{c.icon}</Text>
                      <Text style={styles.categoryName}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !category && styles.buttonDisabled,
                  ]}
                  onPress={() => category && setStep(2)}
                  activeOpacity={0.8}
                  disabled={!category}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to next step"
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Gift Details */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Gift Details</Text>
                  <Text style={styles.stepDescription}>
                    Enter your giving amount and details
                  </Text>
                </View>

                {/* Amount Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Amount (USD)</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.amountInputContainer,
                      focusedField === "amount" && styles.inputFocused,
                    ]}
                  >
                    <Text style={styles.dollarSign}>Ksh</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor="#C0B8B0"
                      keyboardType="decimal-pad"
                      onFocus={() => setFocusedField("amount")}
                      onBlur={() => setFocusedField(null)}
                      accessibilityLabel="Enter amount"
                    />
                  </View>
                </View>

                {/* Quick Amounts */}
                <View style={styles.quickAmounts}>
                  {quickAmounts.map((a) => (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setAmount(a)}
                      style={[
                        styles.quickAmountButton,
                        {
                          backgroundColor:
                            amount === a ? "#1B3A7A" : "#F0EDE6",
                        },
                      ]}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Ksh{a}`}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          {
                            color: amount === a ? "#FFFFFF" : "#7B7464",
                          },
                        ]}
                      >
                        Ksh{a}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reference Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Reference (optional)</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "reference" && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={reference}
                      onChangeText={setReference}
                      placeholder="e.g. Family Tithe"
                      placeholderTextColor="#C0B8B0"
                      autoCapitalize="words"
                      onFocus={() => setFocusedField("reference")}
                      onBlur={() => setFocusedField(null)}
                      accessibilityLabel="Enter reference"
                    />
                  </View>
                </View>

                {/* Note Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Note (optional)</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.noteInputContainer,
                      focusedField === "note" && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={[styles.input, styles.noteInput]}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Add a note or prayer with your offering..."
                      placeholderTextColor="#C0B8B0"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      onFocus={() => setFocusedField("note")}
                      onBlur={() => setFocusedField(null)}
                      accessibilityLabel="Add a note"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !amount && styles.buttonDisabled,
                  ]}
                  onPress={() => amount && setStep(3)}
                  activeOpacity={0.8}
                  disabled={!amount}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to next step"
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Select Service */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Select Service</Text>
                  <Text style={styles.stepDescription}>
                    Which service is this offering for?
                  </Text>
                </View>

                <View style={styles.servicesList}>
                  {services.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setService(s)}
                      style={[
                        styles.serviceCard,
                        {
                          backgroundColor:
                            service === s ? "#EDF0F8" : "#F7F5F0",
                          borderColor:
                            service === s ? "#1B3A7A" : "transparent",
                        },
                      ]}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityLabel={s}
                      accessibilityState={{ selected: service === s }}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor:
                              service === s ? "#1B3A7A" : "#C0B8B0",
                            backgroundColor:
                              service === s ? "#1B3A7A" : "transparent",
                          },
                        ]}
                      >
                        {service === s && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.serviceText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryCategory}>{category}</Text>
                    <Text style={styles.summaryAmount}>Ksh{amount}</Text>
                  </View>
                </View>

                {error && (
                  <Text style={styles.errorMessage}>{error}</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!service || loading) && styles.buttonDisabled,
                  ]}
                  onPress={() => service && handleSubmit()}
                  activeOpacity={0.8}
                  disabled={!service || loading}
                  accessibilityRole="button"
                  accessibilityLabel="Submit offering"
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? "Submitting..." : "Submit Offering"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaDark: {
    flex: 1,
    backgroundColor: "#07102A",
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDE6",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  headerStep: {
    fontSize: 10,
    color: "#7B7464",
    fontFamily: SANS,
  },
  stepIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // Step Content Styles
  stepContent: {
    gap: 16,
  },
  stepHeader: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SERIF,
  },
  stepDescription: {
    fontSize: 11,
    color: "#7B7464",
    marginTop: 4,
    fontFamily: SANS,
  },
  // Category Grid Styles
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0D1B3E",
    lineHeight: 16,
    fontFamily: SANS,
  },
  // Field Styles
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#7B7464",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: SANS,
  },
  inputContainer: {
    backgroundColor: "#F7F5F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: "#1B3A7A",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    color: "#0D1B3E",
    fontFamily: SANS,
    padding: 0,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C4933A",
    fontFamily: SANS,
  },
  amountInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 20,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
    padding: 0,
  },
  noteInputContainer: {
    minHeight: 100,
  },
  noteInput: {
    minHeight: 80,
  },
  // Quick Amounts Styles
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: SANS,
  },
  // Services Styles
  servicesList: {
    gap: 8,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  serviceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  // Summary Styles
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FDF6E8",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#C4933A",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: SANS,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCategory: {
    fontSize: 14,
    color: "#7B7464",
    fontFamily: SANS,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  errorMessage: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 8,
    marginBottom: 8,
    fontFamily: SANS,
  },
  // Button Styles
  primaryButton: {
    backgroundColor: "#1B3A7A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: SANS,
  },
  submitButton: {
    backgroundColor: "#C4933A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: SANS,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,199,122,0.15)",
    borderWidth: 2,
    borderColor: "rgba(232,199,122,0.3)",
    marginBottom: 24,
  },
  successLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#E8C77A",
    marginBottom: 8,
    fontFamily: SANS,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: SERIF,
  },
  successDescription: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: SANS,
  },
  successAmount: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  successSummaryCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  successSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  successSummaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  successSummaryLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: SANS,
  },
  successSummaryValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: SANS,
  },
  historyButton: {
    width: "100%",
    backgroundColor: "#E8C77A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  historyButtonText: {
    color: "#1B3A7A",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: SANS,
  },
  doneButton: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  doneButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: SANS,
  },
});