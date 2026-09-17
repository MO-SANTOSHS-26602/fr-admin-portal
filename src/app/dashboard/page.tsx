"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { withBasePath } from "../_lib/constants";

type LiCodeRecord = {
  AgentUID?: string | number | null;
};

type OfferRecord = {
  SrNo?: string | number | null;
  frCode?: string | number | null;
  raCode?: string | number | null;
  referDate?: string | Date | null;
  upfrontIncentive?: string | number | null;
  revShare?: string | number | null;
  monthlyCap?: string | number | null;
  Periodicity?: string | number | null;
  PMS?: string | number | null;
  PE?: string | number | null;
  FixedIncome?: string | number | null;
  MF?: string | number | null;
  Insurance?: string | number | null;
};

function fieldValue(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const textValue = value.toString().trim();
  if (/^-?\d+(\.\d+)?$/.test(textValue)) {
    return Math.trunc(Number(textValue)).toString();
  }

  return textValue;
}

function isValidPercentageInput(value: string) {
  return /^\d{0,3}$/.test(value) && (value === "" || Number(value) <= 100);
}

export default function Page() {
  const router = useRouter();
  const [frCode, setFrCode] = useState("");
  const [liCode, setLiCode] = useState("");
  const [liCodeOptions, setLiCodeOptions] = useState<string[]>([]);
  const [srNo, setSrNo] = useState("");
  const [referDate, setReferDate] = useState("");
  const [acOpening, setAcOpening] = useState("");
  const [monthlyCapping, setMonthlyCapping] = useState("");
  const [brokerageSharing, setBrokerageSharing] = useState("");
  const [periodicity, setPeriodicity] = useState("");

  const [pmsSharing, setPmsSharing] = useState("");
  const [peaifSharing, setPeaifSharing] = useState("");
  const [mfSharing, setMfSharing] = useState("");
  const [insuranceSharing, setInsuranceSharing] = useState("");
  const [fixedIncomeSharing, setFixedIncomeSharing] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [liCodeLoading, setLiCodeLoading] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const canEditOfferFields = Boolean(frCode.trim() && liCode.trim());

  useEffect(() => {
    if (sessionStorage.getItem("fr-admin-authenticated") !== "true") {
      router.replace("/");
    }
  }, [router]);

  function handleNumericChange(
    value: string,
    setter: (nextValue: string) => void
  ) {
    if (!isValidPercentageInput(value)) return;

    setter(value);
    setErrors([]);
  }

  function validateNumericField(
    value: string,
    label: string,
    validationErrors: string[]
  ) {
    if (!value) {
      validationErrors.push(`${label} is required`);
    } else if (!isValidPercentageInput(value)) {
      validationErrors.push(`${label} must be numeric and between 0-100`);
    }
  }

  function clearOfferDetails() {
    setSrNo("");
    setReferDate("");
    setAcOpening("");
    setMonthlyCapping("");
    setBrokerageSharing("");
    setPeriodicity("");
    setPmsSharing("");
    setPeaifSharing("");
    setMfSharing("");
    setInsuranceSharing("");
    setFixedIncomeSharing("");
  }

  function bindOfferDetails(offer: OfferRecord) {
    setSrNo(fieldValue(offer.SrNo));
    setReferDate(fieldValue(offer.referDate));
    setFrCode(fieldValue(offer.frCode) || frCode);
    setLiCode(fieldValue(offer.raCode) || liCode);
    setAcOpening(fieldValue(offer.upfrontIncentive));
    setBrokerageSharing(fieldValue(offer.revShare));
    setMonthlyCapping(fieldValue(offer.monthlyCap));
    setPeriodicity(fieldValue(offer.Periodicity));
    setPmsSharing(fieldValue(offer.PMS));
    setPeaifSharing(fieldValue(offer.PE));
    setFixedIncomeSharing(fieldValue(offer.FixedIncome));
    setMfSharing(fieldValue(offer.MF));
    setInsuranceSharing(fieldValue(offer.Insurance));
  }

  async function getOfferFromCodes(frCodeValue = frCode, liCodeValue = liCode) {
    const selectedFrCode = frCodeValue.trim();
    const selectedLiCode = liCodeValue.trim();
    if (!selectedFrCode || !selectedLiCode) return;

    setErrors([]);
    setSuccessMessage("");
    setOfferLoading(true);

    try {
      const response = await fetch(
        withBasePath(`/api/incentives/offer?frCode=${encodeURIComponent(
          selectedFrCode
        )}&raCode=${encodeURIComponent(selectedLiCode)}`)
      );
      const data = await response.json();

      if (data.success && data.offer) {
        bindOfferDetails(data.offer as OfferRecord);
      } else {
        clearOfferDetails();
        setErrors([data.error || "Offer data not found for selected codes"]);
      }
    } catch (error) {
      clearOfferDetails();
      setErrors([
        error instanceof Error ? error.message : "Unable to fetch offer data",
      ]);
    } finally {
      setOfferLoading(false);
    }
  }

  async function getLiCodeFromFrCode(frCodeValue = frCode) {
    const code = frCodeValue.trim();
    if (!code) return;

    setErrors([]);
    setLiCodeLoading(true);

    try {
      const response = await fetch(
        withBasePath(
          `/api/incentives/licode?frCode=${encodeURIComponent(code)}`
        )
      );
      const data = await response.json();

      if (data.success && data.liCode) {
        const options = Array.from(
          new Set(
            ((data.records || []) as LiCodeRecord[])
              .map((record) => record.AgentUID?.toString().trim())
              .filter((code): code is string => Boolean(code))
          )
        );

        const nextOptions = options.length > 0 ? options : [data.liCode];
        setLiCodeOptions(nextOptions);
        setLiCode("");
        clearOfferDetails();
      } else {
        setLiCode("");
        setLiCodeOptions([]);
        clearOfferDetails();
        setErrors([data.error || "LI Code not found for entered FR Code"]);
      }
    } catch (error) {
      setLiCode("");
      setLiCodeOptions([]);
      clearOfferDetails();
      setErrors([
        error instanceof Error ? error.message : "Unable to fetch LI Code",
      ]);
    } finally {
      setLiCodeLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage("");
    setLoading(true);

    // Client-side validation
    const validationErrors: string[] = [];
    if (!frCode.trim()) validationErrors.push("FR Code is required");
    if (!liCode.trim()) validationErrors.push("LI Code is required");
    validateNumericField(acOpening, "A/C Opening Incentive", validationErrors);
    validateNumericField(monthlyCapping, "Monthly Capping", validationErrors);
    validateNumericField(
      brokerageSharing,
      "Brokerage Sharing %",
      validationErrors
    );
    validateNumericField(periodicity, "Periodicity", validationErrors);
    validateNumericField(pmsSharing, "PMS Sharing %", validationErrors);
    validateNumericField(peaifSharing, "PE/AIF Sharing %", validationErrors);
    validateNumericField(mfSharing, "MF Sharing %", validationErrors);
    validateNumericField(
      insuranceSharing,
      "Insurance Sharing %",
      validationErrors
    );
    validateNumericField(
      fixedIncomeSharing,
      "Fixed Income Instruments Sharing %",
      validationErrors
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(withBasePath("/api/incentives"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frCode,
          liCode,
          acOpening: Number(acOpening),
          monthlyCapping: Number(monthlyCapping),
          brokerageSharing: Number(brokerageSharing),
          periodicity,
          pmsSharing: Number(pmsSharing),
          peaifSharing: Number(peaifSharing),
          mfSharing: Number(mfSharing),
          insuranceSharing: Number(insuranceSharing),
          fixedIncomeSharing: Number(fixedIncomeSharing),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setSubmitted(true);
      } else {
        setErrors(data.errors || [data.error || "An error occurred"]);
      }
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "An error occurred",
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setFrCode("");
    setLiCode("");
    setLiCodeOptions([]);
    clearOfferDetails();
    setSubmitted(false);
    setErrors([]);
    setLiCodeLoading(false);
    setOfferLoading(false);
    setSuccessMessage("");
  }

  return (
    <main className="page">
      <section className="card">
        <div className="cardHeader">
          <h1>Incentives</h1>
          <p>Configure incentive & sharing values</p>
        </div>

        {errors.length > 0 && (
          <div className="errorBox">
            <p className="errorTitle">Validation Errors:</p>
            <ul className="errorList">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="successBox">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="twoCol">
            <div className="field">
              <label>FR Code</label>
              <input
                value={frCode}
                onChange={(e) => {
                  setFrCode(e.target.value);
                  setLiCode("");
                  setLiCodeOptions([]);
                  clearOfferDetails();
                  setErrors([]);
                }}
                onBlur={() => getLiCodeFromFrCode()}
                placeholder="Enter FR Code"
              />
            </div>

            <div className="field">
              <label>LI Code</label>
              <select
                value={liCode}
                onChange={async (e) => {
                  const nextLiCode = e.target.value;
                  setLiCode(nextLiCode);
                  setErrors([]);
                  await getOfferFromCodes(frCode, nextLiCode);
                }}
                disabled={liCodeLoading || liCodeOptions.length === 0}
              >
                <option value="">
                  {liCodeLoading ? "Fetching LI Code..." : "Select LI Code"}
                </option>
                {liCodeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="twoCol">
            <div className="field">
              <label>A/C Opening Incentive</label>
              <input
                value={acOpening}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setAcOpening)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field">
              <label>Monthly Capping (A/c opening incentive)</label>
              <input
                value={monthlyCapping}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setMonthlyCapping)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field">
              <label>Brokerage Sharing %</label>
              <input
                value={brokerageSharing}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setBrokerageSharing)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field">
              <label>Periodicity</label>
              <input
                value={periodicity}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setPeriodicity)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>
          </div>

          <hr />

          <h2 className="sectionTitle">Product Incentive</h2>

          <div className="twoCol">
            <div className="field">
              <label>PMS Sharing %</label>
              <input
                value={pmsSharing}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setPmsSharing)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field">
              <label>PE/AIF Sharing %</label>
              <input
                value={peaifSharing}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setPeaifSharing)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field">
              <label>MF Sharing %</label>
              <input
                value={mfSharing}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setMfSharing)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field">
              <label>Insurance Sharing %</label>
              <input
                value={insuranceSharing}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setInsuranceSharing)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>

            <div className="field fullWidth">
              <label>Fixed Income Instruments Sharing %</label>
              <input
                value={fixedIncomeSharing}
                onChange={(e) =>
                  handleNumericChange(e.target.value, setFixedIncomeSharing)
                }
                disabled={!canEditOfferFields}
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                placeholder=""
              />
            </div>
          </div>

          {offerLoading && (
            <div className="infoBox">Fetching offer details...</div>
          )}

          <div className="buttonRow">
            <button type="button" className="clearButton" onClick={handleClear}>
              Clear
            </button>
            <button
              type="submit"
              className="submitButton"
              disabled={loading || !canEditOfferFields}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
